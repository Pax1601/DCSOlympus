import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrosshairs, faParachuteBox, faPlaneCircleXmark, faSkull, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { LatLng } from "leaflet";
import { CombatEventsReceivedEvent, MapOptionsChangedEvent } from "../../events";
import { MAP_OPTIONS_DEFAULTS } from "../../constants/constants";
import { CombatActor, CombatEvent, CombatEventType } from "../../interfaces";
import { getApp } from "../../olympusapp";

/* Events shown in the kill feed. Shots, hits, takeoffs and landings are only shown in the combat log panel */
const FEED_EVENT_TYPES: CombatEventType[] = ["kill", "dead", "crash", "ejection", "pilotDead"];
const MAX_ROWS = 6;
const ROW_LIFETIME_MS = 8000;
const ROW_EXIT_MS = 400;

type FeedRow = { combatEvent: CombatEvent; leaving: boolean };

export const COALITION_BORDER = { blue: "border-blue-500", red: "border-red-500", neutral: "border-gray-400", all: "border-gray-400" };
export const COALITION_TEXT = { blue: "text-blue-300", red: "text-red-300", neutral: "text-gray-300", all: "text-gray-300" };

/* Seconds since midnight to HH:MM:SS */
export function formatTime(absTime: number) {
  const s = Math.floor(absTime) % 86400;
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => `${v}`.padStart(2, "0")).join(":");
}

/* DCS weapon type names use underscores, e.g. AIM_120C */
export function formatWeapon(weapon?: string) {
  return weapon?.replace(/_/g, "-") ?? null;
}

/* Center the map on the actor if it still exists, else on the place where the event happened */
export function centerOn(combatEvent: CombatEvent, actor?: CombatActor) {
  const map = getApp()?.getMap();
  if (!map) return;
  const unit = actor?.ID !== undefined ? getApp().getUnitsManager().getUnitByID(actor.ID) : null;
  const zoom = Math.max(map.getZoom(), 11);
  if (unit && unit.getAlive()) map.setView(unit.getPosition(), zoom);
  else if (combatEvent.position) map.setView(new LatLng(combatEvent.position.lat, combatEvent.position.lng), zoom);
}

function Actor(props: { combatEvent: CombatEvent; actor?: CombatActor }) {
  const manager = getApp().getCombatLogManager();
  const coalition = manager.getActorCoalition(props.actor);
  return (
    <span
      className={`
        pointer-events-auto flex min-w-0 cursor-pointer flex-col leading-tight
        hover:underline
      `}
      onClick={() => centerOn(props.combatEvent, props.actor)}
    >
      {/* Players are shown by name, AI units by type */}
      <span className={`truncate font-semibold ${COALITION_TEXT[coalition]}`}>{props.actor?.playerName ?? manager.getActorLabel(props.actor)}</span>
      {props.actor?.playerName !== undefined && <span className="truncate text-[10px] text-gray-400">{manager.getActorLabel(props.actor)}</span>}
    </span>
  );
}

function KillFeedRow(props: { row: FeedRow }) {
  const manager = getApp().getCombatLogManager();
  const { combatEvent, leaving } = props.row;
  const { initiator, target } = combatEvent;

  /* The color of the row is the color of the shooter, or of the victim if nobody is credited */
  const coalition = manager.getActorCoalition(combatEvent.type === "kill" ? initiator : (target ?? initiator));
  const involvesPlayer = initiator?.playerName !== undefined || target?.playerName !== undefined;

  let icon: IconDefinition = faCrosshairs;
  let verb: string | null = null;
  if (combatEvent.type === "dead") [icon, verb] = [faSkull, "destroyed"];
  else if (combatEvent.type === "crash") [icon, verb] = [faPlaneCircleXmark, "crashed"];
  else if (combatEvent.type === "ejection") [icon, verb] = [faParachuteBox, "ejected"];
  else if (combatEvent.type === "pilotDead") [icon, verb] = [faSkull, "pilot killed"];

  return (
    <div
      data-leaving={leaving}
      className={`
        killfeed-row flex w-fit max-w-[520px] items-center gap-2 self-end
        rounded-r-md border-l-[3px] bg-olympus-800/85 py-1.5 pl-2 pr-3 text-sm
        text-white shadow-lg backdrop-blur-sm
        ${COALITION_BORDER[coalition]}
        ${involvesPlayer ? "killfeed-player" : ""}
      `}
    >
      <span className="font-mono text-[10px] tabular-nums text-gray-400">{formatTime(combatEvent.absTime)}</span>
      <FontAwesomeIcon icon={icon} className={`text-xs ${combatEvent.type === "ejection" ? "text-cyan-300" : "text-gray-200"}`} />
      {combatEvent.type === "kill" ? (
        <>
          {initiator ? <Actor combatEvent={combatEvent} actor={initiator} /> : <span className="text-gray-400">Unknown</span>}
          {combatEvent.weapon && (
            <span
              className={`
                whitespace-nowrap rounded border border-white/20 px-1.5 py-px
                font-mono text-[10px] uppercase tracking-wider text-gray-200
              `}
            >
              {formatWeapon(combatEvent.weapon)}
            </span>
          )}
          <span className="text-gray-500">&#x25B8;</span>
          <Actor combatEvent={combatEvent} actor={target} />
        </>
      ) : (
        <>
          <Actor combatEvent={combatEvent} actor={combatEvent.type === "dead" || combatEvent.type === "crash" ? target : initiator} />
          <span className="whitespace-nowrap text-xs text-gray-400">{verb}</span>
        </>
      )}
    </div>
  );
}

export function KillFeed(props: {}) {
  const [rows, setRows] = useState([] as FeedRow[]);
  const [visible, setVisible] = useState(MAP_OPTIONS_DEFAULTS.showKillFeed);

  useEffect(() => {
    MapOptionsChangedEvent.on((mapOptions) => {
      setVisible(mapOptions.showKillFeed);
      if (!mapOptions.showKillFeed) setRows([]);
    });

    CombatEventsReceivedEvent.on((combatEvents, history) => {
      /* Only show what happens live, not what happened before the page was opened */
      if (history || !getApp()?.getMap()?.getOptions().showKillFeed) return;

      const newRows = combatEvents.filter((combatEvent) => FEED_EVENT_TYPES.includes(combatEvent.type)).map((combatEvent) => ({ combatEvent, leaving: false }));
      if (newRows.length === 0) return;

      /* The listener can be registered twice (e.g. React strict mode), so ignore the events already shown */
      setRows((rows) => [...rows, ...newRows.filter((newRow) => !rows.some((row) => row.combatEvent === newRow.combatEvent))].slice(-MAX_ROWS));

      /* After its lifetime, play the exit animation, then remove the row */
      newRows.forEach((newRow) => {
        window.setTimeout(() => {
          setRows((rows) => rows.map((row) => (row.combatEvent === newRow.combatEvent ? { ...row, leaving: true } : row)));
          window.setTimeout(() => setRows((rows) => rows.filter((row) => row.combatEvent !== newRow.combatEvent)), ROW_EXIT_MS);
        }, ROW_LIFETIME_MS);
      });
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`
        pointer-events-none absolute right-[72px] top-[72px] z-10 flex flex-col
        gap-1.5
      `}
    >
      {rows.map((row) => (
        <KillFeedRow key={`${row.combatEvent.logTime}-${row.combatEvent.seq}`} row={row} />
      ))}
    </div>
  );
}
