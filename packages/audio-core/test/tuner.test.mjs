import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyTuning,
  createTunerFrameFromFrequency,
  matchTuningString,
  medianCents
} from "../src/index.js";
import { ukuleleInstrument } from "../../shared/src/index.js";

test("matches ukulele A string", () => {
  const tuning = ukuleleInstrument.tunings[0];
  const match = matchTuningString(440, tuning.strings);
  assert.equal(match.string.note, "A4");
  assert.equal(match.status, "in-tune");
});

test("classifies flat and sharp tuning states", () => {
  assert.equal(classifyTuning(-20), "flat");
  assert.equal(classifyTuning(18), "sharp");
  assert.equal(classifyTuning(4), "in-tune");
  assert.equal(classifyTuning(8), "in-tune");
  assert.equal(classifyTuning(-8), "in-tune");
  assert.equal(classifyTuning(10), "close");
  assert.equal(classifyTuning(-12), "close");
  assert.equal(classifyTuning(13), "sharp");
  assert.equal(classifyTuning(-13), "flat");
});

test("creates a tuner frame from a detected frequency", () => {
  const tuning = ukuleleInstrument.tunings[0];
  const frame = createTunerFrameFromFrequency(440, tuning.strings, {
    targetIndex: 3,
    source: "test"
  });

  assert.equal(frame.source, "test");
  assert.equal(frame.target.note, "A4");
  assert.equal(frame.matchedString.note, "A4");
  assert.equal(frame.detectedFrequencyHz, 440);
  assert.equal(Math.round(frame.cents), 0);
  assert.equal(frame.status, "in-tune");
});

test("uses selected target string when generating tuner frames", () => {
  const tuning = ukuleleInstrument.tunings[0];
  const frame = createTunerFrameFromFrequency(392, tuning.strings, {
    targetIndex: 0
  });

  assert.equal(frame.target.note, "G4");
  assert.equal(frame.status, "in-tune");
});

test("smooths jitter with median cents", () => {
  assert.equal(medianCents([6, -5, 4, 28, 5]), 5);
  assert.equal(medianCents([]), null);
});
