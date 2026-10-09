export const FPS = 24;
export const PX = 2.4; // pixels per frame on the timeline

// One place that defines how each kind of change looks and reads.
export const OPS = {
  added:   { label: "Added",   sym: "+", text: "text-emerald-300", block: "bg-emerald-700 border-emerald-400" },
  removed: { label: "Removed", sym: "−", text: "text-rose-300",    block: "bg-rose-800 border-rose-400" },
  moved:   { label: "Moved",   sym: "↕", text: "text-sky-300",     block: "bg-sky-800 border-sky-400" },
  trimmed: { label: "Trimmed", sym: "✂", text: "text-amber-300",   block: "bg-amber-700 border-amber-400" },
  changed: { label: "Changed", sym: "≠", text: "text-violet-300",  block: "bg-violet-800 border-violet-400" },
  same:    { label: "Unchanged", sym: "", text: "text-dim",        block: "bg-raise border-edge" },
};
export const OP_ORDER = ["added", "removed", "moved", "trimmed", "changed"];

export const len = (c) => c.out - c.in;
export const totalOf = (tl) => tl.tracks.flatMap((t) => t.clips).reduce((n, c) => n + len(c), 0);
export const seconds = (frames) => (frames / FPS).toFixed(1) + "s";
export const signed = (n) => (n > 0 ? "+" : "") + n;

// The first op type found (in priority order) decides a clip's color.
export function statusOf(ops = []) {
  return OP_ORDER.find((t) => ops.some((o) => o.type === t)) ?? "same";
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
