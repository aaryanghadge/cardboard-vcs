import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../src/store.mjs";
import { keyOf } from "../src/resolve.mjs";

const clip = (id, inn, out) => ({ id, asset: "sha256:" + id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });
const mk = () => new Store(mkdtempSync(join(tmpdir(), "cb-")));
const outOf = (t, id) => t.tracks[0].clips.find((c) => c.id === id).out;

function conflicted(baseClips, mainClips, mayaClips) {
  const s = mk();
  s.save(tl(baseClips), "base");
  s.fork("maya");
  s.save(tl(mayaClips), "maya");
  s.switchTo("main");
  s.save(tl(mainClips), "main");
  return { s, r: s.combine("maya") };
}

test("resolveCombine makes a new save point on top of the conflicted one", () => {
  const { s, r } = conflicted([clip("B", 0, 80)], [clip("B", 0, 50)], [clip("B", 0, 60)]);
  const combined = s.tip;
  const id = s.resolveCombine({ [keyOf(r.conflicts[0])]: { pick: "theirs" } }, "Took Maya's trim");
  const sp = s.get(id);
  assert.equal(s.tip, id);
  assert.deepEqual(sp.parents, [combined]);
  assert.equal(sp.conflicts.length, 0);
  assert.equal(outOf(sp.timeline, "B"), 60);
  assert.equal(s.get(combined).conflicts.length, 1); // the conflicted save point is untouched
});

test("partial resolution carries the remaining conflicts forward", () => {
  const { s, r } = conflicted(
    [clip("B", 0, 80), clip("C", 0, 80)],
    [clip("B", 0, 50), clip("C", 0, 40)],
    [clip("B", 0, 60), clip("C", 0, 70)]
  );
  assert.equal(r.conflicts.length, 2);
  const id = s.resolveCombine({ [keyOf(r.conflicts[0])]: { pick: "mine" } });
  const sp = s.get(id);
  assert.equal(sp.conflicts.length, 1);
  assert.equal(sp.conflicts[0].clip, "C");
});

test("resolveCombine throws when there is nothing to resolve", () => {
  const s = mk();
  s.save(tl([clip("A", 0, 10)]), "base");
  assert.throws(() => s.resolveCombine({}), /no conflicts/i);
});
