"""
SailingShips plugin for DCS Olympus API.

Spawns neutral sailing ships that navigate from Sail-Home through ocean
waypoints (Sail-1, Sail-2, …) to destination ports (Sail-Port-1, …) using
a realistic wind-aware speed model with tacking when beating to windward.

Zone naming convention (DCS trigger zones):
    Sail-Home        – spawn / home port
    Sail-1, Sail-2…  – ocean waypoints (visited in nearest-unvisited order)
    Sail-Port-1, 2…  – destination ports
"""

import asyncio
import math
import random
import re

from data.unit_spawn_table import UnitSpawnTable
from data.data_types import LatLng

from api import API
from plugin_base import Plugin

# ---------------------------------------------------------------------------
# Module-level globals (survive across update ticks, reset on plugin reload)
# ---------------------------------------------------------------------------
FIRST_RUN = None
counter = 0
group_counter = 0

KNOTS_TO_MS = 0.5144   # 1 knot = 0.5144 m/s


# ---------------------------------------------------------------------------
# Sailing-physics helpers
# ---------------------------------------------------------------------------

def _true_wind_angle(ship_heading: float, wind_from: float) -> float:
    """
    Return the True Wind Angle (TWA) in [0, 180].
      0   = heading directly into wind (headwind)
      90  = beam reach
      180 = running (wind dead astern)
    """
    diff = abs((ship_heading - wind_from + 360) % 360)
    return diff if diff <= 180 else 360 - diff


def _sail_speed_ms(ship_heading: float, wind_from: float,
                   wind_knots: float, max_knots: float) -> float:
    """
    Return sailing speed in m/s based on the point of sail.
    Speed scales linearly with wind strength and is capped at max_knots.
    """
    twa = _true_wind_angle(ship_heading, wind_from)
    w = wind_knots

    if twa < 40:
        # No-go zone / hard beat – ~3 kn max
        knots = min(3.0, w * 0.20)
    elif twa < 65:
        # Close-hauled
        t = (twa - 40) / 25.0
        knots = 3.0 + t * max(0.0, w * 0.55 - 3.0)
    elif twa < 90:
        # Close reach
        t = (twa - 65) / 25.0
        knots = w * 0.55 + t * (w * 0.70 - w * 0.55)
    elif twa < 110:
        # Beam reach
        knots = w * 0.75
    elif twa < 150:
        # Broad reach – fastest point of sail
        knots = min(max_knots, w * 0.85)
    else:
        # Dead run – slightly less efficient than broad reach
        knots = min(max_knots, w * 0.75)

    knots = max(0.5, min(knots, max_knots))
    return knots * KNOTS_TO_MS


def _needs_tacking(required_bearing: float, wind_from: float,
                   no_go_half: float) -> bool:
    """Return True if the desired course falls in the upwind no-go zone."""
    return _true_wind_angle(required_bearing, wind_from) < no_go_half


def _tack_bearings(wind_from: float, no_go_half: float,
                   margin: float = 5.0) -> tuple:
    """
    Return (port_tack_bearing, starboard_tack_bearing) – the two courses
    just outside the no-go zone, used when beating to windward.
    """
    into_wind = wind_from   # direction wind comes FROM; heading here = sailing into wind
    port_tack = (into_wind + no_go_half + margin) % 360
    stbd_tack = (into_wind - no_go_half - margin + 360) % 360
    return port_tack, stbd_tack


# ---------------------------------------------------------------------------
# Ship spawner helper
# ---------------------------------------------------------------------------

class _ShipSpawner:
    """Handles one-shot spawning of a single navy unit."""

    def __init__(self, owner_plugin, ship_id: str, location: LatLng,
                 payload: dict = None):
        self.owner_plugin = owner_plugin
        self.ship_id = ship_id
        self.location = location
        self.logger = owner_plugin.logger
        # Optional init payload forwarded to _init_ship via register_pending_spawn
        self.payload = payload or {"state": "idle"}

    def spawn(self, api: API):
        global counter, group_counter
        target_name = f"{self.owner_plugin.unit_name_prefix}_{counter}"
        group_name = f"{self.owner_plugin.unit_name_prefix}_grp_{group_counter}"
        counter += 1

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

        api.spawn_navy_units(
            units=units,
            coalition="neutral",
            country="",
            immediate=True,
            spawnPoints=0,
            groupName=group_name,
            execution_callback=self.execution_callback,
        )
        group_counter += 1
        self.logger.info(f"SailingShips: spawning {target_name} at {self.location}")

    async def execution_callback(self, command_result):
        self.owner_plugin.register_pending_spawn(command_result, self.payload)
        self.owner_plugin.try_initialize_pending_spawns()


