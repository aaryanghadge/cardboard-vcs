import { test } from "node:test";
import assert from "node:assert/strict";
import { Store } from "../src/store.mjs";
import { MemoryStorage } from "../src/storage.mjs";
import { seedDemoProject } from "../src/demo-project.mjs";

const fresh = () => seedDemoProject(new Store(new MemoryStorage()));
const clipOf = (tl, id) => tl.tracks[0].clips.find((c) => c.id === id);

test("demo project has 5 save points across 3 Alt cuts and ends on main", () => {
  const s = fresh();
  assert.equal(s.all().length, 5);
  assert.deepEqual(s.cuts().map((c) => c.name), ["main", "maya-intro", "color-pass"]);
  assert.equal(s.currentCut, "main");
});

test("color-pass combines cleanly", () => {
  const plan = fresh().previewCombine("color-pass");
  assert.equal(plan.status, "combined");
  assert.equal(clipOf(plan.timeline, "A").effect, "grade-warm");
  assert.equal(clipOf(plan.timeline, "B").effect, "lower-third");
});

test("maya-intro combines with exactly one choice, everything else automatic", () => {
  const plan = fresh().previewCombine("maya-intro");
  assert.equal(plan.status, "needs-choices");
  assert.equal(plan.conflicts.length, 1);
  assert.equal(plan.conflicts[0].clip, "B");
  assert.equal(plan.conflicts[0].field, "out");
  const a = clipOf(plan.timeline, "A");
  assert.equal(a.in, 10);
  assert.equal(a.out, 100);
  assert.ok(clipOf(plan.timeline, "T") && clipOf(plan.timeline, "M"));
});
