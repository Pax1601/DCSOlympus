import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightLong,
  faBurst,
  faClose,
  faCrosshairs,
  faDownload,
  faParachuteBox,
  faPlaneArrival,
  faPlaneCircleXmark,
  faPlaneDeparture,
  faSkull,
  faStar,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { Menu } from "./components/menu";
import { getApp } from "../../olympusapp";
import { CombatEventsReceivedEvent } from "../../events";
import { CombatActor, CombatEvent, CombatEventType } from "../../interfaces";
import { centerOn, COALITION_TEXT, formatTime, formatWeapon } from "./killfeed";

type Tab = "feed" | "scores" | "timeline";
type CoalitionFilter = "all" | "blue" | "red";

/* Groups of event types that can be shown or hidden in the feed */
const CATEGORIES: { key: string; label: string; types: CombatEventType[]; default: boolean }[] = [
  { key: "kills", label: "Kills", types: ["kill", "dead", "crash"], default: true },
  { key: "hits", label: "Hits", types: ["hit"], default: true },
  { key: "ejections", label: "Ejections", types: ["ejection", "pilotDead"], default: true },
  { key: "shots", label: "Shots", types: ["shot"], default: false },
  { key: "airOps", label: "Takeoffs/landings", types: ["takeoff", "land"], default: false },
];

const EVENT_STYLE: { [key in CombatEventType]: { icon: IconDefinition; color: string } } = {
  kill: { icon: faCrosshairs, color: "text-white" },
  dead: { icon: faSkull, color: "text-gray-300" },
  crash: { icon: faPlaneCircleXmark, color: "text-gray-300" },
  hit: { icon: faBurst, color: "text-amber-400" },
  shot: { icon: faArrowRightLong, color: "text-gray-500" },
  ejection: { icon: faParachuteBox, color: "text-cyan-300" },
  pilotDead: { icon: faSkull, color: "text-gray-300" },
  takeoff: { icon: faPlaneDeparture, color: "text-gray-500" },
  land: { icon: faPlaneArrival, color: "text-gray-500" },
};

const MAX_FEED_ROWS = 300;
const ACE_AIR_KILLS = 5;

function involves(combatEvent: CombatEvent, coalition: CoalitionFilter) {
  if (coalition === "all") return true;
  const manager = getApp().getCombatLogManager();
  return manager.getActorCoalition(combatEvent.initiator) === coalition || manager.getActorCoalition(combatEvent.target) === coalition;
}

function minuteOf(combatEvent: CombatEvent) {
  return Math.floor(combatEvent.absTime / 60);
}

