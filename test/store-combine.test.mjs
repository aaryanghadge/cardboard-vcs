import { test } from "node:test";
import assert from "node:assert/strict";
import { Store } from "../src/store.mjs";
import { MemoryStorage } from "../src/storage.mjs";
import { keyOf } from "../src/resolve.mjs";

const clip = (id, inn, out) => ({ id, asset: "sha256:" + id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });
const outOf = (t, id) => t.tracks[0].clips.find((c) => c.id === id).out;

function twoCuts() {
  const s = new Store(new MemoryStorage());
  s.save(tl([clip("B", 0, 80)]), "base", { author: "P" });
  s.fork("maya");
  s.save(tl([clip("B", 0, 60)]), "maya", { author: "M" });
  s.switchTo("main");
  s.save(tl([clip("B", 0, 50)]), "main", { author: "P" });
  return s;
}

test("previewCombine writes nothing", () => {
  const s = twoCuts();
  const before = s.all().length, tip = s.tip;
  const plan = s.previewCombine("maya");
  assert.equal(plan.status, "needs-choices");
  assert.equal(plan.conflicts.length, 1);
  assert.equal(s.all().length, before);
  assert.equal(s.tip, tip);
});

test("combine with decisions makes ONE finished save point", () => {
  const s = twoCuts();
  const plan = s.previewCombine("maya");
  const before = s.all().length;
  const r = s.combine("maya", "Combine maya", { [keyOf(plan.conflicts[0])]: { pick: "theirs" } }, { author: "You" });
  assert.equal(r.status, "combined");
  assert.equal(s.all().length, before + 1);
  const sp = s.get(s.tip);
  assert.equal(sp.parents.length, 2);
  assert.equal(sp.conflicts.length, 0);
  assert.equal(sp.author, "You");
  assert.equal(outOf(sp.timeline, "B"), 60);
});

test("combine with no decisions leaves the choice open", () => {
  const s = twoCuts();
  const r = s.combine("maya");
  assert.equal(r.status, "needs-choices");
  assert.equal(s.get(s.tip).conflicts.length, 1);
});

test("all() is newest first and cuts() lists every Alt cut", () => {
  const s = twoCuts();
  const seqs = s.all().map((sp) => sp.seq);
  assert.deepEqual(seqs, [...seqs].sort((a, b) => b - a));
  assert.deepEqual(s.cuts().map((c) => c.name), ["main", "maya"]);
  assert.equal(s.cuts().find((c) => c.current).name, "main");
  assert.equal(s.currentCut, "main");
});

test("fork rejects empty and duplicate names", () => {
  const s = twoCuts();
  assert.throws(() => s.fork("  "), /name/i);
  assert.throws(() => s.fork("maya"), /already exists/);
});
