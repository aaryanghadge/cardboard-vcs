// Apply a human's choice to one conflict. Pure: returns a NEW timeline.
const clone = (x) => JSON.parse(JSON.stringify(x));

// Identifies a conflict so decisions can be stored against it
export const keyOf = (c) => [c.type, c.track, c.clip, c.field, c.ids?.join(",")].join("|");

export const RESOLVABLE = ["same-field", "delete-vs-modify", "same-spot"];

export function resolve(timeline, conflict, choice) {
  if (!RESOLVABLE.includes(conflict.type))
    throw new Error("Cannot resolve yet: " + conflict.type);

  const tl = clone(timeline);
  const track = tl.tracks.find((t) => t.id === conflict.track);
  if (!track) throw new Error("Track not found: " + conflict.track);

  if (conflict.type === "same-spot") {
    if (choice.pick === "keep") return tl;
    if (choice.pick !== "swap") throw new Error("Unknown choice: " + choice.pick);
    const [i, j] = conflict.ids.map((id) => track.clips.findIndex((c) => c.id === id));
    if (i < 0 || j < 0) throw new Error("Clips not found for same-spot conflict");
    [track.clips[i], track.clips[j]] = [track.clips[j], track.clips[i]];
    return tl;
  }

  const clip = track.clips.find((c) => c.id === conflict.clip);
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
export function resolveAll(timeline, conflicts, decisions = {}) {
  return conflicts.reduce(
    (tl, c) => (decisions[keyOf(c)] ? resolve(tl, c, decisions[keyOf(c)]) : tl),
    timeline
  );
}