function download(content: string, filename: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportCSV(combatEvents: CombatEvent[]) {
  const manager = getApp().getCombatLogManager();
  const actorColumns = (actor?: CombatActor) => [
    actor?.playerName ?? "",
    actor?.unitName ?? "",
    actor ? manager.getActorLabel(actor) : "",
    actor ? manager.getActorCoalition(actor) : "",
  ];
  const rows = [
    ["time", "type", "initiatorPlayer", "initiatorUnit", "initiatorType", "initiatorCoalition", "weapon", "targetPlayer", "targetUnit", "targetType", "targetCoalition", "count", "place", "lat", "lng"],
    ...combatEvents.map((e) => [
      formatTime(e.absTime),
      e.type,
      ...actorColumns(e.initiator),
      e.weapon ?? "",
      ...actorColumns(e.target),
      `${e.count}`,
      e.place ?? "",
      `${e.position?.lat ?? ""}`,
      `${e.position?.lng ?? ""}`,
    ]),
  ];
  download(rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n"), "combat-log.csv", "text/csv");
}

/* Clickable actor name, colored by coalition. Players are shown by name, AI units by type */
function ActorName(props: { combatEvent: CombatEvent; actor?: CombatActor }) {
  const manager = getApp().getCombatLogManager();
  if (props.actor === undefined) return <span className="text-gray-500">Unknown</span>;
  return (
    <span
      className={`
        cursor-pointer font-semibold
        hover:underline
        ${COALITION_TEXT[manager.getActorCoalition(props.actor)]}
      `}
      title={manager.getActorLabel(props.actor)}
      onClick={() => centerOn(props.combatEvent, props.actor)}
    >
      {props.actor.playerName ?? manager.getActorLabel(props.actor)}
    </span>
  );
}

function WeaponTag(props: { weapon?: string }) {
  if (!props.weapon) return null;
  return (
    <span
      className={`
        whitespace-nowrap rounded border border-white/20 px-1 py-px font-mono
        text-[10px] uppercase tracking-wider text-gray-300
      `}
    >
      {formatWeapon(props.weapon)}
    </span>
  );
}

function FeedEntry(props: { combatEvent: CombatEvent }) {
  const e = props.combatEvent;
  const style = EVENT_STYLE[e.type];
  const verb = (text: string) => <span className="text-gray-400">{text}</span>;

  let content: JSX.Element;
  switch (e.type) {
    case "kill":
      content = (
        <>
          <ActorName combatEvent={e} actor={e.initiator} /> <WeaponTag weapon={e.weapon} /> <span className="text-gray-500">&#x25B8;</span>{" "}
          <ActorName combatEvent={e} actor={e.target} />
        </>
      );
      break;
    case "hit":
      content = (
        <>
          <ActorName combatEvent={e} actor={e.initiator} /> {verb("hit")} <ActorName combatEvent={e} actor={e.target} /> <WeaponTag weapon={e.weapon} />
          {e.count > 1 && <span className="font-mono text-[10px] text-amber-400"> &times;{e.count}</span>}
        </>
      );
      break;
    case "shot":
      content = (
        <>
          <ActorName combatEvent={e} actor={e.initiator} /> {verb("fired")} <WeaponTag weapon={e.weapon} />
          {e.target && (
            <>
              {" "}
              {verb("at")} <ActorName combatEvent={e} actor={e.target} />
            </>
          )}
        </>
      );
      break;
    case "dead":
    case "crash":
      content = (
        <>
          <ActorName combatEvent={e} actor={e.target} /> {verb(e.type === "dead" ? "destroyed" : "crashed")}
        </>
      );
      break;
    case "ejection":
    case "pilotDead":
      content = (
        <>
          <ActorName combatEvent={e} actor={e.initiator} /> {verb(e.type === "ejection" ? "ejected" : "pilot killed")}
        </>
      );
      break;
    default:
      content = (
        <>
          <ActorName combatEvent={e} actor={e.initiator} /> {verb(e.type === "takeoff" ? "took off from" : "landed at")}{" "}
          <span className="text-gray-300">{e.place ?? "the field"}</span>
        </>
      );
  }

  return (
    <div
      className={`
        flex items-start gap-2 border-b border-white/5 px-5 py-1.5 text-sm
        ${e.type === "kill" ? "bg-white/[0.03]" : ""}
      `}
    >
      <span className="mt-[3px] font-mono text-[10px] tabular-nums text-gray-500">{formatTime(e.absTime)}</span>
      <FontAwesomeIcon icon={style.icon} className={`mt-1 w-3 text-xs ${style.color}`} />
      <span className="min-w-0 leading-snug text-gray-200">{content}</span>
    </div>
  );
}

function FilterChip(props: { label: string; active: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      data-active={props.active}
      onClick={props.onClick}
      className={`
        rounded-full border px-2.5 py-0.5 text-xs transition-colors
        data-[active='false']:border-white/10 data-[active='false']:text-gray-500
        data-[active='true']:border-white/40 data-[active='true']:bg-white/10
        data-[active='true']:text-white
        hover:border-white/40
        ${props.className ?? ""}
      `}
    >
      {props.label}
    </button>
  );
}

function FeedTab(props: { minute: number | null; onClearMinute: () => void }) {
  const [categories, setCategories] = useState(Object.fromEntries(CATEGORIES.map((c) => [c.key, c.default])));
  const [coalition, setCoalition] = useState("all" as CoalitionFilter);

  const visibleTypes = CATEGORIES.filter((c) => categories[c.key]).flatMap((c) => c.types);
  const combatEvents = getApp()
    .getCombatLogManager()
    .getEvents()
    .filter((e) => visibleTypes.includes(e.type) && involves(e, coalition) && (props.minute === null || minuteOf(e) === props.minute));

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 px-5 py-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <FilterChip key={c.key} label={c.label} active={categories[c.key]} onClick={() => setCategories({ ...categories, [c.key]: !categories[c.key] })} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "blue", "red"] as CoalitionFilter[]).map((c) => (
            <FilterChip
              key={c}
              label={c === "all" ? "All coalitions" : c === "blue" ? "Blue" : "Red"}
              active={coalition === c}
              onClick={() => setCoalition(c)}
              className={c === "blue" ? "data-[active='true']:!border-blue-500" : c === "red" ? "data-[active='true']:!border-red-500" : ""}
            />
          ))}
          {props.minute !== null && (
            <button
              onClick={props.onClearMinute}
              className={`
                ml-auto flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5
                py-0.5 font-mono text-xs text-amber-300
              `}
            >
              {formatTime(props.minute * 60).slice(0, 5)} <FontAwesomeIcon icon={faClose} />
            </button>
          )}
        </div>
      </div>
      {combatEvents.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-500">No combat events yet. They'll show up here as soon as the shooting starts.</div>
      ) : (
        <div className="flex flex-col">
          {combatEvents
            .slice(-MAX_FEED_ROWS)
            .reverse()
            .map((e) => (
              <FeedEntry key={`${e.logTime}-${e.seq}`} combatEvent={e} />
            ))}
        </div>
      )}
      <div className="flex gap-2 px-5 py-4">
        <button
          className={`
            flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5
            text-xs text-gray-300
            hover:bg-white/10
          `}
          onClick={() => download(JSON.stringify(getApp().getCombatLogManager().getEvents(), null, 2), "combat-log.json", "application/json")}
        >
          <FontAwesomeIcon icon={faDownload} /> Export JSON
        </button>
        <button
          className={`
            flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5
            text-xs text-gray-300
            hover:bg-white/10
          `}
          onClick={() => exportCSV(getApp().getCombatLogManager().getEvents())}
        >
          <FontAwesomeIcon icon={faDownload} /> Export CSV
        </button>
      </div>
    </div>
  );
}

