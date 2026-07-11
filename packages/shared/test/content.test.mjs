import assert from "node:assert/strict";
import test from "node:test";
import {
  agentRoles,
  appendPracticeRecord,
  beginnerChords,
  chordLoopPractice,
  createNextPracticeRecommendation,
  createPracticeSessionRecord,
  designTokens,
  evaluateMvpLessonProgress,
  evaluatePracticeMilestone,
  formatPracticeDayKey,
  getBeginnerSongById,
  getContentModuleById,
  getMvpPracticeTemplate,
  getPracticeTemplatesByType,
  getRhythmPatternById,
  getSongFragmentById,
  m0AgentTasks,
  beginnerRhythmPatterns,
  beginnerSongFragments,
  chordTransitionExercises,
  mvpContentModules,
  mvpPracticeContent,
  mvpSkillPath,
  mvpPracticeTemplates,
  normalizePracticeHistory,
  practiceLoopModes,
  practiceRecordVersion,
  practiceTempoPresets,
  summarizePracticeHistory,
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

  assert.ok(template);
  assert.equal(template.id, chordLoopPractice.id);
  assert.equal(template.bpm, chordLoopPractice.bpm);
});

test("MVP content path includes rhythm transitions and song fragment", () => {
  assert.deepEqual(
    mvpSkillPath.map((step) => step.type),
    ["tool", "rhythm_pattern", "chord_transition", "chord_switch", "song_fragment", "report"]
  );
  assert.ok(beginnerRhythmPatterns.some((pattern) => pattern.id === "rhythm-down-four"));
  assert.ok(chordTransitionExercises.some((exercise) => exercise.id === "transition-c-am"));
  assert.ok(beginnerSongFragments.some((fragment) => fragment.id === "song-fragment-four-chord-hum"));
});

