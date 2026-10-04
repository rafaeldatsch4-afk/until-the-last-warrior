import { test } from "node:test";
import assert from "node:assert/strict";
import { packState, unpackState, stateChangeKey } from "./NetProtocol.ts";

const state = { x: 412.6, y: 280.2, f: 1, r: 0.12, a: 7, h: 183.4, k: 52.9, flags: 3, tl: 1, timestamp: 1700000000000 };

test("packed state round-trips the rendered fields", () => {
  const out = unpackState(packState(state))!;
  assert.deepEqual(out, { x: 413, y: 280, f: 1, r: 0.1, a: 7, h: 183, k: 53, flags: 3, tl: 1, timestamp: 1700000000000 });
});

test("packed state is much smaller than the legacy JSON object", () => {
  assert.ok(JSON.stringify(packState(state)).length < JSON.stringify(state).length * 0.6);
});

test("legacy object packets from older clients still decode", () => {
  assert.equal(unpackState({ ...state })!.x, 412.6);
});

test("malformed packets are rejected", () => {
  assert.equal(unpackState([1, 2, 3]), null);
  assert.equal(unpackState([1, 2, 3, 4, 5, 6, 7, 8, "x"]), null);
  assert.equal(unpackState("hello"), null);
  assert.equal(unpackState(null), null);
});

test("flip, hp, ki and transform changes are detected, not only movement", () => {
  const base = stateChangeKey(state);
  for (const change of [{ f: 0 }, { h: 170 }, { k: 60 }, { tl: 2 }, { r: 0.5 }]) {
    assert.notEqual(stateChangeKey({ ...state, ...change }), base);
  }
});
