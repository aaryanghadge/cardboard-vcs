import { OPS, OP_ORDER } from "../lib.js";

const HATCH = "repeating-linear-gradient(135deg, rgba(255,255,255,.35) 0 3px, transparent 3px 7px)";

// Explains the colors and stripes, so a screenshot explains itself.
export default function Legend() {
  return (
    <ul aria-label="Legend" className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-dim">
      {OP_ORDER.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-5 rounded-sm border-t-[3px] ${OPS[t].block}`} />{OPS[t].label}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-5 rounded-sm bg-rose-950" style={{ backgroundImage: HATCH }} />Frames cut
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-5 rounded-sm bg-emerald-950" style={{ backgroundImage: HATCH }} />Frames gained
      </li>
    </ul>
  );
}