function ScoresTab() {
  const manager = getApp().getCombatLogManager();
  const totals = manager.getCoalitionTotals();
  const scores = manager.getScores().filter((s) => s.kills > 0 || s.deaths > 0 || s.shots > 0 || s.hits > 0);
  const totalKills = totals.blue.kills + totals.red.kills;
  const bluePercent = totalKills > 0 ? (totals.blue.kills / totalKills) * 100 : 50;

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-blue-300">Blue</span>
            <span className="font-mono text-4xl font-bold tabular-nums text-blue-400">{totals.blue.kills}</span>
          </div>
          <span className="pb-2 text-[10px] uppercase tracking-widest text-gray-500">Kills</span>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-red-300">Red</span>
            <span className="font-mono text-4xl font-bold tabular-nums text-red-400">{totals.red.kills}</span>
          </div>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="bg-blue-500 transition-all duration-500" style={{ width: `${bluePercent}%` }} />
          <div className="flex-1 bg-red-500" />
        </div>
        <div className="flex justify-between font-mono text-[11px] tabular-nums text-gray-500">
          <span>{totals.blue.losses} lost</span>
          <span>{totals.red.losses} lost</span>
        </div>
      </div>

      {scores.length === 0 ? (
        <div className="py-4 text-center text-sm text-gray-500">Nobody has scored yet.</div>
      ) : (
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-gray-500">
              <th className="w-6 pb-2 text-left font-normal">#</th>
              <th className="pb-2 text-left font-normal">Unit</th>
              <th className="w-8 pb-2 text-right font-normal">K</th>
              <th className="w-8 pb-2 text-right font-normal">D</th>
              <th className="w-12 pb-2 text-right font-normal" title="Hits / shots">Acc.</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, idx) => (
              <tr key={s.key} className={`border-t border-white/5 ${s.isPlayer ? "bg-white/[0.04]" : ""}`}>
                <td className="py-1.5 font-mono text-xs text-gray-500">{idx + 1}</td>
                <td className="truncate py-1.5">
                  {/* Players are shown by name, AI units by type */}
                  <span className={`font-semibold ${COALITION_TEXT[s.coalition]}`}>{s.isPlayer ? s.name : manager.getActorLabel({ typeName: s.typeName })}</span>
                  {s.airKills >= ACE_AIR_KILLS && (
                    <span
                      className={`
                        ml-1.5 rounded bg-amber-400/20 px-1 py-px text-[10px] font-bold
                        uppercase tracking-wider text-amber-300
                      `}
                      title={`${s.airKills} air kills`}
                    >
                      <FontAwesomeIcon icon={faStar} className="mr-0.5" />
                      Ace
                    </span>
                  )}
                  <div className="truncate text-[10px] text-gray-500">{s.isPlayer ? manager.getActorLabel({ typeName: s.typeName }) : s.name}</div>
                </td>
                <td className="py-1.5 text-right font-mono tabular-nums text-white">{s.kills}</td>
                <td className="py-1.5 text-right font-mono tabular-nums text-gray-400">{s.deaths}</td>
                <td className="py-1.5 text-right font-mono text-xs tabular-nums text-gray-400">
                  {s.shots > 0 ? `${Math.round(Math.min(1, s.hits / s.shots) * 100)}%` : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TimelineTab(props: { onSelectMinute: (minute: number) => void }) {
  const [hovered, setHovered] = useState(null as number | null);
  const manager = getApp().getCombatLogManager();
  const combatEvents = manager.getEvents();

  if (combatEvents.length === 0) return <div className="px-5 py-8 text-center text-sm text-gray-500">The timeline fills up as the battle unfolds.</div>;

  /* One bucket per minute, the last 60 minutes at most */
  const lastMinute = minuteOf(combatEvents[combatEvents.length - 1]);
  const firstMinute = Math.max(minuteOf(combatEvents[0]), lastMinute - 59);
  const buckets = Array.from({ length: lastMinute - firstMinute + 1 }, (_, i) => ({ minute: firstMinute + i, blue: 0, red: 0, activity: 0 }));
  for (const e of combatEvents) {
    const bucket = buckets[minuteOf(e) - firstMinute];
    if (!bucket) continue;
    bucket.activity++;
    if (e.type === "kill") {
      const coalition = manager.getActorCoalition(e.initiator);
      if (coalition === "blue") bucket.blue++;
      else if (coalition === "red") bucket.red++;
    }
  }

  const width = 360;
  const height = 150;
  const maxKills = Math.max(1, ...buckets.map((b) => b.blue + b.red));
  const maxActivity = Math.max(1, ...buckets.map((b) => b.activity));
  const slot = width / Math.max(buckets.length, 12);
  const barWidth = Math.max(2, slot - 2);
  const hoveredBucket = buckets.find((b) => b.minute === hovered);

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500">
        <span>Kills per minute</span>
        <span className="flex gap-3">
          <span className="text-blue-400">&#9632; Blue</span>
          <span className="text-red-400">&#9632; Red</span>
          <span className="text-gray-500">&#9632; Activity</span>
        </span>
      </div>
      <svg width={width} height={height + 18} className="overflow-visible">
        <line x1={0} x2={width} y1={height} y2={height} className="stroke-white/20" />
        {buckets.map((b, i) => {
          const x = i * slot;
          const activityHeight = (b.activity / maxActivity) * height * 0.35;
          const blueHeight = (b.blue / maxKills) * height * 0.9;
          const redHeight = (b.red / maxKills) * height * 0.9;
          return (
            <g key={b.minute} className="cursor-pointer" onMouseEnter={() => setHovered(b.minute)} onMouseLeave={() => setHovered(null)} onClick={() => props.onSelectMinute(b.minute)}>
              <rect x={x} y={0} width={slot} height={height} className={hovered === b.minute ? "fill-white/5" : "fill-transparent"} />
              <rect x={x + 1} y={height - activityHeight} width={barWidth} height={activityHeight} className="fill-gray-500/30" rx={1} />
              <rect x={x + 1} y={height - blueHeight} width={barWidth} height={blueHeight} className="fill-blue-500" rx={1} />
              <rect x={x + 1} y={height - blueHeight - redHeight} width={barWidth} height={redHeight} className="fill-red-500" rx={1} />
            </g>
          );
        })}
        <text x={0} y={height + 14} className="fill-gray-500 font-mono text-[10px]">
          {formatTime(firstMinute * 60).slice(0, 5)}
        </text>
        <text x={width} y={height + 14} textAnchor="end" className="fill-gray-500 font-mono text-[10px]">
          {formatTime(lastMinute * 60).slice(0, 5)}
        </text>
      </svg>
      <div className="h-5 font-mono text-xs text-gray-400">
        {hoveredBucket ? (
          <>
            {formatTime(hoveredBucket.minute * 60).slice(0, 5)} &middot; <span className="text-blue-400">{hoveredBucket.blue}</span> /{" "}
            <span className="text-red-400">{hoveredBucket.red}</span> kills &middot; {hoveredBucket.activity} events &middot; click to see them
          </>
        ) : (
          <span className="text-gray-600">Hover a minute for details, click it to filter the feed.</span>
        )}
      </div>
    </div>
  );
}

export function CombatLogMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [tab, setTab] = useState("feed" as Tab);
  const [minute, setMinute] = useState(null as number | null);
  const [, setRevision] = useState(0);

  /* Re-render when new events are received */
  useEffect(() => {
    CombatEventsReceivedEvent.on(() => setRevision((revision) => revision + 1));
  }, []);

  return (
    <Menu
      title="Combat log"
      open={props.open}
      showBackButton={false}
      onClose={props.onClose}
      wiki={() => (
        <div className="flex h-full flex-col gap-2 overflow-auto p-4 text-gray-400 no-scrollbar">
          <h2 className="mb-4 font-bold">Combat log</h2>
          <div>The combat log records what happens on the battlefield: shots, hits, kills, ejections, takeoffs and landings.</div>
          <div>Kills are credited to the unit that fired the weapon. When DCS does not report who destroyed a unit, the last unit that hit it in the previous minute gets the credit.</div>
          <div>Click on any unit name to center the map on it. Commanders only see the events involving their own coalition.</div>
        </div>
      )}
    >
      <div className="flex flex-col text-white">
        <div className="flex border-b border-white/10 px-5">
          {(["feed", "scores", "timeline"] as Tab[]).map((t) => (
            <button
              key={t}
              data-active={tab === t}
              onClick={() => setTab(t)}
              className={`
                -mb-px border-b-2 px-3 py-2 text-xs uppercase tracking-widest
                transition-colors
                data-[active='false']:border-transparent
                data-[active='false']:text-gray-500
                data-[active='true']:border-white data-[active='true']:text-white
                hover:text-gray-200
              `}
            >
              {t === "feed" ? "Feed" : t === "scores" ? "Scores" : "Timeline"}
            </button>
          ))}
        </div>
        {/* The content is only rendered when the menu is open: the app may not be initialized yet, and it saves computations */}
        {props.open && tab === "feed" && <FeedTab minute={minute} onClearMinute={() => setMinute(null)} />}
        {props.open && tab === "scores" && <ScoresTab />}
        {props.open && tab === "timeline" && (
          <TimelineTab
            onSelectMinute={(m) => {
              setMinute(m);
              setTab("feed");
            }}
          />
        )}
      </div>
    </Menu>
  );
}
