// three-way timeline merge keyed by stable clip IDs
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mergeValue(b, m, t) {
  if (eq(m, t)) return { v: m };
  if (eq(b, m)) return { v: t };
  if (eq(b, t)) return { v: m };
  return { v: m, conflict: true };
}

function mergeClip(b, m, t) {
  if (eq(m, t)) return { clip: m };
  if (eq(b, m)) return { clip: t };
  if (eq(b, t)) return { clip: m };
  if (!m || !t) return { clip: m ?? t, conflicts: [{ type: "delete-vs-modify" }] };
  const clip = {}, conflicts = [];
  const keys = new Set([...Object.keys(b ?? {}), ...Object.keys(m), ...Object.keys(t)]);
  for (const k of keys) {
    const r = mergeValue(b?.[k], m[k], t[k]);
    if (r.v !== undefined) clip[k] = r.v;
    if (r.conflict) conflicts.push({ type: "same-field", field: k, mine: m[k], theirs: t[k] });
  }
  return { clip, conflicts };
}

function mergeOrder(b, m, t) {
  const [p, s] = eq(m, b) ? [t, m] : [m, t];
  const out = [...p], conflicts = [];
  s.forEach((id, i) => {
    if (out.includes(id)) return;
    let at = 0;
    for (let j = i - 1; j >= 0; j--) {
      const k = out.indexOf(s[j]);
      if (k >= 0) { at = k + 1; break; }
    }
    const next = out[at];
    if (next && !b.includes(id) && !b.includes(next) && !s.includes(next))
      conflicts.push({ type: "same-spot", ids: [next, id] });
    out.splice(at, 0, id);
  });
  return { order: out, conflicts };
}

export function merge(base, mine, theirs) {
  const conflicts = [];
  const trackIds = [...new Set([...mine.tracks, ...theirs.tracks].map((t) => t.id))];
  const byId = (cs) => Object.fromEntries(cs.map((c) => [c.id, c]));
  const tracks = trackIds.map((tid) => {
    const get = (tl) => tl.tracks.find((t) => t.id === tid)?.clips ?? [];
    const [B, M, T] = [base, mine, theirs].map(get);
    const [bi, mi, ti] = [B, M, T].map(byId);
    const { order, conflicts: oc } = mergeOrder(
      B.map((c) => c.id), M.map((c) => c.id), T.map((c) => c.id)
    );
    oc.forEach((c) => conflicts.push({ track: tid, ...c }));
    const clips = [];
    for (const id of order) {
      const r = mergeClip(bi[id], mi[id], ti[id]);
      (r.conflicts ?? []).forEach((c) => conflicts.push({ track: tid, clip: id, ...c }));
      if (r.clip) clips.push(r.clip);
    }
    return { id: tid, clips };
  });
  return { timeline: { tracks }, conflicts };
}
