// Pure helpers for previewing a cut: which clip is on screen at a frame, and which
// frames to show around a choice. No media is involved yet, so the UI draws stand-in frames.
export const FPS = 24;

const clipsOf = (tl) => tl.tracks[0]?.clips ?? [];
const pad = (n) => String(n).padStart(2, "0");

export const totalFrames = (tl) => clipsOf(tl).reduce((n, c) => n + (c.out - c.in), 0);

// Each clip with where it starts and ends on the timeline
export function layoutClips(tl) {
  let t = 0;
  return clipsOf(tl).map((clip) => {
    const start = t;
    t += clip.out - clip.in;
    return { clip, start, end: t };
  });
}

// What is on screen at this frame
export function locate(tl, frame) {
  const spans = layoutClips(tl);
  if (!spans.length) return null;
  const f = Math.min(Math.max(frame, 0), totalFrames(tl) - 1);
  const span = spans.find((s) => f >= s.start && f < s.end) ?? spans[spans.length - 1];
  return {
    clip: span.clip,
    index: spans.indexOf(span),
    start: span.start,
    local: f - span.start,
    sourceFrame: span.clip.in + (f - span.start),
  };
}

export function timecode(frame, fps = FPS) {
  const s = Math.floor(frame / fps);
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(frame % fps)}`;
}

// The moment a choice is about, as a frame on this timeline (null if the clip isn't here)
export function focusFrame(tl, conflict) {
  const ids = conflict.ids ?? [conflict.clip];
  const hit = layoutClips(tl).find((s) => ids.includes(s.clip.id));
  if (!hit) return null;
  if (conflict.type === "same-spot") return hit.start;
  if (conflict.type === "same-field" && conflict.field === "out") return hit.end;
  if (conflict.type === "same-field" && conflict.field === "in") return hit.start;
  return Math.round((hit.start + hit.end) / 2);
}

// About `seconds` of frames centred on a moment, kept inside the timeline
export function windowAround(tl, focus, seconds = 5, fps = FPS) {
  const total = totalFrames(tl);
  const span = Math.min(Math.round(seconds * fps), total);
  const start = Math.max(0, Math.min(Math.round(focus - span / 2), total - span));
  return { start, end: start + span };
}
