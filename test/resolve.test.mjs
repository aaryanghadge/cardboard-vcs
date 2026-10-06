import { test } from "node:test";
import assert from "node:assert/strict";
import { merge } from "../src/merge.mjs";
import { resolve, resolveAll, keyOf } from "../src/resolve.mjs";

const clip = (id, inn, out) => ({ id, asset: "sha256:" + id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });
const outOf = (t, id) => t.tracks[0].clips.find((c) => c.id === id)?.out;

const fieldCase = () =>
  merge(tl([clip("B", 0, 80)]), tl([clip("B", 0, 50)]), tl([clip("B", 0, 60)]));

test("same-field: mine, theirs and custom", () => {
  const { timeline, conflicts } = fieldCase();
  assert.equal(outOf(resolve(timeline, conflicts[0], { pick: "mine" }), "B"), 50);
  assert.equal(outOf(resolve(timeline, conflicts[0], { pick: "theirs" }), "B"), 60);
  assert.equal(outOf(resolve(timeline, conflicts[0], { pick: "custom", value: 55 }), "B"), 55);
});

test("delete-vs-modify: keep or delete", () => {
  const { timeline, conflicts } = merge(
    tl([clip("A", 0, 120)]), tl([]), tl([clip("A", 0, 100)])
  );
  assert.equal(conflicts[0].type, "delete-vs-modify");
  assert.equal(resolve(timeline, conflicts[0], { pick: "keep" }).tracks[0].clips.length, 1);
  assert.equal(resolve(timeline, conflicts[0], { pick: "delete" }).tracks[0].clips.length, 0);
});

test("resolve does not mutate the input timeline", () => {
  const { timeline, conflicts } = fieldCase();
  resolve(timeline, conflicts[0], { pick: "theirs" });
  assert.equal(outOf(timeline, "B"), 50);
});

test("resolveAll leaves undecided conflicts alone", () => {
  const { timeline, conflicts } = fieldCase();
  assert.equal(outOf(resolveAll(timeline, conflicts, {}), "B"), 50);
  const d = { [keyOf(conflicts[0])]: { pick: "theirs" } };
  assert.equal(outOf(resolveAll(timeline, conflicts, d), "B"), 60);
});
