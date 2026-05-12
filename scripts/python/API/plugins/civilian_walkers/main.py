import asyncio
import math
import random
import re

from data.unit_spawn_table import UnitSpawnTable
from data.data_types import LatLng

from api import API
from plugin_base import Plugin

# Runtime guard – set True only on the very first call to on_update
FIRST_RUN = None
counter = 0
group_counter = 0


class CivilianUnit:
    """Represents a single civilian pedestrian managed by the plugin."""

    def __init__(self, owner_plugin, unit_id: str, location: LatLng):
        self.owner_plugin = owner_plugin
        self.unit_id = unit_id
        self.location = location
        self.api: API | None = None
        self.logger = owner_plugin.logger

    def spawn(self, api: API):
        global counter, group_counter
        self.api = api

        # Re-use existing unit position if one with the same name already lives
        existing_units = api.update_units()
        target_name = f"{self.owner_plugin.unit_name_prefix}_{counter}"
        for u in existing_units.values():
            if u.unit_name == target_name and u.alive:
                self.location = u.position
                self.location.lat += random.uniform(-0.000001, 0.000001)
                self.location.lng += random.uniform(-0.000001, 0.000001)
                break

        units = [
            UnitSpawnTable(
                name=target_name,
                unit_type=self.owner_plugin.unit_type,
                location=self.location,
                skill="Average",
                livery_id=self.owner_plugin.unit_livery,
                altitude=0,
                heading=random.randint(0, 360),
            )
        ]

        group_name = f"{self.owner_plugin.unit_name_prefix}_grp_{group_counter}"
        counter += 1

        api.spawn_ground_units(
            units=units,
            coalition="neutral",
            country="",
            immediate=True,
            spawnPoints=0,
            groupName=group_name,
            execution_callback=self.execution_callback,
        )
        group_counter += 1
        self.logger.info(
            f"Spawning civilian unit {target_name} at {self.location} (group {group_name})"
        )

    async def execution_callback(self, command_result):
        self.owner_plugin.register_pending_spawn(command_result)
        self.owner_plugin.try_initialize_pending_spawns()


