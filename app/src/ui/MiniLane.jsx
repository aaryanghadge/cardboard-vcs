import { OPS, len, statusOf } from "../lib.js";

// A compact one-row view of a cut, colored by what changed.
export default function MiniLane({ label, clips, byClip = {} }) {
  const total = clips.reduce((n, c) => n + len(c), 0) || 1;
  return (
    <div>
      <div className="mb-1 text-xs text-dim">{label}</div>
      <div className="flex overflow-hidden rounded-md border border-edge">
        {clips.map((c) => (
          <div key={c.id} title={`${c.name}: ${OPS[statusOf(byClip[c.id])].label}`}
            style={{ width: `${(len(c) / total) * 100}%` }}
            className={`h-9 truncate border-r-2 border-r-panel border-t-[3px] px-1.5 py-1 text-[11px] leading-tight ${OPS[statusOf(byClip[c.id])].block}`}>
            {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}
