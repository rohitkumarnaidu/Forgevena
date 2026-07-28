import { performance } from "node:perf_hooks";

export async function measureDuration(work) {
  const start = performance.now();
  await work();
  return Number((performance.now() - start).toFixed(2));
}

export async function averageDuration(work, iterations) {
  if (!Number.isInteger(iterations) || iterations < 1) throw new TypeError("iterations must be a positive integer");
  const start = performance.now();
  for (let index = 0; index < iterations; index += 1) await work();
  return Number(((performance.now() - start) / iterations).toFixed(2));
}

export async function medianDuration(work, { iterations = 5, warmups = 1 } = {}) {
  if (!Number.isInteger(iterations) || iterations < 1) throw new TypeError("iterations must be a positive integer");
  if (!Number.isInteger(warmups) || warmups < 0) throw new TypeError("warmups must be a non-negative integer");
  for (let index = 0; index < warmups; index += 1) await work();
  const samples = [];
  for (let index = 0; index < iterations; index += 1) samples.push(await measureDuration(work));
  return median(samples);
}

export function median(values) {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new TypeError("values must contain finite numbers");
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return Number(value.toFixed(2));
}
