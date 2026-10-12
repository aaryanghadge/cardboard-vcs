import { useState } from "react";

const BAR_PX = 2.2;
const fieldName = (f) => (f === "in" ? "in point" : f === "out" ? "out point" : f);
const show = (v) => String(v ?? "none");

// One choice an editor has to make. `labels` says who "mine" and "theirs" are.
export default function ConflictCard({ conflict, decision, onDecide, nameOf, labels, clip }) {
  const [custom, setCustom] = useState("");
  const pick = decision?.pick;

  const btn = (value, text) => (
    <button key={value} onClick={() => onDecide({ pick: value })} aria-pressed={pick === value}
      className={`rounded-md border px-3 py-1.5 text-sm transition-colors
        ${pick === value ? "border-sky-400 bg-sky-500/20 text-white" : "border-edge bg-raise hover:brightness-110"}`}>
      {text}
    </button>
  );

  let title, body, actions;

  if (conflict.type === "same-field") {
    const numeric = typeof conflict.mine === "number" && typeof conflict.theirs === "number";
    const lengthIf = (v) => (conflict.field === "out" ? v - clip.in : conflict.field === "in" ? clip.out - v : null);
    const bar = (who, v, color) => {
      const l = numeric ? lengthIf(v) : null;
      return l == null ? null : (
        <div className={`my-1 h-4 rounded px-1.5 text-[11px] leading-4 ${color}`} style={{ width: Math.max(l, 1) * BAR_PX }}>{who} {l}f</div>
      );
    };
    const submitCustom = () => {
      const v = numeric ? parseInt(custom, 10) : custom.trim();
      if (numeric ? Number.isNaN(v) : v === "") return;
      onDecide({ pick: "custom", value: v });
    };
    title = `${nameOf(conflict.clip)}: ${fieldName(conflict.field)}`;
    body = (
      <>
        <p className="text-sm text-dim">{labels.mine} set it to {show(conflict.mine)}. {labels.theirs} set it to {show(conflict.theirs)}.</p>
        {bar(labels.mine, conflict.mine, "bg-sky-600/70")}
        {bar(labels.theirs, conflict.theirs, "bg-amber-600/70")}
      </>
    );
    actions = (
      <>
        {btn("mine", `Use ${labels.mine}'s`)}
        {btn("theirs", `Use ${labels.theirs}'s`)}
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="custom"
          aria-label="Custom value"
          className="w-24 rounded-md border border-edge bg-ink px-2 py-1.5 text-sm" />
        <button onClick={submitCustom} aria-pressed={pick === "custom"}
          className={`rounded-md border px-3 py-1.5 text-sm ${pick === "custom" ? "border-sky-400 bg-sky-500/20" : "border-edge bg-raise hover:brightness-110"}`}>
          Use custom
        </button>
      </>
    );
  } else if (conflict.type === "delete-vs-modify") {
    const by = conflict.deletedBy === "mine" ? labels.mine : labels.theirs;
    const other = conflict.deletedBy === "mine" ? labels.theirs : labels.mine;
    title = `${nameOf(conflict.clip)}: removed and edited`;
    body = <p className="text-sm text-dim">{by} removed this clip while {other} edited it.</p>;
    actions = <>{btn("keep", "Keep the clip")}{btn("delete", "Remove the clip")}</>;
  } else {
    const [next, added] = conflict.ids;
    title = "Two clips were added in the same spot";
    body = <p className="text-sm text-dim">{nameOf(added)} and {nameOf(next)} both landed in the same place. Which should play first?</p>;
    actions = (
      <>
        {btn("keep", `${nameOf(added)}, then ${nameOf(next)}`)}
        {btn("swap", `${nameOf(next)}, then ${nameOf(added)}`)}
      </>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${decision ? "border-emerald-500/60" : "border-rose-400/50"} bg-panel`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className={`text-xs ${decision ? "text-emerald-300" : "text-rose-300"}`}>{decision ? "Decided" : "Needs a choice"}</span>
      </div>
      <div className="mt-1">{body}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}
