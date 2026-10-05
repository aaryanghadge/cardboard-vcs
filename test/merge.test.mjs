import { test } from "node:test";
import assert from "node:assert/strict";
import { merge } from "../src/merge.mjs";

const clip = (id, inn, out) => ({ id, asset: "sha256:" + id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });

test("different fields on same clip auto-merge", () => {
  const base = tl([clip("A", 0, 120)]);
  const mine = tl([clip("A", 0, 100)]);
  const theirs = tl([clip("A", 10, 120)]);
  const { timeline, conflicts } = merge(base, mine, theirs);
  assert.equal(conflicts.length, 0);
  assert.equal(timeline.tracks[0].clips[0].in, 10);
  assert.equal(timeline.tracks[0].clips[0].out, 100);
});

test("same field changed differently conflicts", () => {
  const base = tl([clip("B", 0, 80)]);
  const mine = tl([clip("B", 0, 50)]);
  const theirs = tl([clip("B", 0, 60)]);
  const { conflicts } = merge(base, mine, theirs);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].type, "same-field");
});

test("delete vs modify conflicts", () => {
  const base = tl([clip("A", 0, 120)]);
  const mine = tl([]);
  const theirs = tl([clip("A", 0, 100)]);
  const { conflicts } = merge(base, mine, theirs);
  assert.equal(conflicts[0].type, "delete-vs-modify");
});

test("both insert at same spot conflicts", () => {
  const base = tl([clip("A", 0, 10), clip("C", 0, 10)]);
  const mine = tl([clip("A", 0, 10), clip("M", 0, 5), clip("C", 0, 10)]);
  const theirs = tl([clip("A", 0, 10), clip("T", 0, 5), clip("C", 0, 10)]);
  const { conflicts } = merge(base, mine, theirs);
  assert.equal(conflicts[0].type, "same-spot");
});
