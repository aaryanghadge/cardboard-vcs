// Apply a human's choice to one conflict. Pure: returns a NEW timeline.
const clone = (x) => JSON.parse(JSON.stringify(x));

// Identifies a conflict so decisions can be stored against it
export const keyOf = (c) => [c.type, c.track, c.clip, c.field].join("|");

export function resolve(timeline, conflict, choice) {
  if (conflict.type !== "same-field" && conflict.type !== "delete-vs-modify")
    throw new Error("Cannot resolve yet: " + conflict.type);

  const tl = clone(timeline);
  const track = tl.tracks.find((t) => t.id === conflict.track);
  const clip = track?.clips.find((c) => c.id === conflict.clip);
  if (!clip) throw new Error("Clip not found: " + conflict.clip);

  if (conflict.type === "same-field") {
    const v = { mine: conflict.mine, theirs: conflict.theirs, custom: choice.value }[choice.pick];
    if (v === undefined) throw new Error("Unknown choice: " + choice.pick);
    clip[conflict.field] = v;
  } else if (choice.pick === "delete") {
    track.clips = track.clips.filter((c) => c.id !== clip.id);
  } else if (choice.pick !== "keep") {
    throw new Error("Unknown choice: " + choice.pick);
  }
  return tl;
}

// Apply every decision that has been made; undecided conflicts are left as-is
export function resolveAll(timeline, conflicts, decisions) {
  return conflicts.reduce(
    (tl, c) => (decisions[keyOf(c)] ? resolve(tl, c, decisions[keyOf(c)]) : tl),
    timeline
  );
}
