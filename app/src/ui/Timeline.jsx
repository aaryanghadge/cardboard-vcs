import { OPS, PX as DEFAULT_PX, len, seconds, signed, statusOf, FPS } from "../lib.js";

const HATCH = "repeating-linear-gradient(135deg, rgba(255,255,255,.35) 0 3px, transparent 3px 7px)";

// Frames cut (Before lane) or gained (After lane) by a trim, as spans inside the clip.
function spans(c, ops, lane) {
  const out = [];
  for (const o of ops) {
    if (o.type !== "trimmed") continue;
    if (lane === "before") {
      if (o.field === "out" && o.delta < 0) out.push({ left: c.out + o.delta - c.in, frames: -o.delta, cut: true });
      if (o.field === "in" && o.delta > 0) out.push({ left: 0, frames: o.delta, cut: true });
    } else {
      if (o.field === "out" && o.delta > 0) out.push({ left: c.out - o.delta - c.in, frames: o.delta, cut: false });
      if (o.field === "in" && o.delta < 0) out.push({ left: 0, frames: -o.delta, cut: false });
    }
  }
  return out;
}

export default function Timeline({ label, lane, clips, byClip = {}, selected, onSelect, px = DEFAULT_PX, flagged }) {
  const total = clips.reduce((n, c) => n + len(c), 0);
  const wholeSeconds = Math.floor(total / FPS);

  return (
    <section aria-label={label}>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-dim">{total} frames, {seconds(total)}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-edge bg-panel">
        {clips.length === 0 ? (
          <p className="p-4 text-sm text-dim">No clips on this timeline.</p>
        ) : (
          <div style={{ width: Math.max(total * px, 1) + 24 }} className="p-3">
            <div className="relative mb-1 h-4" aria-hidden="true">
              {Array.from({ length: wholeSeconds + 1 }, (_, i) => (
                <span key={i} className="absolute top-0 border-l border-edge pl-1 text-[10px] leading-4 text-dim"
                  style={{ left: i * FPS * px }}>{i}s</span>
              ))}
            </div>

            <div className="flex">
              {clips.map((c) => {
                const ops = byClip[c.id] ?? [];
                const status = statusOf(ops);
                const isSel = selected === c.id;
                const isFlag = flagged?.has(c.id);
                const deltas = lane === "after" ? ops.filter((o) => o.type === "trimmed") : [];
                return (
                  <button key={c.id} onClick={() => onSelect?.(isSel ? null : c.id)}
                    aria-pressed={isSel}
                    title={`${c.name}: ${isFlag ? "needs a choice" : OPS[status].label}`}
                    style={{ width: len(c) * px }}
                    className={`relative h-[4.5rem] shrink-0 overflow-hidden border-r-2 border-r-panel border-t-[3px] px-2 py-1.5 text-left transition-colors
                      ${OPS[status].block}
                      ${isSel ? "ring-2 ring-inset ring-white" : isFlag ? "ring-2 ring-inset ring-rose-400" : "hover:brightness-110"}`}>
                    {spans(c, ops, lane).map((s, i) => (
                      <span key={i} aria-hidden="true"
                        className={`absolute inset-y-0 ${s.cut ? "bg-rose-950/70" : "bg-emerald-950/50"}`}
                        style={{ left: s.left * px, width: s.frames * px, backgroundImage: HATCH }} />
                    ))}
                    <div className="relative line-clamp-2 break-words text-sm font-medium leading-tight [text-shadow:0_1px_2px_rgb(0_0_0/0.75)]">{c.name}</div>
                    <div className="relative flex flex-wrap gap-x-2 text-xs text-white/80 [text-shadow:0_1px_2px_rgb(0_0_0/0.75)]">
                      <span>{len(c)}f</span>
                      {deltas.map((o, i) => <span key={i} className="text-amber-100">{signed(o.delta)}f</span>)}
                      {isFlag && <span className="text-rose-200">needs a choice</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
