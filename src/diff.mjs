// Semantic diff between two timelines, keyed by stable clip IDs.
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Longest common subsequence of two arrays of IDs.
// Items in the LCS "stayed in place"; shared items outside it are "moved".
function lcs(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push(a[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return out;
}

export function diff(a, b) {
  const ops = [];
  const trackIds = [...new Set([...a.tracks, ...b.tracks].map((t) => t.id))];

  for (const tid of trackIds) {
    const A = a.tracks.find((t) => t.id === tid)?.clips ?? [];
    const B = b.tracks.find((t) => t.id === tid)?.clips ?? [];
    const ai = Object.fromEntries(A.map((c) => [c.id, c]));
    const bi = Object.fromEntries(B.map((c) => [c.id, c]));
    const aIds = A.map((c) => c.id);
    const bIds = B.map((c) => c.id);

    // removed: in A, not in B
    for (const id of aIds)
      if (!bi[id]) ops.push({ type: "removed", track: tid, clip: id, index: aIds.indexOf(id) });

    // added: in B, not in A
    bIds.forEach((id, idx) => {
      if (!ai[id])
        ops.push({ type: "added", track: tid, clip: id, index: idx, after: bIds[idx - 1] ?? null });
    });

    // moved: shared clips that are not part of the longest common subsequence
    const commonA = aIds.filter((id) => bi[id]);
    const commonB = bIds.filter((id) => ai[id]);
    const stay = new Set(lcs(commonA, commonB));
    for (const id of commonB)
      if (!stay.has(id))
        ops.push({ type: "moved", track: tid, clip: id, from: aIds.indexOf(id), to: bIds.indexOf(id) });

    // trimmed / changed: shared clips whose fields differ
    for (const id of commonB) {
      const x = ai[id], y = bi[id];
      if (eq(x, y)) continue;
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
        if (eq(x[k], y[k])) continue;
        if ((k === "in" || k === "out") && typeof x[k] === "number" && typeof y[k] === "number")
          ops.push({ type: "trimmed", track: tid, clip: id, field: k, from: x[k], to: y[k], delta: y[k] - x[k] });
        else
          ops.push({ type: "changed", track: tid, clip: id, field: k, from: x[k], to: y[k] });
      }
    }
  }
  return ops;
}

// Human-readable line for an op (what an editor would read).
export function describe(op) {
  switch (op.type) {
    case "added":
      return `+ Clip ${op.clip} added on ${op.track} ` + (op.after ? `after ${op.after}` : "at the start");
    case "removed":
      return `- Clip ${op.clip} removed from ${op.track}`;
    case "moved":
      return `~ Clip ${op.clip} moved from position ${op.from + 1} to ${op.to + 1}`;
    case "trimmed":
      return `~ Clip ${op.clip}: ${op.field} trimmed ${op.delta > 0 ? "+" : ""}${op.delta}f (${op.from} -> ${op.to})`;
    default:
      return `~ Clip ${op.clip}: ${op.field} changed (${op.from} -> ${op.to})`;
  }
}
