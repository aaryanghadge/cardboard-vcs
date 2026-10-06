import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store, hashOf } from "../src/store.mjs";

const clip = (id, inn, out) => ({ id, asset: "sha256:" + id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });
const mk = () => new Store(mkdtempSync(join(tmpdir(), "cb-")));

test("hash ignores key order", () => {
  assert.equal(hashOf({ a: 1, b: 2 }), hashOf({ b: 2, a: 1 }));
});

test("save builds a chain of save points", () => {
  const s = mk();
  const a = s.save(tl([clip("A", 0, 10)]), "first");
  const b = s.save(tl([clip("A", 0, 20)]), "second");
  assert.deepEqual(s.history().map((h) => h.id), [b, a]);
  assert.deepEqual(s.get(b).parents, [a]);
});

test("combine auto-merges non-conflicting Alt cuts", () => {
  const s = mk();
  s.save(tl([clip("A", 0, 120)]), "base");
  s.fork("maya");
  s.save(tl([clip("A", 10, 120)]), "maya trims in");
  s.switchTo("main");
  s.save(tl([clip("A", 0, 100)]), "main trims out");
  const r = s.combine("maya");
  assert.equal(r.status, "combined");
  const c = s.get(s.tip).timeline.tracks[0].clips[0];
  assert.equal(c.in, 10);
  assert.equal(c.out, 100);
  assert.equal(s.get(s.tip).parents.length, 2);
});

test("combine reports conflicts but still saves", () => {
  const s = mk();
  s.save(tl([clip("B", 0, 80)]), "base");
  s.fork("maya");
  s.save(tl([clip("B", 0, 60)]), "maya");
  s.switchTo("main");
  s.save(tl([clip("B", 0, 50)]), "main");
  const r = s.combine("maya");
  assert.equal(r.status, "needs-choices");
  assert.equal(r.conflicts[0].type, "same-field");
  assert.equal(s.get(s.tip).conflicts.length, 1);
});

test("combine fast-forwards when one side has no new work", () => {
  const s = mk();
  s.save(tl([clip("A", 0, 10)]), "base");
  s.fork("maya");
  const m = s.save(tl([clip("A", 0, 20)]), "maya");
  s.switchTo("main");
  const r = s.combine("maya");
  assert.equal(r.status, "fast-forward");
  assert.equal(s.tip, m);
});

test("goBackTo moves the tip but keeps old save points", () => {
  const s = mk();
  const a = s.save(tl([clip("A", 0, 10)]), "a");
  const b = s.save(tl([clip("A", 0, 20)]), "b");
  s.goBackTo(a);
  assert.equal(s.tip, a);
  assert.equal(s.get(b).message, "b");
});
