import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MemoryStorage, BrowserStorage } from "../src/storage.mjs";
import { FsStorage } from "../src/storage-fs.mjs";
import { Store } from "../src/store.mjs";

// A tiny stand-in for window.localStorage
function fakeLocalStorage() {
  const m = new Map();
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

const adapters = {
  memory: () => new MemoryStorage(),
  fs: () => new FsStorage(mkdtempSync(join(tmpdir(), "cb-"))),
  browser: () => new BrowserStorage("t:", fakeLocalStorage()),
};

for (const [name, make] of Object.entries(adapters)) {
  test(`${name} storage: objects and refs round-trip`, () => {
    const s = make();
    assert.equal(s.readRefs(), null);
    assert.equal(s.hasObject("abc"), false);
    assert.throws(() => s.readObject("abc"), /Unknown save point/);
    s.writeObject("abc", { id: "abc", n: 1 });
    s.writeObject("def", { id: "def", n: 2 });
    assert.equal(s.hasObject("abc"), true);
    assert.deepEqual(s.readObject("def"), { id: "def", n: 2 });
    assert.deepEqual(s.listObjectIds().sort(), ["abc", "def"]);
    s.writeRefs({ current: "main", cuts: { main: "abc" } });
    assert.deepEqual(s.readRefs(), { current: "main", cuts: { main: "abc" } });
  });

  test(`${name} storage: a Store survives being reopened`, () => {
    const s = make();
    const a = new Store(s);
    const tl = { tracks: [{ id: "V1", clips: [{ id: "A", in: 0, out: 10 }] }] };
    const id = a.save(tl, "first", { author: "Test" });
    const b = new Store(s); // same storage, new Store object
    assert.equal(b.tip, id);
    assert.equal(b.get(id).author, "Test");
  });
}

test("browser storage clear only removes its own keys", () => {
  const ls = fakeLocalStorage();
  ls.setItem("other:key", "keep");
  const s = new BrowserStorage("t:", ls);
  s.writeObject("a", { id: "a" });
  s.writeRefs({ current: "main", cuts: {} });
  s.clear();
  assert.equal(s.listObjectIds().length, 0);
  assert.equal(ls.getItem("other:key"), "keep");
});

test("Store rejects a bare directory string with a helpful message", () => {
  assert.throws(() => new Store("some/dir"), /storage adapter/);
});
