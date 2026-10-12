import { useState } from "react";
import { diff } from "@engine/diff.mjs";
import { groupByClip, makeNameOf, len, totalOf } from "../lib.js";
import Timeline from "../ui/Timeline.jsx";
import ChangeList from "../ui/ChangeList.jsx";
import { useWidth, fitPx } from "../ui/useFit.js";

const newId = () => "c" + Math.random().toString(36).slice(2, 7);
const field = "w-24 rounded-md border border-edge bg-ink px-2 py-1.5 text-sm text-text";
const small = "rounded-md border border-edge bg-raise px-3 py-1.5 text-sm hover:brightness-110 disabled:opacity-40";

// A tiny stand-in for an editing app: change the cut, then save it as a save point.
export default function Edit({ store, onSaved }) {
  const tip = store.tip ? store.get(store.tip) : null;
  const [work, setWork] = useState(() => structuredClone(tip?.timeline ?? { tracks: [{ id: "V1", clips: [] }] }));
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [newName, setNewName] = useState("New clip");
  const [newFrames, setNewFrames] = useState(30);
  const [hidden, setHidden] = useState(new Set());
  const [colRef, colWidth] = useWidth();

  const base = tip?.timeline ?? { tracks: [{ id: "V1", clips: [] }] };
  const clips = work.tracks[0].clips;
  const clip = clips.find((c) => c.id === selected);
  const ops = diff(base, work);
  const dirty = ops.length > 0;
  const invalid = clips.some((c) => !(c.out > c.in) || c.in < 0);
  const nameOf = makeNameOf(base, work);
  const px = fitPx(colWidth, Math.max(totalOf(base), totalOf(work)));
  const byClip = groupByClip(ops.filter((o) => !hidden.has(o.type)));
  const toggle = (t) => setHidden((h) => { const n = new Set(h); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const mutate = (fn) => setWork((w) => { const n = structuredClone(w); fn(n.tracks[0].clips); return n; });
  const setField = (key, value) => mutate((cs) => { const c = cs.find((x) => x.id === selected); if (c) { if (value === "" || value == null) delete c[key]; else c[key] = value; } });
  const num = (v) => { const n = parseInt(v, 10); return Number.isNaN(n) ? 0 : Math.max(0, n); };
  const shift = (dir) => mutate((cs) => {
    const i = cs.findIndex((c) => c.id === selected), j = i + dir;
    if (i >= 0 && j >= 0 && j < cs.length) [cs[i], cs[j]] = [cs[j], cs[i]];
  });
  const remove = () => { mutate((cs) => { const i = cs.findIndex((c) => c.id === selected); if (i >= 0) cs.splice(i, 1); }); setSelected(null); };
  const add = () => {
    const id = newId();
    const frames = Math.max(1, parseInt(newFrames, 10) || 30);
    mutate((cs) => {
      const at = cs.findIndex((c) => c.id === selected);
      cs.splice(at >= 0 ? at + 1 : cs.length, 0, { id, name: newName.trim() || "New clip", asset: `sha256:${id}0000`, in: 0, out: frames });
    });
    setSelected(id);
  };

  if (!tip) return <main className="p-6 text-sm text-dim">Nothing to edit yet.</main>;

  return (
    <main className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div ref={colRef} className="min-w-0 space-y-6 p-6">
        <div>
          <h1 className="text-lg font-semibold">Edit {store.currentCut}</h1>
          <p className="mt-1 text-sm text-dim">Start from the latest save point, change the cut, then save it. This stands in for your editing app.</p>
        </div>

        <Timeline label="Working cut" lane="after" px={px} clips={clips} byClip={byClip} selected={selected} onSelect={setSelected} />

        <section className="rounded-lg border border-edge bg-panel p-4" aria-label="Clip controls">
          {clip ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="mr-2"><div className="text-sm font-semibold">{clip.name}</div><div className="text-xs text-dim">{len(clip)} frames</div></div>
              <label className="flex flex-col gap-1 text-xs text-dim">In point
                <input type="number" min="0" value={clip.in} onChange={(e) => setField("in", num(e.target.value))} className={field} /></label>
              <label className="flex flex-col gap-1 text-xs text-dim">Out point
                <input type="number" min="1" value={clip.out} onChange={(e) => setField("out", num(e.target.value))} className={field} /></label>
              <label className="flex flex-col gap-1 text-xs text-dim">Effect
                <input value={clip.effect ?? ""} placeholder="none" onChange={(e) => setField("effect", e.target.value)} className={field} /></label>
              <button onClick={() => shift(-1)} className={small}>Move earlier</button>
              <button onClick={() => shift(1)} className={small}>Move later</button>
              <button onClick={remove} className={small}>Remove clip</button>
            </div>
          ) : (
            <p className="text-sm text-dim">Select a clip on the timeline to trim it, move it, or change its effect.</p>
          )}
        </section>

        <section className="flex flex-wrap items-end gap-3 rounded-lg border border-edge bg-panel p-4" aria-label="Add clip">
          <label className="flex flex-col gap-1 text-xs text-dim">New clip name
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-48 rounded-md border border-edge bg-ink px-2 py-1.5 text-sm text-text" /></label>
          <label className="flex flex-col gap-1 text-xs text-dim">Frames
            <input type="number" min="1" value={newFrames} onChange={(e) => setNewFrames(e.target.value)} className={field} /></label>
          <button onClick={add} className={small}>{clip ? `Add after ${clip.name}` : "Add at the end"}</button>
        </section>

        <section className="flex flex-wrap items-end gap-3 rounded-lg border border-edge bg-panel p-4" aria-label="Save">
          <label className="flex flex-1 flex-col gap-1 text-xs text-dim">What did you change?
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe this edit"
              className="rounded-md border border-edge bg-ink px-2.5 py-1.5 text-sm text-text" /></label>
          <button onClick={() => { setWork(structuredClone(base)); setSelected(null); }} disabled={!dirty} className={small}>Undo all edits</button>
          <button disabled={!dirty || invalid}
            onClick={() => onSaved(store.save(work, message.trim() || "Edit", { author: "You" }))}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Save point</button>
          {invalid && <p className="w-full text-sm text-rose-300">A clip has an out point at or before its in point. Fix it to save.</p>}
        </section>
      </div>

      <aside className="border-t border-edge bg-panel p-5 lg:border-l lg:border-t-0">
        <ChangeList ops={ops} hidden={hidden} onToggle={toggle} nameOf={nameOf} selected={selected} onSelect={setSelected}
          emptyText="No edits yet. Changes you make show up here." />
      </aside>
    </main>
  );
}
