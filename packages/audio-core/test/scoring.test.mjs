import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateTimingOffsetMs,
  expectedBeatTimeMs,
  scoreRhythmEvent,
  summarizeRhythmEvents
} from "../src/index.js";

test("scores an on-time rhythm event", () => {
  const event = scoreRhythmEvent({
    eventTimeMs: 2000,
    startedAtMs: 1000,
    bpm: 120,
    beatIndex: 2
  });

  assert.equal(event.expectedTimeMs, 2000);
  assert.equal(event.timingOffsetMs, 0);
  assert.equal(event.rhythmScore, 100);
  assert.equal(event.timingStatus, "on-time");
});

test("scores an early rhythm event", () => {
  const event = scoreRhythmEvent({
    eventTimeMs: 1920,
    startedAtMs: 1000,
    bpm: 120,
    beatIndex: 2
  });

  assert.equal(event.timingOffsetMs, -80);
  assert.equal(event.rhythmScore, 83);
  assert.equal(event.timingStatus, "early");
});

test("scores a late rhythm event", () => {
  const event = scoreRhythmEvent({
    eventTimeMs: 2080,
    startedAtMs: 1000,
    bpm: 120,
    beatIndex: 2
  });

  assert.equal(event.timingOffsetMs, 80);
  assert.equal(event.rhythmScore, 83);
  assert.equal(event.timingStatus, "late");
});

test("calculates expected beat time at different BPM values", () => {
  assert.equal(
    expectedBeatTimeMs({ startedAtMs: 1000, bpm: 60, beatIndex: 3 }),
    4000
  );
  assert.equal(
    calculateTimingOffsetMs({
      eventTimeMs: 2750,
      startedAtMs: 1000,
      bpm: 120,
      beatIndex: 3
    }),
    250
  );
});

test("summarizes rhythm events", () => {
  const summary = summarizeRhythmEvents([
    { timingOffsetMs: 0, rhythmScore: 100, timingStatus: "on-time" },
    { timingOffsetMs: -80, rhythmScore: 83, timingStatus: "early" },
    { timingOffsetMs: 100, rhythmScore: 67, timingStatus: "late" }
  ]);

  assert.equal(summary.averageRhythmScore, 83);
  assert.equal(summary.onTimeCount, 1);
  assert.equal(summary.earlyCount, 1);
  assert.equal(summary.lateCount, 1);
  assert.match(summary.suggestion, /mixed/i);
});

test("summarizes empty rhythm events", () => {
  assert.deepEqual(summarizeRhythmEvents([]), {
    averageRhythmScore: 0,
    earlyCount: 0,
    lateCount: 0,
    onTimeCount: 0,
    suggestion: "Start practicing to build a rhythm baseline."
  });
});
