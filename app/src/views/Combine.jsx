import { useMemo, useState } from "react";
import { diff } from "@engine/diff.mjs";
import { resolve, resolveAll, keyOf } from "@engine/resolve.mjs";
import { clipsOf, timelineClips, groupByClip, makeNameOf, totalOf } from "../lib.js";
import Timeline from "../ui/Timeline.jsx";
import OpList from "../ui/OpList.jsx";
import ConflictCard from "../ui/ConflictCard.jsx";
import { useWidth, fitPx } from "../ui/useFit.js";

// The two ways a choice could go, each as a full timeline you can watch.
function watchOptions({ timeline, conflicts, decisions, conflict, labels, nameOf }) {
  const others = conflicts.filter((x) => x !== conflict);
  const base = resolveAll(timeline, others, decisions);
  const picks = conflict.type === "same-field"
    ? [["mine", `${labels.mine}'s`], ["theirs", `${labels.theirs}'s`]]
    : conflict.type === "delete-vs-modify"
      ? [["keep", "With the clip"], ["delete", "Without it"]]
      : [["keep", `${nameOf(conflict.ids[1])}, then ${nameOf(conflict.ids[0])}`], ["swap", `${nameOf(conflict.ids[0])}, then ${nameOf(conflict.ids[1])}`]];
  return picks.map(([pick, label]) => ({ label, timeline: resolve(base, conflict, { pick }) }));
}

// Choices left open by an earlier combine on the current cut.
function OpenChoices({ store, version, onChanged }) {
  const [decisions, setDecisions] = useState({});
  const tip = store.tip ? store.get(store.tip) : null;
  if (!tip || tip.conflicts.length === 0) return null;
  const nameOf = makeNameOf(tip.timeline);
  const clips = clipsOf(tip);
  const left = tip.conflicts.filter((c) => !decisions[keyOf(c)]).length;
  const decided = Object.keys(decisions).length;

  return (
    <section className="rounded-lg border border-amber-400/40 p-4" aria-label="Open choices">
      <h2 className="text-sm font-semibold">Open choices on {store.currentCut}</h2>
      <p className="mb-3 mt-1 text-sm text-dim">An earlier combine left {tip.conflicts.length} for you. The cut plays fine meanwhile.</p>
      <div className="space-y-3">
        {tip.conflicts.map((c) => (
          <ConflictCard key={keyOf(c)} conflict={c} decision={decisions[keyOf(c)]} nameOf={nameOf}
            labels={{ mine: store.currentCut, theirs: "the other cut" }}
            clip={clips.find((x) => x.id === c.clip)}
            watch={watchOptions({ timeline: tip.timeline, conflicts: tip.conflicts, decisions, conflict: c, nameOf,
              labels: { mine: store.currentCut, theirs: "the other cut" } })}
            onDecide={(d) => setDecisions((m) => ({ ...m, [keyOf(c)]: d }))} />
        ))}
      </div>
      <button disabled={decided === 0}
        onClick={() => { store.resolveCombine(decisions, "Resolved open choices", { author: "You" }); setDecisions({}); onChanged(); }}
        className="mt-4 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
        Save {decided} choice{decided === 1 ? "" : "s"}{left > 0 && decided > 0 ? `, ${left} still open` : ""}
      </button>
    </section>
  );
}