class CivilianWalkers(Plugin):
    """
    CivilianWalkers plugin – spawns neutral civilian pedestrians that
    wander around village/town-centre zones (TC-<name>-<n> triggers).

    Config keys (under plugin_settings.CivilianWalkers):
        unit_type          DCS unit type string  (default: "Infantry AK Ins")
        unit_name_prefix   Prefix for unit / group names  (default: "CIV")
        unit_livery        Livery string passed to DCS     (default: "")
        min_group_size     Min civilians per spawn batch   (default: 1)
        max_group_size     Max civilians per spawn batch   (default: 3)
        min_groups_per_town Min spawn batches per town     (default: 1)
        max_groups_per_town Max spawn batches per town     (default: 3)
        walk_speed         Movement speed in m/s           (default: 1.2)
        patrol_radius      Max wander radius in metres     (default: 250)
        wait_min_s         Min seconds to pause at waypoint (default: 8)
        wait_max_s         Max seconds to pause at waypoint (default: 25)
        max_units          Hard cap on total spawned units  (default: 150)
    """

    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        cfg = global_config.get("plugin_settings", {}).get(plugin_info.get("name"), {})

        self.unit_type = cfg.get("unit_type", "Infantry AK Ins")
        self.unit_name_prefix = cfg.get("unit_name_prefix", "CIV")
        self.unit_livery = cfg.get("unit_livery", "")
        self.min_group_size = int(cfg.get("min_group_size", 1))
        self.max_group_size = int(cfg.get("max_group_size", 3))
        self.min_groups_per_town = int(cfg.get("min_groups_per_town", 1))
        self.max_groups_per_town = int(cfg.get("max_groups_per_town", 3))
        self.walk_speed = float(cfg.get("walk_speed", 1.2))
        self.patrol_radius = float(cfg.get("patrol_radius", 250))
        self.wait_min_s = float(cfg.get("wait_min_s", 8))
        self.wait_max_s = float(cfg.get("wait_max_s", 25))
        self.max_units = int(cfg.get("max_units", 150))

        self.pending_spawn_initializations: dict[int, str] = {}
        self.api: API | None = None

    # ------------------------------------------------------------------
    # Plugin lifecycle
    # ------------------------------------------------------------------

    def on_start(self) -> bool:
        try:
            global FIRST_RUN
            runtime = self.global_config.setdefault("civilian_walkers_runtime", {})
            first_run_key = "civilian_walkers_first_run_done"

            if not runtime.get(first_run_key, False):
                self.logger.info("CivilianWalkers: performing first-run setup.")
                runtime[first_run_key] = True
                FIRST_RUN = True
            else:
                FIRST_RUN = False
                self.logger.info("CivilianWalkers: skipping first-run (already done).")

            self.api = API(
                saved_games_folder=self.global_config.get("dcs_saved_games_folder", "."),
                load_kokoro=False,
                load_whisper=False,
                SRS_folder=self.global_config.get("SRS_folder", "."),
            )
            self.api.register_on_update_callback(self.on_update)
            self.api.run()
            self.logger.info("CivilianWalkers plugin started successfully.")
            return True
        except Exception as e:
            self.logger.error(f"CivilianWalkers failed to start: {e}", exc_info=True)
            return False

    def on_stop(self) -> bool:
        try:
            self.api.stop()
            self.api = None
            self.logger.info("CivilianWalkers plugin stopped.")
            return True
        except Exception as e:
            self.logger.error(f"CivilianWalkers failed to stop: {e}", exc_info=True)
            return False

    def on_pause(self) -> bool:
        self.logger.info("CivilianWalkers paused.")
        return True

    def on_resume(self) -> bool:
        self.logger.info("CivilianWalkers resumed.")
        return True

    # ------------------------------------------------------------------
    # Main update loop
    # ------------------------------------------------------------------

    def on_update(self, api: API):
        global FIRST_RUN

        if FIRST_RUN is None:
            self.watchdog_tick()
            return

        if FIRST_RUN:
            self._first_run_spawn(api)
            FIRST_RUN = False
            self.watchdog_tick()
            return

        # Normal per-update logic
        units = self.api.get_units()
        self._apply_pending_spawn_initializations(units)

        current_time = asyncio.get_event_loop().time()
        town_centres = self._get_town_centre_zones()

        for unit_object in units.values():
            if hasattr(unit_object, "_civ_walker_state"):
                self._handle_unit(unit_object, town_centres, current_time)

        self.watchdog_tick()

    # ------------------------------------------------------------------
    # First-run spawn
    # ------------------------------------------------------------------

    def _first_run_spawn(self, api: API):
        global counter
        town_centres = self._get_town_centre_zones()
        if not town_centres:
            self.logger.info("CivilianWalkers: no TC- zones found, nothing to spawn.")
            return

        for tc in town_centres:
            # Prefer a linked larger zone when available (matched by base name)
            linked = tc.get("linked_large_zone")
            if linked:
                tc_loc = linked.get("location", {})
                tc_pos = LatLng(
                    float(tc_loc.get("lat")),
                    float(tc_loc.get("lng", tc_loc.get("lon"))),
                    float(tc_loc.get("alt", 0)),
                )
                tc_radius = float(linked.get("radius", tc.get("radius", self.patrol_radius)))
            else:
                tc_loc = tc.get("location", {})
                tc_pos = LatLng(
                    float(tc_loc.get("lat")),
                    float(tc_loc.get("lng", tc_loc.get("lon"))),
                    float(tc_loc.get("alt", 0)),
                )
                tc_radius = float(tc.get("radius", self.patrol_radius))

            num_groups = random.randint(self.min_groups_per_town, self.max_groups_per_town)
            for _ in range(num_groups):
                if counter >= self.max_units:
                    self.logger.warning("CivilianWalkers: max_units cap reached, stopping spawn.")
                    return

                group_size = random.randint(self.min_group_size, self.max_group_size)
                # Spread the group around a random road-like point within the zone
                anchor = tc_pos.project_with_bearing_and_distance(
                    random.uniform(0, tc_radius * 0.8),
                    random.randint(0, 360),
                )
                for j in range(group_size):
                    if counter >= self.max_units:
                        return
                    spawn_pos = anchor.project_with_bearing_and_distance(
                        random.uniform(2, 8), random.randint(0, 360)
                    )
                    civ_unit = CivilianUnit(
                        owner_plugin=self,
                        unit_id=f"civ_{tc.get('name', '')}_{_}_{j}",
                        location=spawn_pos,
                    )
                    civ_unit.spawn(api)

    # ------------------------------------------------------------------
    # Per-unit state machine
    # ------------------------------------------------------------------

    def _handle_unit(self, unit_object, town_centres, current_time):
        state = unit_object._civ_walker_state
        is_active = getattr(unit_object, "_civ_walker_active", False)

        if state == "idle" or (state == "waiting" and not is_active):
            self._start_walk(unit_object, town_centres, current_time)
        elif state == "waiting" and is_active:
            # Waiting at a waypoint – check if dwell time is over
            resume_at = getattr(unit_object, "_civ_walker_resume_at", 0)
            if current_time >= resume_at:
                unit_object._civ_walker_active = False
                self._start_walk(unit_object, town_centres, current_time)
        # "walking" state is handled via destination-reached callback

    def _start_walk(self, unit_object, town_centres, current_time):
        """Pick a new waypoint within the unit's home zone and begin walking."""
        home_zone = self._get_home_zone(unit_object, town_centres)
        if not home_zone:
            return
        # If the town-centre has a linked larger zone, use that centre and radius
        linked = home_zone.get("linked_large_zone") if isinstance(home_zone, dict) else None
        if linked:
            loc = linked.get("location", {})
            zone_radius = float(linked.get("radius", home_zone.get("radius", self.patrol_radius)))
        else:
            loc = home_zone.get("location", {})
            zone_radius = float(home_zone.get("radius", self.patrol_radius))
        try:
            zone_centre = LatLng(
                float(loc.get("lat")),
                float(loc.get("lng", loc.get("lon"))),
                float(loc.get("alt", 0)),
            )
        except (TypeError, ValueError):
            self.logger.warning(
                f"CivilianWalkers: bad zone location for {home_zone.get('name', '')}"
            )
            return

        # Target a random point on a bearing from the zone centre, as if on a road
        max_r = min(zone_radius, self.patrol_radius)
        waypoint = zone_centre.project_with_bearing_and_distance(
            random.uniform(10, max_r),
            random.randint(0, 360),
        )

        unit_object.set_path([waypoint])
        # Ensure unit will follow roads while moving
        try:
            if hasattr(unit_object, "set_follow_roads"):
                unit_object.set_follow_roads(True)
            elif hasattr(unit_object, "follow_roads"):
                unit_object.follow_roads = True
        except Exception:
            self.logger.debug(f"CivilianWalkers: could not set follow_roads for {unit_object.unit_id}")
        unit_object.set_speed(self.walk_speed)
        unit_object._civ_walker_state = "walking"
        unit_object._civ_walker_active = True
        unit_object._civ_walker_home_zone = home_zone.get("name", "")

        try:
            unit_object.register_on_destination_reached_callback(
                lambda u, reached: self._on_destination_reached(u, reached),
                waypoint,
                threshold=15,
            )
        except Exception:
            self.logger.warning(
                f"CivilianWalkers: could not register destination callback for {unit_object.unit_id}"
            )

        self.logger.info(
            f"CivilianWalkers: unit {unit_object.unit_id} walking to {waypoint} in zone {home_zone.get('name', '')}"
        )

    def _on_destination_reached(self, unit_object, reached):
        if not reached:
            return
        # Transition to waiting/dwell pause
        dwell = random.uniform(self.wait_min_s, self.wait_max_s)
        try:
            unit_object.set_speed(0)
        except Exception:
            pass
        unit_object._civ_walker_state = "waiting"
        unit_object._civ_walker_active = True
        unit_object._civ_walker_resume_at = asyncio.get_event_loop().time() + dwell
        self.logger.info(
            f"CivilianWalkers: unit {unit_object.unit_id} reached waypoint, "
            f"waiting {dwell:.1f}s."
        )

    def _get_home_zone(self, unit_object, town_centres):
        """Return the town-centre zone this unit was spawned in, falling back to nearest."""
        home_name = getattr(unit_object, "_civ_walker_home_zone", None)
        if home_name:
            for tc in town_centres:
                if tc.get("name", "") == home_name:
                    return tc

        # Fallback: find nearest TC zone by current position
        position = self._coerce_latlng(unit_object.position)
        return self._get_nearest_zone(position, town_centres)

    # ------------------------------------------------------------------
    # Pending spawn initialization helpers
    # ------------------------------------------------------------------

    def register_pending_spawn(self, command_result):
        for result_id in self._normalize_result_ids(command_result):
            self.pending_spawn_initializations[result_id] = "idle"

    def try_initialize_pending_spawns(self):
        if self.api:
            self._apply_pending_spawn_initializations(self.api.get_units())

    def _apply_pending_spawn_initializations(self, units):
        if not self.pending_spawn_initializations:
            return
        resolved = []
        for result_id, state in self.pending_spawn_initializations.items():
            for unit_object in units.values():
                if self._unit_matches(unit_object, result_id):
                    self._initialize_unit(unit_object, state)
                    resolved.append(result_id)
                    break
        for rid in resolved:
            del self.pending_spawn_initializations[rid]

    def _initialize_unit(self, unit_object, state):
        unit_object._civ_walker_state = state
        unit_object._civ_walker_active = False
        unit_object._civ_walker_home_zone = None
        unit_object._civ_walker_resume_at = 0.0

    def _normalize_result_ids(self, command_result):
        if isinstance(command_result, list):
            ids = []
            for v in command_result:
                rid = self._coerce_id(v)
                if rid is not None:
                    ids.append(rid)
            return ids
        rid = self._coerce_id(command_result)
        return [rid] if rid is not None else []

    def _coerce_id(self, value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    def _unit_matches(self, unit_object, result_id):
        return (
            getattr(unit_object, "unit_id", None) == result_id
            or getattr(unit_object, "ID", None) == result_id
        )

    # ------------------------------------------------------------------
    # Zone helpers
    # ------------------------------------------------------------------

    def _get_town_centre_zones(self):
        """Return all TC-<name>-<n> triggers from the current mission."""
        try:
            mission = self.api.update_mission()
            triggers = mission.get("triggers", {})
            town_centres = []
            all_triggers = list(triggers.values())
            for trigger in all_triggers:
                zone_name = trigger.get("name", "")
                m = re.match(r"^[tT][cC]-(.+)-\d+$", zone_name)
                if not m:
                    continue
                base = m.group(1).lower()
                # copy so we don't mutate mission data
                tc_copy = dict(trigger)
                # find a matching larger zone whose name contains the base and is not a TC- prefixed zone
                best = None
                best_radius = -1
                for cand in all_triggers:
                    cand_name = cand.get("name", "").lower()
                    if base in cand_name and not re.match(r"^[tT][cC]-", cand.get("name", "")):
                        try:
                            r = float(cand.get("radius", 0))
                        except Exception:
                            r = 0
                        if r > best_radius:
                            best_radius = r
                            best = cand
                if best:
                    tc_copy["linked_large_zone"] = best
                town_centres.append(tc_copy)
            return town_centres
        except Exception as e:
            self.logger.error(f"CivilianWalkers: error reading zones: {e}", exc_info=True)
            return []

    def _get_nearest_zone(self, position, zones):
        nearest = None
        nearest_dist = float("inf")
        try:
            p_lat = float(position.lat)
            p_lng = float(position.lng)
        except Exception:
            return None
        for zone in zones:
            loc = zone.get("location", {})
            try:
                z_lat = float(loc.get("lat"))
                z_lng = float(loc.get("lng", loc.get("lon")))
            except (TypeError, ValueError):
                continue
            dist = math.sqrt((p_lat - z_lat) ** 2 + (p_lng - z_lng) ** 2)
            if dist < nearest_dist:
                nearest_dist = dist
                nearest = zone
        return nearest

    def _coerce_latlng(self, position):
        if isinstance(position, LatLng):
            return position
        try:
            return LatLng(
                float(position.get("lat")),
                float(position.get("lng", position.get("lon"))),
                float(position.get("alt", 0)),
            )
        except Exception:
            return position
