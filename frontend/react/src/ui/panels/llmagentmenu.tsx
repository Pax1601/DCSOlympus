import React, { useState } from "react";
import { Menu } from "./components/menu";
import { getApp } from "../../olympusapp";
import { OlympusState } from "../../constants/constants";

export function LLMAgentMenu(props: { open: boolean; onClose: () => void }) {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"tactical" | "strategic">("tactical");
  const [decisions, setDecisions] = useState<string[]>([]);
  const params = new URLSearchParams(window.location.search);
  const devMock = params.get("dev") === "1";

  function say(text: string) {
    try {
      if (devMock && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1;
        window.speechSynthesis.speak(u);
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <Menu
      title="LLM Agent Control"
      open={props.open}
      onClose={props.onClose}
      showBackButton={false}
      wiki={() => (
        <div className="p-4 text-gray-400">
          <h2 className="font-bold mb-2">LLM Agent</h2>
          <div className="text-sm">Front-end blade for tactical/strategic control and status.</div>
        </div>
      )}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="bg-olympus-400 rounded-lg p-4 border border-olympus-500">
          <div className="flex justify-between">
            <span className="font-semibold">Agent Status</span>
            <span className={isActive ? "text-green-400" : "text-gray-400"}>{isActive ? "Active" : "Inactive"}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded bg-olympus-600 px-3 py-2 text-white hover:bg-olympus-500"
            onClick={() => {
              setIsActive((v) => {
                const nv = !v;
                say(nv ? "LLM Agent started" : "LLM Agent paused");
                try {
                  const mgr = (getApp() as any).getLLMAgentManager?.();
                  if (mgr) {
                    nv ? mgr.start() : mgr.stop();
                  }
                } catch {}
                return nv;
              });
            }}
          >
            {isActive ? "Pause" : "Start"}
          </button>
          {devMock && (
            <button
              className="rounded bg-olympus-700 px-3 py-2 text-white hover:bg-olympus-600"
              onClick={() => say("Testing L L M agent voice")}
              title="Speak a test phrase (dev only)"
            >
              Speak Test
            </button>
          )}
          {devMock && (
            <button
              className="rounded bg-olympus-700 px-3 py-2 text-white hover:bg-olympus-600"
              onClick={() => {
                const ts = new Date().toLocaleTimeString();
                const d = `${ts} — Sample decision: Hold position and scan`;
                setDecisions((arr) => [d, ...arr].slice(0, 50));
                say(d);
                try {
                  const mgr = (getApp() as any).getLLMAgentManager?.();
                  mgr?.announce?.(d);
                } catch {}
              }}
              title="Add a sample decision and speak it (dev only)"
            >
              Add Sample Decision
            </button>
          )}
          <select
            className="rounded bg-olympus-600 px-2 py-2 text-white"
            value={mode}
            onChange={(e) => {
              const m = e.target.value as any;
              setMode(m);
              say(m === "tactical" ? "Mode tactical" : "Mode strategic");
            }}
          >
            <option value="tactical">Tactical (real-time)</option>
            <option value="strategic">Strategic (planning)</option>
          </select>
        </div>

        <div>
          <h3 className="font-semibold text-gray-200 mb-2">Decisions</h3>
          <div className="bg-olympus-500 rounded p-3 max-h-[250px] overflow-y-auto border border-olympus-600 text-gray-300 text-sm">
            {decisions.length === 0 ? (
              <div>No decisions yet</div>
            ) : (
              decisions.map((d, i) => (
                <div key={i} className="border-b border-olympus-600 py-1">{d}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </Menu>
  );
}