export default function Combine({ store, version, onChanged, onDone }) {
  const current = store.currentCut;
  const others = store.cuts().filter((c) => c.name !== current && c.tip);
  const [source, setSource] = useState("");
  const [decisions, setDecisions] = useState({});
  const [message, setMessage] = useState(null);
  const [colRef, colWidth] = useWidth();

  const valid = others.some((o) => o.name === source);
  const plan = useMemo(() => (valid ? store.previewCombine(source) : null), [store, source, valid, version]);

  const pickSource = (name) => { setSource(name); setDecisions({}); setMessage(null); };

  let body = null;
  if (plan) {
    const mineTl = store.get(plan.mine).timeline;
    const theirsTl = store.get(plan.theirs).timeline;

    if (plan.status === "up-to-date") {
      body = <p className="rounded-lg border border-edge p-4 text-sm text-dim">Everything in {source} is already in {current}. Nothing to combine.</p>;
    } else if (plan.status === "fast-forward") {
      body = (
        <div className="rounded-lg border border-edge bg-panel p-4">
          <p className="text-sm">{current} has no new work of its own since {source} started, so combining just moves {current} forward to {source}'s latest save point.</p>
          <button onClick={() => { store.combine(source, undefined, {}, { author: "You" }); setSource(""); onChanged(); onDone(store.tip); }}
            className="mt-3 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white">Move {current} forward</button>
        </div>
      );
    } else {
      const baseTl = plan.base ? store.get(plan.base).timeline : { tracks: [] };
      const resolved = resolveAll(plan.timeline, plan.conflicts, decisions);
      const nameOf = makeNameOf(baseTl, mineTl, theirsTl, resolved);
      const resultOps = diff(mineTl, resolved);
      const byClip = groupByClip(resultOps);
      const open = plan.conflicts.filter((c) => !decisions[keyOf(c)]);
      const flagged = new Set(open.flatMap((c) => c.ids ?? [c.clip]));
      const px = fitPx(colWidth, Math.max(totalOf(mineTl), totalOf(resolved)));
      const mergedClips = timelineClips(plan.timeline);
      const msg = message ?? `Combine ${source}`;

      body = (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <OpList title={`What ${source} changed`} ops={diff(baseTl, theirsTl)} nameOf={nameOf} empty={`${source} made no changes.`} />
            <OpList title={`What ${current} changed meanwhile`} ops={diff(baseTl, mineTl)} nameOf={nameOf} empty={`${current} made no changes.`} />
          </div>

          <Timeline label={`${current} now`} lane="before" px={px} clips={timelineClips(mineTl)} byClip={byClip} />
          <Timeline label={`${current} after combining`} lane="after" px={px} clips={timelineClips(resolved)} byClip={byClip} flagged={flagged} />

          {plan.conflicts.length === 0 ? (
            <p className="rounded-lg border border-emerald-500/50 p-4 text-sm text-emerald-200">Everything merges automatically. No choices needed.</p>
          ) : (
            <section aria-label="Choices">
              <h2 className="mb-1 text-sm font-semibold">{plan.conflicts.length} choice{plan.conflicts.length === 1 ? "" : "s"} for you</h2>
              <p className="mb-3 text-sm text-dim">Everything else merged automatically. Decide these now, or combine and decide later.</p>
              <div className="space-y-3">
                {plan.conflicts.map((c) => (
                  <ConflictCard key={keyOf(c)} conflict={c} decision={decisions[keyOf(c)]} nameOf={nameOf}
                    labels={{ mine: current, theirs: source }}
                    clip={mergedClips.find((x) => x.id === c.clip)}
                    watch={watchOptions({ timeline: plan.timeline, conflicts: plan.conflicts, decisions, conflict: c, nameOf,
                      labels: { mine: current, theirs: source } })}
                    onDecide={(d) => setDecisions((m) => ({ ...m, [keyOf(c)]: d }))} />
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-edge bg-panel p-4">
            <label className="flex flex-1 flex-col gap-1 text-xs text-dim">
              Save point name
              <input value={msg} onChange={(e) => setMessage(e.target.value)}
                className="rounded-md border border-edge bg-ink px-2.5 py-1.5 text-sm text-text" />
            </label>
            <button onClick={() => {
              store.combine(source, msg, decisions, { author: "You" });
              setSource(""); setDecisions({}); setMessage(null); onChanged(); onDone(store.tip);
            }}
              className={`self-end rounded-md px-4 py-2 text-sm font-medium text-white ${open.length ? "bg-amber-600" : "bg-sky-600"}`}>
              {open.length ? `Combine, leave ${open.length} open` : `Combine into ${current}`}
            </button>
          </div>
        </>
      );
    }
  }

  return (
    <main className="min-w-0 flex-1">
      <div ref={colRef} className="mx-auto max-w-5xl space-y-6 p-6">
        <h1 className="text-lg font-semibold">Combine into {current}</h1>

        <OpenChoices store={store} version={version} onChanged={onChanged} />

        {others.length === 0 ? (
          <p className="text-sm text-dim">There are no other Alt cuts to combine yet. Make one from the Alt cut menu at the top.</p>
        ) : (
          <label className="flex flex-col gap-1 text-xs text-dim">
            Bring in
            <select value={valid ? source : ""} onChange={(e) => pickSource(e.target.value)}
              className="w-72 rounded-md border border-edge bg-raise px-2.5 py-1.5 text-sm text-text">
              <option value="">Choose an Alt cut</option>
              {others.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
            </select>
          </label>
        )}

        {body}
      </div>
    </main>
  );
}
