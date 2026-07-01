import assert from "node:assert/strict";
import test from "node:test";
import { detectPitchMpm, detectPitchYin, generateSineWave } from "../src/index.js";

test("MPM detects a clean A4 sine wave", () => {
  const samples = generateSineWave({ frequencyHz: 440, durationSec: 0.12 });
  const result = detectPitchMpm(samples, 44100);
  assert.equal(result.noteName, "A4");
  assert.ok(Math.abs(result.frequencyHz - 440) < 1);
  assert.ok(result.confidence > 0.9);
});

test("YIN detects a clean C4 sine wave", () => {
  const samples = generateSineWave({ frequencyHz: 261.63, durationSec: 0.12 });
  const result = detectPitchYin(samples, 44100);
  assert.equal(result.noteName, "C4");
  assert.ok(Math.abs(result.frequencyHz - 261.63) < 2);
  assert.ok(result.confidence > 0.8);
});
