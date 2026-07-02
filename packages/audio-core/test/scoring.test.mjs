import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateTimingOffsetMs,
  createRhythmEventFromTimestamp,
  expectedBeatTimeMs,
  findNearestBeatIndex,
  scoreRhythmEvent,
  scoreRhythmTimeline,
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

test("creates a rhythm event from the nearest beat", () => {
  assert.equal(
    findNearestBeatIndex({ eventTimeMs: 2240, startedAtMs: 1000, bpm: 120 }),
    2
  );

  const event = createRhythmEventFromTimestamp({
    eventTimeMs: 2240,
    startedAtMs: 1000,
    bpm: 120
  });

  assert.equal(event.beatIndex, 2);
  assert.equal(event.expectedTimeMs, 2000);
  assert.equal(event.timingOffsetMs, 240);
  assert.equal(event.timingStatus, "late");
});

test("creates a rhythm event with an explicit target beat index", () => {
  const event = createRhythmEventFromTimestamp({
    eventTimeMs: 1490,
    startedAtMs: 1000,
    bpm: 120,
    beatsPerBar: 3,
    targetBeatIndex: 0
  });

  assert.equal(event.beatIndex, 0);
  assert.equal(event.barIndex, 0);
  assert.equal(event.beatInBar, 0);
  assert.equal(event.expectedTimeMs, 1000);
  assert.equal(event.timingOffsetMs, 490);
  assert.equal(event.timingStatus, "late");
});

test("scores an empty rhythm timeline", () => {
  assert.deepEqual(scoreRhythmTimeline({ startedAtMs: 1000, bpm: 120, events: [] }), {
    scoredEvents: [],
    summary: {
      averageRhythmScore: 0,
      earlyCount: 0,
      lateCount: 0,
      onTimeCount: 0,
      suggestion: "Start practicing to build a rhythm baseline."
    }
  });
});

test("scores a mixed rhythm timeline", () => {
  const timeline = scoreRhythmTimeline({
    startedAtMs: 1000,
    bpm: 120,
    events: [
      { eventTimeMs: 1000 },
      { timeMs: 1420 },
      { eventTimeMs: 2080 }
    ]
  });

  assert.deepEqual(
    timeline.scoredEvents.map((event) => event.timingStatus),
    ["on-time", "early", "late"]
  );
  assert.deepEqual(
    timeline.scoredEvents.map((event) => event.beatIndex),
    [0, 1, 2]
  );
  assert.equal(timeline.summary.averageRhythmScore, 89);
  assert.equal(timeline.summary.onTimeCount, 1);
  assert.equal(timeline.summary.earlyCount, 1);
  assert.equal(timeline.summary.lateCount, 1);
});

test("scores rhythm timeline events with timestampMs", () => {
  const timeline = scoreRhythmTimeline({
    startedAtMs: 1000,
    bpm: 120,
    beatsPerBar: 4,
    events: [{ timestampMs: 2520 }]
  });

  assert.equal(timeline.scoredEvents[0].eventTimeMs, 2520);
  assert.equal(timeline.scoredEvents[0].beatIndex, 3);
  assert.equal(timeline.scoredEvents[0].barIndex, 0);
  assert.equal(timeline.scoredEvents[0].beatInBar, 3);
  assert.equal(timeline.scoredEvents[0].timingOffsetMs, 20);
  assert.equal(timeline.summary.onTimeCount, 1);
});
