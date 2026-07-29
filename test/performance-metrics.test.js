import assert from "node:assert/strict";
import test from "node:test";
import { averageDuration, measureDuration, median, medianDuration } from "../src/performance-metrics.js";

test("median rejects missing or non-finite samples", () => {
  assert.throws(() => median([]), /finite numbers/);
  assert.throws(() => median([1, Number.NaN]), /finite numbers/);
});

test("median calculates odd and even sample sets without mutating input", () => {
  const samples = [9, 1, 5, 100, 3];
  assert.equal(median(samples), 5);
  assert.deepEqual(samples, [9, 1, 5, 100, 3]);
  assert.equal(median([8, 2, 4, 6]), 5);
});

test("duration helpers execute the requested work counts", async () => {
  let measured = 0;
  assert.ok(await measureDuration(async () => { measured += 1; }) >= 0);
  assert.equal(measured, 1);

  let averaged = 0;
  assert.ok(await averageDuration(async () => { averaged += 1; }, 3) >= 0);
  assert.equal(averaged, 3);

  let sampled = 0;
  assert.ok(await medianDuration(async () => { sampled += 1; }, { iterations: 3, warmups: 2 }) >= 0);
  assert.equal(sampled, 5);
});

test("duration helpers reject invalid sampling controls", async () => {
  await assert.rejects(averageDuration(async () => {}, 0), /positive integer/);
  await assert.rejects(medianDuration(async () => {}, { iterations: 0 }), /positive integer/);
  await assert.rejects(medianDuration(async () => {}, { warmups: -1 }), /non-negative integer/);
});
