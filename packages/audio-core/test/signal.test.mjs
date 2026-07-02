import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateRms,
  classifyOnsetFrame,
  detectEnergyOnset,
  estimateNoiseFloor
} from "../src/index.js";

test("does not trigger energy onset for silence", () => {
  const rms = calculateRms(new Float32Array(256));

  assert.equal(rms, 0);
  assert.equal(
    detectEnergyOnset({
      rms,
      previousRms: 0,
      noiseFloor: 0,
      thresholdRatio: 3,
      minRms: 0.01
    }),
    false
  );
});

test("does not trigger energy onset for noise-floor movement", () => {
  const noiseFloor = 0.01;

  assert.equal(
    detectEnergyOnset({
      rms: 0.012,
      previousRms: 0.011,
      noiseFloor,
      thresholdRatio: 3,
      minRms: 0.005
    }),
    false
  );
});

test("triggers energy onset for a sudden strum-like energy rise", () => {
  const frame = classifyOnsetFrame({
    rms: 0.12,
    previousRms: 0.011,
    noiseFloor: 0.01,
    thresholdRatio: 3,
    minRms: 0.005
  });

  assert.equal(frame.isOnset, true);
  assert.equal(frame.thresholdRms, 0.03);
  assert.equal(frame.energyRatio, 12);
});

test("estimates noise floor from a low percentile of RMS history", () => {
  const floor = estimateNoiseFloor([0.009, 0.011, 0.01, 0.1, 0.08], 0.2);

  assert.ok(floor >= 0.009);
  assert.ok(floor <= 0.011);
  assert.equal(estimateNoiseFloor([], 0.2), 0);
});
