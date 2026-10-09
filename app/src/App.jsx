import { useMemo, useState } from "react";
import { diff } from "@engine/diff.mjs";
import { SAVE_POINTS } from "./data.js";
import { totalOf, seconds, signed } from "./lib.js";
import Timeline from "./ui/Timeline.jsx";
import ChangeList from "./ui/ChangeList.jsx";
import Inspector from "./ui/Inspector.jsx";

const byId = Object.fromEntries(SAVE_POINTS.map((s) => [s.id, s]));
const clipsOf = (sp) => sp.timeline.tracks.flatMap((t) => t.clips);

function Select({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-dim">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="min-w-56 rounded-md border border-edge bg-raise px-2.5 py-1.5 text-sm text-text">
        {SAVE_POINTS.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.author})</option>)}
      </select>
    </label>
  );
}

export default function App() {
  const [baseId, setBaseId] = useState("sp1");
  const [headId, setHeadId] = useState("sp2");
  const [selected, setSelected] = useState(null);
  const [hidden, setHidden] = useState(new Set());

  const base = byId[baseId], head = byId[headId];
  const ops = useMemo(() => diff(base.timeline, head.timeline), [base, head]);
  const visible = ops.filter((o) => !hidden.has(o.type));
  const byClip = {};
  visible.forEach((o) => (byClip[o.clip] ||= []).push(o));

  const beforeClips = clipsOf(base), afterClips = clipsOf(head);
  const allClips = [...beforeClips, ...afterClips];
  const nameOf = (id) => allClips.find((c) => c.id === id)?.name ?? id;

  const change = totalOf(head.timeline) - totalOf(base.timeline);
  const pick = (setter) => (v) => { setter(v); setSelected(null); };
  const toggle = (t) => setHidden((h) => { const n = new Set(h); n.has(t) ? n.delete(t) : n.add(t); return n; });

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-12 items-center gap-3 border-b border-edge bg-panel px-5">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 6l7-3 7 3v8l-7 3-7-3z" fill="none" stroke="#d6b48a" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M3 6l7 3 7-3M10 9v8" fill="none" stroke="#d6b48a" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span className="font-semibold">Cardboard</span>
        <span className="text-dim">Acme Studio / Spring campaign</span>
      </header>

      <main className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6 p-6">
          <div className="flex flex-wrap items-end gap-3">
            <Select label="Compare" value={baseId} onChange={pick(setBaseId)} />
            <button onClick={() => { const b = baseId; setBaseId(headId); setHeadId(b); setSelected(null); }}
              className="rounded-md border border-edge bg-raise px-3 py-1.5 text-sm hover:brightness-110"
              aria-label="Swap the two save points">Swap</button>
            <Select label="With" value={headId} onChange={pick(setHeadId)} />
            <p className="ml-auto text-sm text-dim">
              {change === 0 ? "Same length" : `${Math.abs(change)} frames ${change < 0 ? "shorter" : "longer"}`}
              {" "}({seconds(totalOf(base.timeline))} to {seconds(totalOf(head.timeline))}, {signed(change)}f)
            </p>
          </div>

          <Timeline label="Before" clips={beforeClips} byClip={byClip} selected={selected} onSelect={setSelected} showDeltas={false} />
          <Timeline label="After" clips={afterClips} byClip={byClip} selected={selected} onSelect={setSelected} showDeltas />

          <Inspector id={selected}
            before={beforeClips.find((c) => c.id === selected)}
            after={afterClips.find((c) => c.id === selected)}
            ops={ops.filter((o) => o.clip === selected)} />
        </div>

        <aside className="border-t border-edge bg-panel p-5 lg:border-l lg:border-t-0">
          <ChangeList ops={ops} hidden={hidden} onToggle={toggle} nameOf={nameOf} selected={selected} onSelect={setSelected} />
        </aside>
      </main>
    </div>
  );
}
