import { OPS, PX, len, seconds, signed, statusOf, FPS } from "../lib.js";

export default function Timeline({ label, clips, byClip, selected, onSelect, showDeltas }) {
  const total = clips.reduce((n, c) => n + len(c), 0);
  const wholeSeconds = Math.floor(total / FPS);

  return (
    <section aria-label={label}>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-dim">{total} frames, {seconds(total)}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-edge bg-panel">
        <div style={{ width: Math.max(total * PX, 1) + 24 }} className="p-3">
          <div className="relative mb-1 h-4" aria-hidden="true">
            {Array.from({ length: wholeSeconds + 1 }, (_, i) => (
              <span key={i} className="absolute top-0 border-l border-edge pl-1 text-[10px] leading-4 text-dim"
                style={{ left: i * FPS * PX }}>{i}s</span>
            ))}
          </div>

          <div className="flex">
            {clips.map((c) => {
              const ops = byClip[c.id] ?? [];
              const status = statusOf(ops);
              const isSel = selected === c.id;
              const deltas = showDeltas ? ops.filter((o) => o.type === "trimmed") : [];
              return (
                <button key={c.id} onClick={() => onSelect(isSel ? null : c.id)}
                  aria-pressed={isSel}
                  title={`${c.name}: ${OPS[status].label}`}
                  style={{ width: len(c) * PX }}
                  className={`h-16 shrink-0 overflow-hidden border-l-2 border-r-2 px-2 py-1.5 text-left transition-colors
                    ${OPS[status].block} ${isSel ? "ring-2 ring-inset ring-white" : "hover:brightness-110"}`}>
                  <div className="truncate text-sm font-medium">{c.name}</div>
                  <div className="flex flex-wrap gap-x-2 text-xs text-white/70">
                    <span>{len(c)}f</span>
                    {deltas.map((o, i) => <span key={i} className="text-amber-100">{signed(o.delta)}f</span>)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
