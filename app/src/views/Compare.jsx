import { useMemo, useState } from "react";
import { diff } from "@engine/diff.mjs";
import { clipsOf, groupByClip, makeNameOf, totalOf, seconds, signed } from "../lib.js";
import Timeline from "../ui/Timeline.jsx";
import ChangeList from "../ui/ChangeList.jsx";
import Inspector from "../ui/Inspector.jsx";
import Legend from "../ui/Legend.jsx";
import Player from "../ui/Player.jsx";
import { useWidth, fitPx } from "../ui/useFit.js";

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-dim">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="min-w-56 max-w-80 rounded-md border border-edge bg-raise px-2.5 py-1.5 text-sm text-text">
        {options.map((s) => <option key={s.id} value={s.id}>{s.message} ({s.author}, {s.cut})</option>)}
      </select>
    </label>
  );
}

export default function Compare({ store, version, ids, onIds }) {
  const options = useMemo(() => store.all(), [store, version]);
  const tip = store.tip ? store.get(store.tip) : options[0];
  const fallbackBase = tip?.parents[0] ?? tip?.id;
  const baseId = options.some((o) => o.id === ids?.base) ? ids.base : fallbackBase;
  const headId = options.some((o) => o.id === ids?.head) ? ids.head : tip?.id;

  const [selected, setSelected] = useState(null);
  const [hidden, setHidden] = useState(new Set());
  const [showPlay, setShowPlay] = useState(false);
  const [colRef, colWidth] = useWidth();

  if (!options.length) return <main className="p-6 text-sm text-dim">No save points yet.</main>;

  const base = store.get(baseId), head = store.get(headId);
  const ops = diff(base.timeline, head.timeline);
  const byClip = groupByClip(ops.filter((o) => !hidden.has(o.type)));
  const beforeClips = clipsOf(base), afterClips = clipsOf(head);
  const nameOf = makeNameOf(base.timeline, head.timeline);
  const change = totalOf(head.timeline) - totalOf(base.timeline);
  const px = fitPx(colWidth, Math.max(totalOf(base.timeline), totalOf(head.timeline)));

  const setIds = (next) => { onIds({ base: baseId, head: headId, ...next }); setSelected(null); };
  const toggle = (t) => setHidden((h) => { const n = new Set(h); n.has(t) ? n.delete(t) : n.add(t); return n; });

  return (
    <main className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div ref={colRef} className="min-w-0 space-y-6 p-6">
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Compare" value={baseId} onChange={(v) => setIds({ base: v })} options={options} />
          <button onClick={() => setIds({ base: headId, head: baseId })}
            className="rounded-md border border-edge bg-raise px-3 py-1.5 text-sm hover:brightness-110"
            aria-label="Swap the two save points">Swap</button>
          <Select label="With" value={headId} onChange={(v) => setIds({ head: v })} options={options} />
          <p className="ml-auto text-sm text-dim">
            {change === 0 ? "Same length" : `${Math.abs(change)} frames ${change < 0 ? "shorter" : "longer"}`}
            {" "}({seconds(totalOf(base.timeline))} to {seconds(totalOf(head.timeline))}, {signed(change)}f)
          </p>
        </div>

        <Legend />

        <Timeline label="Before" lane="before" px={px} clips={beforeClips} byClip={byClip} selected={selected} onSelect={setSelected} />
        <Timeline label="After" lane="after" px={px} clips={afterClips} byClip={byClip} selected={selected} onSelect={setSelected} />

        <Inspector id={selected}
          before={beforeClips.find((c) => c.id === selected)}
          after={afterClips.find((c) => c.id === selected)}
          ops={ops.filter((o) => o.clip === selected)} />

        <section aria-label="Preview">
          <button onClick={() => setShowPlay((v) => !v)} aria-expanded={showPlay}
            className="rounded-md border border-edge px-3 py-1.5 text-sm text-dim hover:text-white">
            {showPlay ? "Hide preview" : "Preview both cuts"}
          </button>
          {showPlay && (
            <>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Player label="Before" timeline={base.timeline} />
                <Player label="After" timeline={head.timeline} />
              </div>
              <p className="mt-2 text-xs text-dim">Stand-in frames for now. Real footage plugs in here later.</p>
            </>
          )}
        </section>
      </div>

      <aside className="border-t border-edge bg-panel p-5 lg:border-l lg:border-t-0">
        <ChangeList ops={ops} hidden={hidden} onToggle={toggle} nameOf={nameOf} selected={selected} onSelect={setSelected} />
      </aside>
    </main>
  );
}
