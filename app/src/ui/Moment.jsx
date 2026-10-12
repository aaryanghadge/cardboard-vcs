import { useState } from "react";
import { focusFrame, windowAround } from "@engine/player.mjs";
import Player from "./Player.jsx";

// "Watch the 5 seconds around it", once per way the choice could go.
export default function Moment({ conflict, options }) {
  const [open, setOpen] = useState(false);
  const foci = options.map((o) => focusFrame(o.timeline, conflict));
  const fallback = foci.find((f) => f != null) ?? 0;

  return (
    <div className="mt-3">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-dim hover:text-white">
        {open ? "Hide the preview" : "Watch the 5 seconds around it"}
      </button>
      {open && (
        <>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {options.map((o, i) => {
              const focus = foci[i] ?? fallback;
              const w = windowAround(o.timeline, focus);
              return <Player key={o.label} label={o.label} timeline={o.timeline} start={w.start} end={w.end} focus={focus} />;
            })}
          </div>
          <p className="mt-2 text-xs text-dim">Stand-in frames for now. Real footage plugs in here, so you can decide by watching. The white mark is the moment in question.</p>
        </>
      )}
    </div>
  );
}