# ---------------------------------------------------------------------------
# Main plugin class
# ---------------------------------------------------------------------------

class SailingShips(Plugin):
    """
    Spawns neutral sailing ships that navigate between Sail-* trigger zones
    using a wind-aware speed model and tacking when beating to windward.

    Config keys (under plugin_settings.SailingShips):
        unit_type               DCS unit type string       (default: "speedboat")
        unit_name_prefix        Unit/group name prefix     (default: "SHIP")
        unit_livery             DCS livery ID              (default: "")
        max_ships               Max ships to spawn         (default: 10)
        wind_speed_knots        Static wind speed (kn)     (default: 12.0)
        wind_from_deg           Wind FROM direction (°)    (default: 270.0)
        max_speed_knots         Hard cap on sail speed     (default: 12.0)
        no_go_angle_deg         No-go zone half-angle (°)  (default: 40.0)
        port_wait_min_s         Min dwell at port (s)      (default: 840)
        port_wait_max_s         Max dwell at port (s)      (default: 960)
        tack_leg_min_m          Min length of one tack leg (m) (default: 185)
        tack_leg_max_m          Max length of one tack leg (m) (default: 280)
        arrival_threshold_m     Waypoint arrival radius    (default: 200)
    """

    def __init__(self, plugin_info, global_config=None):
        super().__init__(plugin_info, global_config)
        cfg = (global_config or {}).get("plugin_settings", {}).get(
            plugin_info.get("name"), {}
        )
        self.unit_type = cfg.get("unit_type", "speedboat")
        self.unit_name_prefix = cfg.get("unit_name_prefix", "SHIP")
        self.unit_livery = cfg.get("unit_livery", "")
        self.max_ships = int(cfg.get("max_ships", 10))
        self.wind_speed_knots = float(cfg.get("wind_speed_knots", 12.0))
        self.wind_from_deg = float(cfg.get("wind_from_deg", 270.0))
        self.max_speed_knots = float(cfg.get("max_speed_knots", 12.0))
        self.no_go_angle_deg = float(cfg.get("no_go_angle_deg", 40.0))
        self.port_wait_min_s = float(cfg.get("port_wait_min_s", 840.0))
        self.port_wait_max_s = float(cfg.get("port_wait_max_s", 960.0))
        self.tack_leg_min_m = float(cfg.get("tack_leg_min_m", 185.0))
        self.tack_leg_max_m = float(cfg.get("tack_leg_max_m", 280.0))
        self.arrival_threshold_m = float(cfg.get("arrival_threshold_m", 200.0))

        self.pending_spawn_initializations: dict = {}
        self.api: API | None = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def on_start(self) -> bool:
        global FIRST_RUN
        try:
            runtime = self.global_config.setdefault("sailing_ships_runtime", {})
            key = "sailing_ships_first_run_done"
            if not runtime.get(key, False):
                self.logger.info("SailingShips: first-run setup.")
                runtime[key] = True
                FIRST_RUN = True
            else:
                FIRST_RUN = False
                self.logger.info("SailingShips: skipping first-run.")

            self.api = API(
                saved_games_folder=self.global_config.get("dcs_saved_games_folder", "."),
                load_kokoro=False,
                load_whisper=False,
                SRS_folder=self.global_config.get("SRS_folder", "."),
            )
            self.api.register_on_update_callback(self.on_update)
            self.api.run()
            self.logger.info("SailingShips started.")
            return True
        except Exception as e:
            self.logger.error(f"SailingShips failed to start: {e}", exc_info=True)
            return False

    def on_stop(self) -> bool:
        try:
            self.api.stop()
            self.api = None
            return True
        except Exception as e:
            self.logger.error(f"SailingShips failed to stop: {e}", exc_info=True)
            return False

    def on_pause(self) -> bool:
        return True

    def on_resume(self) -> bool:
        return True

    # ------------------------------------------------------------------
    # Update loop
    # ------------------------------------------------------------------

    def on_update(self, api: API):
        global FIRST_RUN
        if FIRST_RUN is None:
            self.watchdog_tick()
            return

        zones = self._get_sail_zones()

        if FIRST_RUN:
            self._first_run_spawn(api, zones)
            FIRST_RUN = False
            self.watchdog_tick()
            return

        units = self.api.get_units()
        self._apply_pending_spawn_initializations(units)

        current_time = asyncio.get_event_loop().time()
        for unit_object in units.values():
            if hasattr(unit_object, "_sail_state"):
                self._handle_ship(unit_object, zones, current_time)

        self.watchdog_tick()

    # ------------------------------------------------------------------
    # First-run spawn
    # ------------------------------------------------------------------

    def _first_run_spawn(self, api: API, zones: dict):
        homes = zones.get("homes", [])
        ports = zones.get("ports", [])
        waypoints = zones.get("waypoints", [])

        if not homes:
            self.logger.warning("SailingShips: no 'Sail-Home-N' zones found — cannot spawn.")
            return
        if not ports:
            self.logger.warning("SailingShips: no 'Sail-Port-N' zones found — cannot spawn.")
            return

        # Use ocean waypoints as scatter points; fall back to home zones if none exist
        spawn_pool = waypoints if waypoints else homes

        for i in range(self.max_ships):
            spawn_zone = spawn_pool[i % len(spawn_pool)]
            loc = spawn_zone.get("location", {})
            try:
                spawn_centre = LatLng(
                    float(loc["lat"]),
                    float(loc.get("lng", loc.get("lon"))),
                    0,
                )
            except (KeyError, TypeError, ValueError) as e:
                self.logger.error(f"SailingShips: invalid spawn zone location: {e}")
                continue

            spawn_r = float(spawn_zone.get("radius", 300))
            spawn_pos = spawn_centre.project_with_bearing_and_distance(
                random.uniform(10, max(10, spawn_r * 0.8)),
                random.randint(0, 360),
            )

            # 50 % chance heading home, 50 % to a random port
            if random.random() < 0.5:
                dest_zone = random.choice(homes)
            else:
                dest_zone = random.choice(ports)

            # Pre-mark the spawn waypoint as visited so the ship moves on
            spawn_wp_name = spawn_zone.get("name", "")
            payload = {
                "state": "underway",
                "dest": dest_zone,
                "visited": {spawn_wp_name},
            }

            self.logger.info(
                f"SailingShips: ship {i} scattered at {spawn_wp_name} "
                f"→ {dest_zone.get('name', '?')}"
            )
            _ShipSpawner(self, f"ship_{i}", spawn_pos, payload=payload).spawn(api)

    # ------------------------------------------------------------------
    # Per-ship state machine
    # ------------------------------------------------------------------

    def _handle_ship(self, unit_object, zones: dict, current_time: float):
        state = unit_object._sail_state
        active = getattr(unit_object, "_sail_active", False)

        if state == "idle":
            self._assign_destination(unit_object, zones, from_home=True)

        elif state == "underway" and not active:
            is_tacking = getattr(unit_object, "_sail_is_tacking", False)

            if is_tacking:
                # A tack leg just completed — check if we're now close enough
                # to the intended target; if not, issue the next tack.
                final_target = getattr(unit_object, "_sail_final_target", None)
                final_name = getattr(unit_object, "_sail_final_name", "")
                final_is_port = getattr(unit_object, "_sail_final_is_port", False)
                if final_target is not None:
                    pos = self._coerce_latlng(unit_object.position)
                    if pos.distance_to(final_target) < self.arrival_threshold_m:
                        self._handle_leg_arrival(unit_object, final_name,
                                                 final_is_port, zones, current_time)
                    else:
                        self._issue_sail_leg(unit_object, final_target,
                                             final_name, final_is_port)
            else:
                # A direct leg just completed — we've arrived at the target.
                final_name = getattr(unit_object, "_sail_final_name", "")
                final_is_port = getattr(unit_object, "_sail_final_is_port", False)
                self._handle_leg_arrival(unit_object, final_name,
                                         final_is_port, zones, current_time)

        elif state == "at_port" and active:
            if current_time >= getattr(unit_object, "_sail_depart_at", 0):
                unit_object._sail_active = False
                self._assign_destination(unit_object, zones, from_home=False)

    def _handle_leg_arrival(self, unit_object, leg_name: str,
                            is_port: bool, zones: dict, current_time: float):
        if is_port:
            self._handle_port_arrival(unit_object, leg_name, current_time)
        else:
            unit_object._sail_visited.add(leg_name)
            self._next_leg(unit_object, zones)

    def _assign_destination(self, unit_object, zones: dict, from_home: bool):
        """Pick a destination port (or a random home zone) and start navigating."""
        ports = zones.get("ports", [])
        homes = zones.get("homes", [])

        if not ports:
            return

        if from_home:
            dest = random.choice(ports)
        else:
            current = getattr(unit_object, "_sail_dest_name", None)
            others = [p for p in ports if p.get("name") != current]
            if random.random() < 0.5 and homes:
                dest = random.choice(homes)
            else:
                dest = random.choice(others) if others else random.choice(ports)

        unit_object._sail_dest = dest
        unit_object._sail_dest_name = dest.get("name", "")
        unit_object._sail_visited = set()
        unit_object._sail_state = "underway"
        unit_object._sail_active = False
        unit_object._sail_tack_side = 1
        unit_object._sail_final_target = None
        self.logger.info(
            f"SailingShips: ship {unit_object.unit_id} bound for "
            f"{unit_object._sail_dest_name}"
        )
        self._next_leg(unit_object, zones)

    def _next_leg(self, unit_object, zones: dict):
        """
        Decide the next immediate navigation target:
          - The nearest unvisited Sail-N ocean waypoint, or
          - The destination if it's closer than any remaining waypoint.
        """
        dest = getattr(unit_object, "_sail_dest", None)
        if dest is None:
            return

        visited = getattr(unit_object, "_sail_visited", set())
        waypoints = zones.get("waypoints", [])
        pos = self._coerce_latlng(unit_object.position)

        dest_loc = dest.get("location", {})
        try:
            dest_pos = LatLng(
                float(dest_loc["lat"]),
                float(dest_loc.get("lng", dest_loc.get("lon"))),
                0,
            )
        except (KeyError, TypeError, ValueError):
            self.logger.warning("SailingShips: bad destination location.")
            return

        dist_to_dest = pos.distance_to(dest_pos)

        # Find nearest unvisited ocean waypoint
        nearest_wp = None
        nearest_dist = float("inf")
        nearest_wp_pos = None
        for wp in waypoints:
            if wp.get("name", "") in visited:
                continue
            wloc = wp.get("location", {})
            try:
                wp_pos = LatLng(
                    float(wloc["lat"]),
                    float(wloc.get("lng", wloc.get("lon"))),
                    0,
                )
            except (KeyError, TypeError, ValueError):
                continue
            d = pos.distance_to(wp_pos)
            if d < nearest_dist:
                nearest_dist = d
                nearest_wp = wp
                nearest_wp_pos = wp_pos

        if nearest_wp is None or dist_to_dest <= nearest_dist:
            # Go straight to destination
            self._issue_sail_leg(unit_object, dest_pos,
                                 dest.get("name", "dest"), is_port=True)
        else:
            self._issue_sail_leg(unit_object, nearest_wp_pos,
                                 nearest_wp.get("name", "wp"), is_port=False)

    def _issue_sail_leg(self, unit_object, target_pos: LatLng,
                        target_name: str, is_port: bool):
        """
        Issue movement toward target_pos.  If the course falls inside the
        upwind no-go zone, issue an alternating tack leg instead and set
        _sail_is_tacking = True so the update loop knows to continue tacking.
        """
        pos = self._coerce_latlng(unit_object.position)
        required_bearing = pos.bearing_to(target_pos)

        # Store the actual intended target so tacking logic can reference it
        unit_object._sail_final_target = target_pos
        unit_object._sail_final_name = target_name
        unit_object._sail_final_is_port = is_port

        if _needs_tacking(required_bearing, self.wind_from_deg, self.no_go_angle_deg):
            tack_side = getattr(unit_object, "_sail_tack_side", 1)
            port_tack, stbd_tack = _tack_bearings(
                self.wind_from_deg, self.no_go_angle_deg
            )
            tack_course = port_tack if tack_side > 0 else stbd_tack
            unit_object._sail_tack_side = -tack_side  # flip for next tack

            # Pick a random leg length, capped to half remaining distance
            # so the ship doesn't overshoot sideways on the final approach.
            remaining = pos.distance_to(target_pos)
            leg_m = random.uniform(self.tack_leg_min_m, self.tack_leg_max_m)
            leg_m = min(leg_m, max(self.tack_leg_min_m, remaining * 0.5))
            immediate = pos.project_with_bearing_and_distance(leg_m, tack_course)
            speed_ms = _sail_speed_ms(
                tack_course, self.wind_from_deg,
                self.wind_speed_knots, self.max_speed_knots
            )
            unit_object._sail_is_tacking = True
            self.logger.info(
                f"SailingShips: {unit_object.unit_id} tacking "
                f"({'port' if tack_side > 0 else 'stbd'} tack {tack_course:.0f}°, "
                f"need {required_bearing:.0f}°, "
                f"{speed_ms / KNOTS_TO_MS:.1f} kn)"
            )
        else:
            immediate = target_pos
            speed_ms = _sail_speed_ms(
                required_bearing, self.wind_from_deg,
                self.wind_speed_knots, self.max_speed_knots
            )
            unit_object._sail_is_tacking = False
            self.logger.info(
                f"SailingShips: {unit_object.unit_id} sailing direct to "
                f"{target_name} bearing {required_bearing:.0f}° "
                f"({speed_ms / KNOTS_TO_MS:.1f} kn)"
            )

        unit_object.set_path([immediate])
        unit_object.set_speed(speed_ms)
        unit_object._sail_active = True

        def _on_leg_done(u, reached):
            if reached:
                u._sail_active = False

        try:
            unit_object.register_on_destination_reached_callback(
                _on_leg_done, immediate, threshold=self.arrival_threshold_m
            )
        except Exception:
            pass

    def _handle_port_arrival(self, unit_object, port_name: str, current_time: float):
        try:
            unit_object.set_speed(0)
        except Exception:
            pass
        dwell = random.uniform(self.port_wait_min_s, self.port_wait_max_s)
        unit_object._sail_state = "at_port"
        unit_object._sail_active = True
        unit_object._sail_depart_at = asyncio.get_event_loop().time() + dwell
        unit_object._sail_visited = set()
        self.logger.info(
            f"SailingShips: {unit_object.unit_id} arrived at {port_name}, "
            f"departing in {dwell / 60:.1f} min"
        )

    # ------------------------------------------------------------------
    # Pending spawn initialization
    # ------------------------------------------------------------------

    def register_pending_spawn(self, command_result, payload: dict = None):
        if payload is None:
            payload = {"state": "idle"}
        for rid in self._normalize_ids(command_result):
            self.pending_spawn_initializations[rid] = payload

    def try_initialize_pending_spawns(self):
        if self.api:
            self._apply_pending_spawn_initializations(self.api.get_units())

    def _apply_pending_spawn_initializations(self, units):
        if not self.pending_spawn_initializations:
            return
        resolved = []
        for rid, payload in self.pending_spawn_initializations.items():
            for u in units.values():
                if self._unit_matches(u, rid):
                    self._init_ship(u, payload)
                    resolved.append(rid)
                    break
        for rid in resolved:
            del self.pending_spawn_initializations[rid]

    def _init_ship(self, unit_object, payload):
        # payload may be a plain state string (legacy) or a dict
        if isinstance(payload, str):
            payload = {"state": payload}
        unit_object._sail_state = payload.get("state", "idle")
        unit_object._sail_active = False
        unit_object._sail_dest = payload.get("dest", None)
        unit_object._sail_dest_name = (payload["dest"].get("name", "")
                                       if payload.get("dest") else "")
        unit_object._sail_visited = set(payload.get("visited", set()))
        unit_object._sail_depart_at = 0.0
        unit_object._sail_tack_side = 1
        unit_object._sail_is_tacking = False
        unit_object._sail_final_target = None
        unit_object._sail_final_name = ""
        unit_object._sail_final_is_port = False

    def _normalize_ids(self, command_result):
        if isinstance(command_result, list):
            return [i for i in (self._coerce_id(v) for v in command_result) if i is not None]
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

    def _get_sail_zones(self) -> dict:
        """Parse all Sail-* trigger zones from the current mission."""
        result = {"homes": [], "waypoints": [], "ports": []}
        try:
            mission = self.api.update_mission()
            for trigger in mission.get("triggers", {}).values():
                name = trigger.get("name", "")
                if re.match(r"^Sail-Home-\d+$", name, re.IGNORECASE):
                    result["homes"].append(trigger)
                elif re.match(r"^Sail-\d+$", name, re.IGNORECASE):
                    result["waypoints"].append(trigger)
                elif re.match(r"^Sail-Port-\d+$", name, re.IGNORECASE):
                    result["ports"].append(trigger)
        except Exception as e:
            self.logger.error(f"SailingShips: error reading zones: {e}", exc_info=True)
        return result

    def _coerce_latlng(self, position) -> LatLng:
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
