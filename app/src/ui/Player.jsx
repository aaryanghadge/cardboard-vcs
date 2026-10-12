import { useEffect, useState } from "react";
import { FPS, locate, layoutClips, totalFrames, timecode } from "@engine/player.mjs";

const hueOf = (id) => [...String(id)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);

// Plays a cut (or a window of it) with stand-in frames, until real footage is wired in.
export default function Player({ timeline, label, start = 0, end, focus }) {
  const total = totalFrames(timeline);
  const to = Math.min(end ?? total, total);
  const last = Math.max(start, to - 1);
  const [frame, setFrame] = useState(start);
  const [playing, setPlaying] = useState(false);
  const f = Math.min(Math.max(frame, start), last);

  useEffect(() => { setFrame(start); setPlaying(false); }, [start]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setFrame((cur) => Math.min(cur + 1, last)), 1000 / FPS);
    return () => clearInterval(id);
  }, [playing, last]);

  useEffect(() => { if (playing && f >= last) setPlaying(false); }, [playing, f, last]);

  const here = total > 0 ? locate(timeline, f) : null;
  if (!here) return <p className="rounded-lg border border-edge p-4 text-sm text-dim">{label}: nothing to play.</p>;

  const range = Math.max(to - start, 1);
  const pct = (frameNo) => `${((frameNo - start) / range) * 100}%`;
  const spans = layoutClips(timeline).filter((s) => s.end > start && s.start < to);

  const toggle = () => {
    if (!playing && f >= last) setFrame(start);
    setPlaying((p) => !p);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-edge bg-panel">
      <div role="img" aria-label={`${label}: ${here.clip.name} at ${timecode(f)}`}
        className="relative flex aspect-video flex-col items-center justify-center"
        style={{ background: `hsl(${hueOf(here.clip.id)} 38% 24%)` }}>
        <div className="text-xl font-semibold">{here.clip.name}</div>
        {here.clip.effect && <div className="mt-1 rounded-full border border-white/30 px-2 py-0.5 text-xs">{here.clip.effect}</div>}
        <div className="absolute right-3 top-2 text-xs tabular-nums text-white/80">{timecode(f)}</div>
        <div className="absolute bottom-2 left-3 text-xs text-white/60">stand-in frame</div>
      </div>

      <div className="p-3">
        <div className="relative h-3 overflow-hidden rounded bg-ink">
          <div className="flex h-full">
            {spans.map((s) => {
              const a = Math.max(s.start, start), b = Math.min(s.end, to);
              return (
                <div key={s.clip.id} title={s.clip.name}
                  style={{ width: `${((b - a) / range) * 100}%`, background: `hsl(${hueOf(s.clip.id)} 45% 40%)` }}
                  className="h-full border-r-2 border-r-ink" />
              );
            })}
          </div>
          {focus != null && focus >= start && focus <= to && (
            <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white/80" style={{ left: pct(focus) }} />
          )}
          <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-amber-300" style={{ left: pct(f) }} />
          <input type="range" aria-label={`Scrub ${label}`} min={start} max={last} value={f}
            onChange={(e) => { setFrame(Number(e.target.value)); setPlaying(false); }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button onClick={toggle} aria-label={playing ? `Pause ${label}` : `Play ${label}`}
            className="rounded-md border border-edge bg-raise px-3 py-1 text-sm hover:brightness-110">{playing ? "Pause" : "Play"}</button>
          <span className="text-sm">{label}</span>
        </div>
      </div>
    </div>
  );
}
