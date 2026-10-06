import { test } from "node:test";
import assert from "node:assert/strict";
import { diff, describe } from "../src/diff.mjs";

const clip = (id, inn, out) => ({ id, asset: "sha256:" + id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });

test("identical timelines produce no ops", () => {
  const t = tl([clip("A", 0, 10), clip("B", 0, 20)]);
  assert.deepEqual(diff(t, t), []);
});

test("detects added clip and where it was inserted", () => {
  const ops = diff(tl([clip("A", 0, 10)]), tl([clip("A", 0, 10), clip("B", 0, 5)]));
  assert.equal(ops.length, 1);
  assert.equal(ops[0].type, "added");
  assert.equal(ops[0].after, "A");
});

test("detects removed clip", () => {
  const ops = diff(tl([clip("A", 0, 10), clip("B", 0, 5)]), tl([clip("A", 0, 10)]));
  assert.equal(ops[0].type, "removed");
  assert.equal(ops[0].clip, "B");
});

test("detects trim with frame delta", () => {
  const ops = diff(tl([clip("A", 0, 120)]), tl([clip("A", 0, 100)]));
  assert.equal(ops.length, 1);
  assert.equal(ops[0].type, "trimmed");
  assert.equal(ops[0].field, "out");
  assert.equal(ops[0].delta, -20);
});

test("detects non-trim field change", () => {
  const a = tl([{ ...clip("A", 0, 10), effect: "blur" }]);
  const b = tl([{ ...clip("A", 0, 10), effect: "none" }]);
  const ops = diff(a, b);
  assert.equal(ops[0].type, "changed");
  assert.equal(ops[0].field, "effect");
});

test("moving one clip reports a single move, not several", () => {
  const a = tl([clip("A", 0, 1), clip("B", 0, 1), clip("C", 0, 1)]);
  const b = tl([clip("C", 0, 1), clip("A", 0, 1), clip("B", 0, 1)]);
  const ops = diff(a, b);
  assert.equal(ops.length, 1);
  assert.equal(ops[0].type, "moved");
  assert.equal(ops[0].clip, "C");
  assert.equal(ops[0].from, 2);
  assert.equal(ops[0].to, 0);
});

test("describe produces readable text", () => {
  const ops = diff(tl([clip("A", 0, 120)]), tl([clip("A", 0, 100)]));
  assert.equal(describe(ops[0]), "~ Clip A: out trimmed -20f (120 -> 100)");
});
