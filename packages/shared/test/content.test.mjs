import assert from "node:assert/strict";
import test from "node:test";
import {
  agentRoles,
  appendPracticeRecord,
  beginnerChords,
  chordLoopPractice,
  createPracticeSessionRecord,
  designTokens,
  getMvpPracticeTemplate,
  m0AgentTasks,
  mvpPracticeTemplates,
  practiceLoopModes,
  practiceRecordVersion,
  practiceTempoPresets,
  summarizePracticeRecord,
  ukuleleInstrument
} from "../src/index.js";

test("standard ukulele tuning has four strings", () => {
  assert.deepEqual(
    ukuleleInstrument.tunings[0].strings.map((string) => string.note),
    ["G4", "C4", "E4", "A4"]
  );
});

test("MVP chord loop uses beginner chords", () => {
  const chordNames = new Set(beginnerChords.map((chord) => chord.name));
  for (const target of chordLoopPractice.targets) {
    assert.ok(chordNames.has(target.chord));
  }
});

test("MVP practice template can be queried by id", () => {
  const template = getMvpPracticeTemplate("practice-c-am-f-g7-loop");

  assert.equal(template, mvpPracticeTemplates[0]);
  assert.equal(template.id, chordLoopPractice.id);
  assert.equal(template.bpm, chordLoopPractice.bpm);
});

test("practice tempo presets define slow standard and advanced bpm", () => {
  assert.deepEqual(
    practiceTempoPresets.map((preset) => [preset.id, preset.bpm]),
    [
      ["slow", 60],
      ["standard", 70],
      ["advanced", 85]
    ]
  );
});

test("practice loop modes include auto and single", () => {
  assert.deepEqual(
    practiceLoopModes.map((mode) => mode.id),
    ["auto", "single"]
  );
});

test("MVP practice targets reference beginner chord ids", () => {
  const chordIds = new Set(beginnerChords.map((chord) => chord.id));
  for (const template of mvpPracticeTemplates) {
    for (const target of template.targets) {
      assert.ok(chordIds.has(target.chordId));
    }
  }
});

test("M0 agent backlog has pending microphone integration", () => {
  assert.ok(agentRoles.some((role) => role.id === "audio-dsp"));
  assert.ok(m0AgentTasks.some((task) => task.id === "M0-004" && task.status === "pending"));
});

test("design tokens define accessible touch target minimum", () => {
  assert.equal(designTokens.component.touchTarget.minSize, 44);
});

test("practice session record handles empty events", () => {
  const record = createPracticeSessionRecord({
    exerciseId: chordLoopPractice.id,
    startedAt: "2026-07-01T00:00:00.000Z",
    endedAt: "2026-07-01T00:01:00.000Z",
    bpm: chordLoopPractice.bpm,
    loopMode: "loop",
    targets: chordLoopPractice.targets,
    events: []
  });

  assert.equal(record.version, practiceRecordVersion);
  assert.equal(record.exerciseId, chordLoopPractice.id);
  assert.equal(record.targets.length, chordLoopPractice.targets.length);
  assert.deepEqual(record.events, []);
  assert.deepEqual(summarizePracticeRecord(record), {
    durationSec: 60,
    barsPracticed: 0,
    completedCount: 0,
    completedTargetCount: 0,
    weakPoint: "C",
    suggestion: "Start with one slow loop and record each bar."
  });
});

test("practice summary counts bar and complete events", () => {
  const record = createPracticeSessionRecord({
    exerciseId: chordLoopPractice.id,
    startedAt: "2026-07-01T00:00:00.000Z",
    endedAt: "2026-07-01T00:01:30.000Z",
    bpm: 70,
    loopMode: "guided",
    targets: chordLoopPractice.targets,
    events: [
      { type: "bar", targetId: "bar-1", bar: 1, timeMs: 1000 },
      { type: "target_completed", targetId: "bar-1", bar: 1, score: 92 },
      { type: "complete", targetId: "bar-2", bar: 2, score: 84 }
    ]
  });

  const summary = summarizePracticeRecord(record);

  assert.equal(summary.durationSec, 90);
  assert.equal(summary.barsPracticed, 2);
  assert.equal(summary.completedCount, 2);
  assert.equal(summary.completedTargetCount, 2);
  assert.equal(summary.weakPoint, "F");
  assert.match(summary.suggestion, /F/);
});

test("practice record supports app-style step and timestamp events", () => {
  const startedAt = Date.parse("2026-07-01T00:00:00.000Z");
  const record = createPracticeSessionRecord({
    exerciseId: chordLoopPractice.id,
    bpm: 60,
    mode: "single",
    targets: chordLoopPractice.targets,
    events: [
      { type: "start", step: 1, chord: "Am", timestampMs: startedAt },
      { type: "bar", step: 1, chord: "Am", timestampMs: startedAt + 4000 },
      { type: "complete", step: 1, chord: "Am", timestampMs: startedAt + 8000 }
    ]
  });

  const summary = summarizePracticeRecord(record);

  assert.equal(record.loopMode, "single");
  assert.equal(record.startedAt, "2026-07-01T00:00:00.000Z");
  assert.equal(record.endedAt, "2026-07-01T00:00:08.000Z");
  assert.equal(summary.durationSec, 8);
  assert.equal(summary.barsPracticed, 1);
  assert.equal(summary.completedTargetCount, 1);
  assert.equal(summary.weakPoint, "C");
});

test("practice record does not persist raw audio payloads", () => {
  const record = createPracticeSessionRecord({
    exerciseId: chordLoopPractice.id,
    startedAt: "2026-07-01T00:00:00.000Z",
    endedAt: "2026-07-01T00:00:10.000Z",
    bpm: 70,
    loopMode: "guided",
    rawAudio: "root-audio",
    targets: [{ ...chordLoopPractice.targets[0], rawAudio: "target-audio" }],
    events: [
      {
        type: "bar_completed",
        targetId: "bar-1",
        bar: 1,
        score: 88,
        rawAudio: "event-audio",
        audioBuffer: [0, 1, 0],
        samples: new Float32Array([0.1, 0.2])
      }
    ]
  });

  const serialized = JSON.stringify(record);

  assert.equal(serialized.includes("rawAudio"), false);
  assert.equal(serialized.includes("audioBuffer"), false);
  assert.equal(serialized.includes("samples"), false);
  assert.equal(serialized.includes("event-audio"), false);
  assert.deepEqual(record.events[0], {
    type: "bar_completed",
    targetId: "bar-1",
    bar: 1,
    score: 88
  });
});

test("appendPracticeRecord keeps history immutable", () => {
  const history = [];
  const record = createPracticeSessionRecord({ exerciseId: chordLoopPractice.id });
  const nextHistory = appendPracticeRecord(history, record);

  assert.deepEqual(history, []);
  assert.deepEqual(nextHistory, [record]);
});