test("practice templates cover the real beginner practice ladder", () => {
  assert.equal(getPracticeTemplatesByType("rhythm_pattern").length, 1);
  assert.equal(getPracticeTemplatesByType("chord_transition").length, 1);
  assert.equal(getPracticeTemplatesByType("chord_switch").length, 1);
  assert.equal(getPracticeTemplatesByType("song_fragment").length, 1);
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

test("MVP content modules cover the current app tabs", () => {
  assert.deepEqual(
    mvpContentModules.map((module) => module.tab),
    ["home", "learn", "practice", "songs", "me"]
  );
  assert.equal(getContentModuleById("practice").practiceTemplateIds.length, mvpPracticeTemplates.length);
  assert.equal(getContentModuleById("songs").songIds.length, mvpPracticeContent.songs.length);
});

test("MVP shared content links songs fragments rhythms and templates", () => {
  const song = getBeginnerSongById("song-four-chord-hum");
  assert.ok(song);
  assert.equal(song.access, "free");
  assert.deepEqual(song.chordNames, ["C", "Am", "F", "G7"]);
  assert.equal(song.practiceLines.length, 4);
  assert.deepEqual(
    song.practiceLines.map((line) => line.chord),
    song.chordNames
  );

  for (const rhythmPatternId of song.rhythmPatternIds) {
    assert.ok(getRhythmPatternById(rhythmPatternId));
  }
  for (const fragmentId of song.songFragmentIds) {
    const fragment = getSongFragmentById(fragmentId);
    assert.ok(fragment);
    assert.ok(getRhythmPatternById(fragment.rhythmPatternId));
  }
  for (const templateId of song.practiceTemplateIds) {
    assert.ok(getMvpPracticeTemplate(templateId));
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

test("practice history normalizes valid records by latest ended or created time", () => {
  const oldest = { id: "oldest", endedAt: "2026-07-01T10:00:00.000Z" };
  const newestByEnded = { id: "newest-ended", endedAt: "2026-07-03T10:00:00.000Z" };
  const middleByCreated = { id: "middle-created", createdAt: "2026-07-02T10:00:00.000Z" };
  const invalid = { id: "invalid", endedAt: "not-a-date" };

  assert.deepEqual(
    normalizePracticeHistory([oldest, invalid, newestByEnded, middleByCreated]).map((record) => record.id),
    ["newest-ended", "middle-created", "oldest"]
  );
});

test("practice history limits to twenty records by default", () => {
  const history = Array.from({ length: 25 }, (_, index) => ({
    id: `record-${index}`,
    endedAt: new Date(Date.UTC(2026, 6, index + 1, 10, 0, 0)).toISOString()
  }));

  const normalized = normalizePracticeHistory(history);

  assert.equal(normalized.length, 20);
  assert.equal(normalized[0].id, "record-24");
  assert.equal(normalized.at(-1).id, "record-5");
});

test("practice history summary handles empty history", () => {
  assert.deepEqual(summarizePracticeHistory([]), {
    totalSessions: 0,
    totalDurationSec: 0,
    totalCompletedCount: 0,
    latestRecord: null,
    practiceDays: 0,
    practiceDayKeys: [],
    currentStreakDays: 0
  });
});

test("practice history summary counts current streak across days", () => {
  const history = [
    { id: "day-1", endedAt: "2026-07-01T09:00:00.000Z", durationSec: 20, completedCount: 1 },
    { id: "day-3-a", endedAt: "2026-07-03T09:00:00.000Z", durationSec: 30, completedCount: 1 },
    { id: "day-3-b", endedAt: "2026-07-03T12:00:00.000Z", durationSec: 40, completedCount: 2 },
    { id: "day-4", endedAt: "2026-07-04T09:00:00.000Z", durationSec: 50, completedCount: 3 },
    { id: "day-5", endedAt: "2026-07-05T09:00:00.000Z", durationSec: 60, completedCount: 4 }
  ];

  const summary = summarizePracticeHistory(history, "2026-07-05T18:00:00.000Z");

  assert.equal(summary.currentStreakDays, 3);
  assert.equal(summary.practiceDays, 4);
  assert.deepEqual(summary.practiceDayKeys, ["2026-07-05", "2026-07-04", "2026-07-03", "2026-07-01"]);
  assert.equal(summary.latestRecord.id, "day-5");
});

test("practice history summary totals app and preview record fields", () => {
  const sharedRecord = createPracticeSessionRecord({
    exerciseId: chordLoopPractice.id,
    startedAt: "2026-07-03T10:00:00.000Z",
    endedAt: "2026-07-03T10:01:00.000Z",
    targets: chordLoopPractice.targets,
    events: [
      { type: "complete", targetId: "bar-1" },
      { type: "target_completed", targetId: "bar-2" }
    ]
  });
  const appRecord = {
    id: "app-record",
    endedAt: "2026-07-04T10:00:00.000Z",
    durationSec: 45,
    completedCount: 3
  };
  const previewRecord = {
    id: "preview-record",
    endedAt: "2026-07-05T10:00:00.000Z",
    duration: 15,
    completedCount: 1
  };

  const summary = summarizePracticeHistory([sharedRecord, appRecord, previewRecord]);

  assert.equal(summary.totalSessions, 3);
  assert.equal(summary.totalDurationSec, 120);
  assert.equal(summary.totalCompletedCount, 6);
  assert.equal(summary.latestRecord, previewRecord);
});

test("practice day key formats date-like input", () => {
  assert.equal(formatPracticeDayKey("2026-07-05T10:30:00.000Z"), "2026-07-05");
  assert.equal(formatPracticeDayKey("not-a-date"), null);
});

test("practice milestone is not started without history", () => {
  assert.deepEqual(evaluatePracticeMilestone([]), {
    status: "not_started",
    title: "Lesson not started",
    detail: "No practice history yet.",
    completedLoops: 0,
    bestRhythmScore: null,
    requiredRhythmScore: 70,
    requiredCompletedCount: 4,
    canPass: false
  });
});

test("practice milestone stays in progress before all targets are complete", () => {
  const record = createPracticeSessionRecord({
    exerciseId: chordLoopPractice.id,
    endedAt: "2026-07-05T10:00:00.000Z",
    targets: chordLoopPractice.targets,
    events: [
      { type: "target_completed", targetId: "bar-1", rhythmScore: 80 },
      { type: "target_completed", targetId: "bar-2", rhythmScore: 82 }
    ]
  });

  const milestone = evaluatePracticeMilestone([record]);

  assert.equal(milestone.status, "in_progress");
  assert.equal(milestone.completedLoops, 0);
  assert.equal(milestone.bestRhythmScore, 81);
  assert.equal(milestone.canPass, false);
});

test("practice milestone stays in progress when rhythm is below passing score", () => {
  const milestone = evaluatePracticeMilestone([
    {
      endedAt: "2026-07-05T10:00:00.000Z",
      totalSteps: 4,
      completedCount: 4,
      rhythmSummary: { averageRhythmScore: 62 }
    }
  ]);

  assert.equal(milestone.status, "in_progress");
  assert.equal(milestone.completedLoops, 1);
  assert.equal(milestone.bestRhythmScore, 62);
  assert.match(milestone.detail, /below 70/);
  assert.equal(milestone.canPass, false);
});

test("practice milestone is ready to pass after complete loop reaches passing score", () => {
  const milestone = evaluatePracticeMilestone([
    {
      endedAt: "2026-07-05T10:00:00.000Z",
      totalSteps: 4,
      completedCount: 4,
      rhythmScore: 72
    }
  ]);

  assert.equal(milestone.status, "ready_to_pass");
  assert.equal(milestone.completedLoops, 1);
  assert.equal(milestone.bestRhythmScore, 72);
  assert.equal(milestone.canPass, true);
});

test("practice milestone is passed when a record is explicitly passed", () => {
  const milestone = evaluatePracticeMilestone([
    {
      endedAt: "2026-07-05T10:00:00.000Z",
      completedCount: 1,
      totalSteps: 4,
      rhythmScore: 45,
      status: "passed"
    }
  ]);

  assert.equal(milestone.status, "passed");
  assert.equal(milestone.completedLoops, 0);
  assert.equal(milestone.bestRhythmScore, 45);
  assert.equal(milestone.canPass, true);
});

test("MVP lesson progress starts at tuning without history", () => {
  const progress = evaluateMvpLessonProgress([]);

  assert.equal(progress.percent, 0);
  assert.equal(progress.completedNodes, 0);
  assert.equal(progress.nextNodeId, "tuning");
  assert.deepEqual(
    progress.nodes.map((node) => [node.id, node.status]),
    [
      ["tuning", "current"],
      ["practice", "locked"],
      ["review", "locked"]
    ]
  );
});

test("MVP lesson progress moves to practice after tuning is complete", () => {
  const progress = evaluateMvpLessonProgress([], { completedStrings: 4 });

  assert.equal(progress.percent, 33);
  assert.equal(progress.nextNodeId, "practice");
  assert.deepEqual(
    progress.nodes.map((node) => [node.id, node.status]),
    [
      ["tuning", "done"],
      ["practice", "current"],
      ["review", "locked"]
    ]
  );
});

test("MVP lesson progress keeps review locked during unfinished practice", () => {
  const progress = evaluateMvpLessonProgress([
    {
      endedAt: "2026-07-05T10:00:00.000Z",
      totalSteps: 4,
      completedCount: 2,
      rhythmScore: 82
    }
  ]);

  assert.equal(progress.percent, 33);
  assert.equal(progress.nextNodeId, "practice");
  assert.deepEqual(
    progress.nodes.map((node) => [node.id, node.status]),
    [
      ["tuning", "done"],
      ["practice", "current"],
      ["review", "locked"]
    ]
  );
});

test("MVP lesson progress opens review after a complete loop below passing score", () => {
  const progress = evaluateMvpLessonProgress([
    {
      endedAt: "2026-07-05T10:00:00.000Z",
      totalSteps: 4,
      completedCount: 4,
      rhythmScore: 62
    }
  ]);

  assert.equal(progress.percent, 67);
  assert.equal(progress.nextNodeId, "review");
  assert.deepEqual(
    progress.nodes.map((node) => [node.id, node.status]),
    [
      ["tuning", "done"],
      ["practice", "done"],
      ["review", "current"]
    ]
  );
});

test("MVP lesson progress opens review after passing practice target", () => {
  const progress = evaluateMvpLessonProgress([
    {
      endedAt: "2026-07-05T10:00:00.000Z",
      totalSteps: 4,
      completedCount: 4,
      rhythmScore: 72
    }
  ]);

  assert.equal(progress.percent, 67);
  assert.equal(progress.nextNodeId, "review");
  assert.deepEqual(
    progress.nodes.map((node) => [node.id, node.status]),
    [
      ["tuning", "done"],
      ["practice", "done"],
      ["review", "current"]
    ]
  );
});

test("MVP lesson progress is complete after lesson is passed", () => {
  const progress = evaluateMvpLessonProgress([
    {
      endedAt: "2026-07-05T10:00:00.000Z",
      status: "passed",
      completedCount: 4,
      totalSteps: 4,
      rhythmScore: 80
    }
  ]);

  assert.equal(progress.percent, 100);
  assert.equal(progress.nextNodeId, null);
  assert.deepEqual(
    progress.nodes.map((node) => [node.id, node.status]),
    [
      ["tuning", "done"],
      ["practice", "done"],
      ["review", "done"]
    ]
  );
});

test("next practice recommendation starts empty history with slow auto loop", () => {
  assert.deepEqual(createNextPracticeRecommendation([]), {
    title: "Start slow loop",
    detail: "Practice C-Am-F-G7 at 60 BPM with automatic looping.",
    bpm: 60,
    tempoId: "slow",
    loopMode: "auto",
    focusChord: null,
    reason: "No practice history yet."
  });
});

test("next practice recommendation slows down for low rhythm score", () => {
  const recommendation = createNextPracticeRecommendation([
    {
      endedAt: "2026-07-05T10:00:00.000Z",
      bpm: 70,
      mode: "auto",
      totalSteps: 4,
      completedCount: 4,
      rhythmScore: 62,
      chords: ["F"]
    }
  ]);

  assert.equal(recommendation.bpm, 60);
  assert.equal(recommendation.tempoId, "slow");
  assert.equal(recommendation.loopMode, "single");
  assert.equal(recommendation.focusChord, "F");
  assert.match(recommendation.reason, /62/);
});

test("next practice recommendation raises tempo after complete high score", () => {
  const recommendation = createNextPracticeRecommendation([
    {
      endedAt: "2026-07-05T10:00:00.000Z",
      bpm: 70,
      mode: "auto",
      totalSteps: 4,
      completedCount: 4,
      rhythmSummary: { averageRhythmScore: 90 }
    }
  ]);

  assert.deepEqual(recommendation, {
    title: "Raise the tempo",
    detail: "Practice C-Am-F-G7 at 85 BPM with automatic looping.",
    bpm: 85,
    tempoId: "advanced",
    loopMode: "auto",
    focusChord: null,
    reason: "Latest practice was complete with rhythm score 90."
  });
});

test("next practice recommendation keeps single mode on unfinished weak chord", () => {
  const recommendation = createNextPracticeRecommendation([
    {
      endedAt: "2026-07-05T10:00:00.000Z",
      bpm: 70,
      mode: "single",
      totalSteps: 4,
      completedCount: 0,
      rhythmSummary: { averageRhythmScore: 80 },
      events: [{ type: "bar", step: 2, chord: "F" }]
    }
  ]);

  assert.equal(recommendation.title, "Slow focus: F");
  assert.equal(recommendation.bpm, 60);
  assert.equal(recommendation.tempoId, "slow");
  assert.equal(recommendation.loopMode, "single");
  assert.equal(recommendation.focusChord, "F");
  assert.equal(recommendation.reason, "Latest single-mode practice was not complete.");
});
