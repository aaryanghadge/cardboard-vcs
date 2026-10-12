export const FPS = 24;
export const PX = 2.4; // default pixels per frame on a timeline

// One place that defines how each kind of change looks and reads.
export const OPS = {
  added:   { label: "Added",   sym: "+", text: "text-emerald-300", block: "bg-emerald-900 border-t-emerald-400" },
  removed: { label: "Removed", sym: "−", text: "text-rose-300",    block: "bg-rose-900 border-t-rose-400" },
  moved:   { label: "Moved",   sym: "↕", text: "text-sky-300",     block: "bg-sky-900 border-t-sky-400" },
  trimmed: { label: "Trimmed", sym: "~", text: "text-amber-300",   block: "bg-amber-900 border-t-amber-400" },
  changed: { label: "Changed", sym: "≠", text: "text-violet-300",  block: "bg-violet-900 border-t-violet-400" },
  same:    { label: "Unchanged", sym: "", text: "text-dim",        block: "bg-raise border-t-edge" },
};
export const OP_ORDER = ["added", "removed", "moved", "trimmed", "changed"];

export const LANE_COLORS = ["#d6b48a", "#7aa2f7", "#9ece6a", "#bb9af7", "#f7768e", "#7dcfff"];

export const len = (c) => c.out - c.in;
export const timelineClips = (tl) => tl.tracks.flatMap((t) => t.clips);
export const clipsOf = (sp) => timelineClips(sp.timeline);
export const totalOf = (tl) => timelineClips(tl).reduce((n, c) => n + len(c), 0);
export const seconds = (frames) => (frames / FPS).toFixed(1) + "s";
export const signed = (n) => (n > 0 ? "+" : "") + n;

export function ago(time, now = Date.now()) {
  const m = Math.round((now - time) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

// The first op type found (in priority order) decides a clip's color.
export function statusOf(ops = []) {
  return OP_ORDER.find((t) => ops.some((o) => o.type === t)) ?? "same";
}

export function groupByClip(ops) {
  const by = {};
  ops.forEach((o) => (by[o.clip] ||= []).push(o));
  return by;
}

export function sentence(op, nameOf) {
  switch (op.type) {
    case "added":   return op.after ? `added after ${nameOf(op.after)}` : "added at the start";
    case "removed": return "removed";
    case "moved":   return `moved from position ${op.from + 1} to ${op.to + 1}`;
    case "trimmed": return `${op.field === "in" ? "in point" : "out point"} ${signed(op.delta)} frames`;
    default:        return `${op.field} changed from ${String(op.from ?? "none")} to ${String(op.to ?? "none")}`;
  }
}

export const makeNameOf = (...timelines) => {
  const all = timelines.flatMap(timelineClips);
  return (id) => all.find((c) => c.id === id)?.name ?? id;
};
