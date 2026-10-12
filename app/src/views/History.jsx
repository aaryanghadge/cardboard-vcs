import { useMemo, useState } from "react";
import { diff } from "@engine/diff.mjs";
import { ago, clipsOf, makeNameOf, LANE_COLORS } from "../lib.js";
import ChangeList from "../ui/ChangeList.jsx";

const ROW = 64, LANE_W = 22, PAD = 18;

function layout(store) {
  const all = store.all();                          // newest first
  const names = store.cuts().map((c) => c.name);    // lane order = order Alt cuts were created
  const laneOf = (sp) => Math.max(0, names.indexOf(sp.cut));
  const index = Object.fromEntries(all.map((sp, i) => [sp.id, i]));
  const edges = [];
  all.forEach((sp, i) => sp.parents.forEach((pid, n) => {
    if (pid in index)
      edges.push({ from: i, to: index[pid], fromLane: laneOf(sp), toLane: laneOf(all[index[pid]]), second: n > 0 });
  }));
  return { all, laneOf, edges, lanes: names.length };
}

function Graph({ all, edges, lanes, laneOf, selectedId }) {
  const x = (lane) => PAD + lane * LANE_W;
  const y = (i) => i * ROW + ROW / 2;
  const width = PAD * 2 + Math.max(lanes - 1, 0) * LANE_W;
  return (
    <svg width={width} height={all.length * ROW} className="shrink-0" aria-hidden="true">
      {edges.map((e, i) => {
        const x1 = x(e.fromLane), y1 = y(e.from), x2 = x(e.toLane), y2 = y(e.to);
        const color = LANE_COLORS[(e.second ? e.toLane : e.fromLane) % LANE_COLORS.length];
        const d = x1 === x2 ? `M${x1} ${y1} V${y2}`
          : e.second ? `M${x1} ${y1} Q${x2} ${y1} ${x2} ${y1 + 16} V${y2}`
          : `M${x1} ${y1} V${y2 - 16} Q${x1} ${y2} ${x2} ${y2}`;
        return <path key={i} d={d} fill="none" stroke={color} strokeWidth="2" />;
      })}
      {all.map((sp, i) => {
        const color = LANE_COLORS[laneOf(sp) % LANE_COLORS.length];
        return (
          <g key={sp.id}>
            {sp.id === selectedId && <circle cx={x(laneOf(sp))} cy={y(i)} r="9" fill="none" stroke="#fff" strokeWidth="1.5" />}
            <circle cx={x(laneOf(sp))} cy={y(i)} r={sp.parents.length > 1 ? 6 : 5} fill={color} stroke="#16181d" strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}

function Detail({ store, sp, isCutTip, onCompare, onChanged, onResolve }) {
  const parent = sp.parents[0] ? store.get(sp.parents[0]) : null;
  const ops = useMemo(() => (parent ? diff(parent.timeline, sp.timeline) : []), [parent, sp]);
  const [hidden, setHidden] = useState(new Set());
  const [sel, setSel] = useState(null);
  const nameOf = makeNameOf(sp.timeline, parent?.timeline ?? { tracks: [] });
  const toggle = (t) => setHidden((h) => { const n = new Set(h); n.has(t) ? n.delete(t) : n.add(t); return n; });
  const isTip = sp.id === store.tip;

  return (
    <div>
      <h2 className="text-base font-semibold">{sp.message}</h2>
      <p className="mt-1 text-sm text-dim">{sp.author}, {ago(sp.time)}, on {sp.cut}</p>
      <p className="mt-0.5 text-xs text-dim">Save point {sp.id}{sp.parents.length > 1 ? `, combines ${sp.parents.map((p) => p.slice(0, 7)).join(" and ")}` : ""}</p>

      {sp.conflicts.length > 0 && (isCutTip ? (
        <p className="mt-3 rounded-md border border-amber-400/50 p-2.5 text-sm text-amber-200">
          {sp.conflicts.length} choice{sp.conflicts.length === 1 ? "" : "s"} still open here. The cut plays fine meanwhile.
        </p>
      ) : (
        <p className="mt-3 text-sm text-dim">Combined with {sp.conflicts.length} choice{sp.conflicts.length === 1 ? "" : "s"} left open. Later save points carry or settle them.</p>
      ))}

      <div className="mt-4 flex flex-wrap gap-2">
        {parent && (
          <button onClick={() => onCompare(parent.id, sp.id)}
            className="rounded-md border border-edge bg-raise px-3 py-1.5 text-sm hover:brightness-110">Compare with previous</button>
        )}
        {isTip && sp.conflicts.length > 0 && (
          <button onClick={onResolve}
            className="rounded-md border border-amber-400/60 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-100 hover:brightness-110">Resolve open choices</button>
        )}
        {!isTip && (
          <button onClick={() => { store.goBackTo(sp.id); onChanged(); }}
            className="rounded-md border border-edge bg-raise px-3 py-1.5 text-sm hover:brightness-110">Go back to here on {store.currentCut}</button>
        )}
      </div>
      {!isTip && <p className="mt-2 text-xs text-dim">Going back moves {store.currentCut} only. Nothing is deleted, so you can come forward again.</p>}

      <div className="mt-6">
        {parent ? (
          <ChangeList ops={ops} hidden={hidden} onToggle={toggle} nameOf={nameOf} selected={sel} onSelect={setSel}
            emptyText="Nothing changed from the previous save point." />
        ) : (
          <p className="text-sm text-dim">The first save point. It starts with {clipsOf(sp).length} clips.</p>
        )}
      </div>
    </div>
  );
}

export default function History({ store, version, selectedId, onSelect, onCompare, onChanged, onResolve }) {
  const g = useMemo(() => layout(store), [store, version]);
  const tipsByPoint = {};
  store.cuts().forEach((c) => { if (c.tip) (tipsByPoint[c.tip] ||= []).push(c.name); });
  const selected = g.all.find((sp) => sp.id === selectedId) ?? g.all[0];

  return (
    <main className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 p-6">
        <h1 className="mb-4 text-lg font-semibold">History</h1>
        <div className="flex">
          <Graph all={g.all} edges={g.edges} lanes={g.lanes} laneOf={g.laneOf} selectedId={selected?.id} />
          <ul className="min-w-0 flex-1" aria-label="Save points, newest first">
            {g.all.map((sp) => (
              <li key={sp.id}>
                <button onClick={() => onSelect(sp.id)} aria-pressed={sp.id === selected?.id}
                  className={`flex h-16 w-full flex-col justify-center rounded-md px-3 text-left transition-colors
                    ${sp.id === selected?.id ? "bg-raise" : "hover:bg-raise/60"}`}>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{sp.message}</span>
                    {(tipsByPoint[sp.id] ?? []).map((name) => (
                      <span key={name} className={`rounded-full border px-2 py-0.5 text-[11px] ${name === store.currentCut ? "border-white/50 text-white" : "border-edge text-dim"}`}>{name}</span>
                    ))}
                    {sp.conflicts.length > 0 && tipsByPoint[sp.id] && (
                      <span className="rounded-full border border-amber-400/60 px-2 py-0.5 text-[11px] text-amber-300">{sp.conflicts.length} open</span>
                    )}
                  </span>
                  <span className="text-xs text-dim">{sp.author}, {ago(sp.time)}{sp.parents.length > 1 ? ", combined two cuts" : ""}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <aside className="border-t border-edge bg-panel p-5 lg:border-l lg:border-t-0">
        {selected ? <Detail key={selected.id} store={store} sp={selected} isCutTip={Boolean(tipsByPoint[selected.id])} onCompare={onCompare} onChanged={onChanged} onResolve={onResolve} />
          : <p className="text-sm text-dim">No save points yet.</p>}
      </aside>
    </main>
  );
}
