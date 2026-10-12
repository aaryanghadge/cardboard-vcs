import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { sha256Hex } from "../src/hash.mjs";

const node = (s) => createHash("sha256").update(s).digest("hex");

test("pure-JS sha256 matches Node's crypto", () => {
  const samples = [
    "", "abc", "hello world", "The quick brown fox jumps over the lazy dog",
    "é ü 日本語 🎬", "x".repeat(55), "x".repeat(56), "x".repeat(64), "x".repeat(1000),
    JSON.stringify({ tracks: [{ id: "V1", clips: [{ id: "A", in: 0, out: 120 }] }] }),
  ];
  for (const s of samples) assert.equal(sha256Hex(s), node(s), `mismatch for length ${s.length}`);
});
