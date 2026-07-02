import { midiToFrequency, noteNameToMidi } from "../../audio-core/src/index.js";
export * from "./agents.js";
export * from "./design-tokens.js";

export const ukuleleInstrument = {
  id: "ukulele",
  name: "尤克里里",
  pitchRangeHz: [70, 1200],
  tunings: [
    {
      id: "standard-gcea",
      name: "标准 G-C-E-A",
      strings: ["G4", "C4", "E4", "A4"].map((note, index) => {
        const midi = noteNameToMidi(note);
        return {
          index: index + 1,
          name: ["4弦", "3弦", "2弦", "1弦"][index],
          note,
          midi,
          frequencyHz: Number(midiToFrequency(midi).toFixed(2))
        };
      })
    }
  ]
};

export const beginnerChords = [
  {
    id: "uke-c",
    instrumentId: "ukulele",
    name: "C",
    fingering: [0, 0, 0, 3],
    fingers: [0, 0, 0, 3],
    difficulty: 1,
    tags: ["open", "beginner"]
  },
  {
    id: "uke-am",
    instrumentId: "ukulele",
    name: "Am",
    fingering: [2, 0, 0, 0],
    fingers: [2, 0, 0, 0],
    difficulty: 1,
    tags: ["open", "beginner"]
  },
  {
    id: "uke-f",
    instrumentId: "ukulele",
    name: "F",
    fingering: [2, 0, 1, 0],
    fingers: [2, 0, 1, 0],
    difficulty: 2,
    tags: ["beginner", "change-practice"]
  },
  {
    id: "uke-g7",
    instrumentId: "ukulele",
    name: "G7",
    fingering: [0, 2, 1, 2],
    fingers: [0, 2, 1, 3],
    difficulty: 2,
    tags: ["beginner", "song-common"]
  }
];

export const mvpLesson = {
  id: "lesson-tune-and-c-am-f-g7",
  title: "第一课：调音与 C-Am-F-G7 循环",
  instrument: "ukulele",
  level: "P0",
  estimatedMinutes: 8,
  nodes: [
    {
      id: "intro",
      type: "briefing",
      title: "准备练习",
      body: "先完成 G-C-E-A 标准调音，再用 70 BPM 练 C、Am、F、G7 四和弦循环。"
    },
    {
      id: "tuning",
      type: "tool",
      tool: "tuner",
      title: "标准调音"
    },
    {
      id: "chord-loop",
      type: "practice",
      practiceTemplateId: "practice-c-am-f-g7-loop",
      title: "四和弦循环"
    }
  ]
};

const chordLoopTargets = [
  { id: "bar-1", bar: 1, beat: 1, chord: "C", chordId: "uke-c", primaryNote: "C4" },
  { id: "bar-2", bar: 2, beat: 1, chord: "Am", chordId: "uke-am", primaryNote: "A4" },
  { id: "bar-3", bar: 3, beat: 1, chord: "F", chordId: "uke-f", primaryNote: "F4" },
  { id: "bar-4", bar: 4, beat: 1, chord: "G7", chordId: "uke-g7", primaryNote: "G4" }
];

export const practiceTempoPresets = [
  { id: "slow", label: "Slow", bpm: 60 },
  { id: "standard", label: "Standard", bpm: 70 },
  { id: "advanced", label: "Advanced", bpm: 85 }
];

export const practiceLoopModes = [
  {
    id: "auto",
    label: "Auto",
    description: "Advance through each chord in the loop."
  },
  {
    id: "single",
    label: "Single",
    description: "Repeat one selected chord until the player is ready."
  }
];

export const mvpPracticeTemplates = [
  {
    id: "practice-c-am-f-g7-loop",
    type: "chord_switch",
    instrument: "ukulele",
    bpm: 70,
    timeSignature: "4/4",
    passingScore: 70,
    targets: chordLoopTargets,
    tempoPresets: practiceTempoPresets,
    loopModes: practiceLoopModes,
    display: {
      title: "C-Am-F-G7 Chord Loop",
      subtitle: "Four-bar beginner chord switching practice.",
      targetLabel: "Chord targets"
    },
    action: {
      primaryLabel: "Start loop",
      secondaryLabel: "Practice one chord",
      completionLabel: "Finish practice"
    }
  }
];

export const chordLoopExercise = mvpPracticeTemplates[0];

export const getMvpPracticeTemplate = (id) =>
  mvpPracticeTemplates.find((template) => template.id === id) ?? null;

export const getPracticeTemplateById = getMvpPracticeTemplate;

export const chordLoopPractice = {
  id: "practice-c-am-f-g7-loop",
  type: chordLoopExercise.type,
  instrument: chordLoopExercise.instrument,
  bpm: chordLoopExercise.bpm,
  timeSignature: chordLoopExercise.timeSignature,
  passingScore: chordLoopExercise.passingScore,
  targets: chordLoopExercise.targets,
  tempoPresets: chordLoopExercise.tempoPresets,
  loopModes: chordLoopExercise.loopModes,
  display: chordLoopExercise.display,
  action: chordLoopExercise.action
};

export const practiceRecordVersion = 1;

const copyIfPresent = (source, target, key) => {
  const value = source?.[key];
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    target[key] = value;
  }
};

const sanitizePracticeTarget = (target) => {
  const cleanTarget = {};
  for (const key of ["id", "bar", "beat", "chord", "primaryNote"]) {
    copyIfPresent(target, cleanTarget, key);
  }
  return cleanTarget;
};

const sanitizePracticeEvent = (event) => {
  const cleanEvent = {
    type: typeof event?.type === "string" ? event.type : "unknown"
  };
  for (const key of [
    "step",
    "targetId",
    "bar",
    "beat",
    "chord",
    "bpm",
    "loopMode",
    "at",
    "timestamp",
    "timestampMs",
    "timeMs",
    "offsetMs",
    "status",
    "rhythmScore",
    "averageRhythmScore",
    "rhythmAccuracy",
    "score",
    "accuracy"
  ]) {
    copyIfPresent(event, cleanEvent, key);
  }
  return cleanEvent;
};

const isCompletedPracticeEvent = (event) => {
  const type = String(event?.type ?? "").toLowerCase();
  return (
    type === "complete" ||
    type === "completed" ||
    type.endsWith("_complete") ||
    type.endsWith("_completed")
  );
};

const toTimeMs = (value) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  const timeMs = new Date(value).getTime();
  return Number.isFinite(timeMs) ? timeMs : null;
};

const eventTimeMs = (event) => {
  for (const key of ["timestampMs", "timeMs", "timestamp", "at"]) {
    const value = event?.[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    const parsed = toTimeMs(value);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
};

const practiceRecordTimeMs = (record) => {
  for (const key of ["endedAt", "createdAt", "startedAt"]) {
    const parsed = toTimeMs(record?.[key]);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
};

export const createPracticeSessionRecord = ({
  exerciseId,
  startedAt,
  endedAt,
  bpm,
  mode,
  loopMode = "guided",
  targets = [],
  events = [],
  createdAt
} = {}) => {
  const cleanEvents = Array.isArray(events) ? events.map(sanitizePracticeEvent) : [];
  const eventTimes = cleanEvents.map(eventTimeMs).filter((value) => value !== null);
  const inferredStartedAt =
    startedAt ?? (eventTimes.length > 0 ? new Date(Math.min(...eventTimes)).toISOString() : undefined);
  const inferredEndedAt =
    endedAt ?? (eventTimes.length > 0 ? new Date(Math.max(...eventTimes)).toISOString() : inferredStartedAt);

  return {
    version: practiceRecordVersion,
    exerciseId,
    startedAt: inferredStartedAt,
    endedAt: inferredEndedAt,
    createdAt: createdAt ?? inferredEndedAt ?? inferredStartedAt,
    bpm,
    loopMode: mode ?? loopMode,
    targets: Array.isArray(targets) ? targets.map(sanitizePracticeTarget) : [],
    events: cleanEvents
  };
};

export const summarizePracticeRecord = (record = {}) => {
  const startedMs = toTimeMs(record.startedAt);
  const endedMs = toTimeMs(record.endedAt);
  const durationSec =
    startedMs === null || endedMs === null ? 0 : Math.max(0, Math.round((endedMs - startedMs) / 1000));
  const targetById = new Map((record.targets ?? []).map((target) => [target.id, target]));
  const targetByStep = new Map((record.targets ?? []).map((target, index) => [index, target]));
  const practicedBars = new Set();
  const completedTargetIds = new Set();
  let completedCount = 0;

  for (const event of record.events ?? []) {
    const target = targetById.get(event.targetId) ?? targetByStep.get(event.step);
    const bar = event.bar ?? target?.bar;
    if (typeof bar === "number") {
      practicedBars.add(bar);
    }
    if (isCompletedPracticeEvent(event)) {
      completedCount += 1;
      if (event.targetId || target?.id) {
        completedTargetIds.add(event.targetId ?? target.id);
      }
    }
  }

  const missingTarget = (record.targets ?? []).find((target) => !completedTargetIds.has(target.id));
  const weakPoint = missingTarget?.chord ?? missingTarget?.id ?? null;
  const suggestion =
    (record.events ?? []).length === 0
      ? "Start with one slow loop and record each bar."
      : weakPoint
        ? `Focus on ${weakPoint} at a slower tempo before the next loop.`
        : "All targets were completed; repeat once or raise the tempo slightly.";

  return {
    durationSec,
    barsPracticed: practicedBars.size,
    completedCount,
    completedTargetCount: completedTargetIds.size,
    weakPoint,
    suggestion
  };
};

export const appendPracticeRecord = (history = [], record) => [...history, record];

export const formatPracticeDayKey = (value) => {
  const timeMs = toTimeMs(value);
  return timeMs === null ? null : new Date(timeMs).toISOString().slice(0, 10);
};

export const normalizePracticeHistory = (history = [], limit = 20) => {
  if (!Array.isArray(history)) {
    return [];
  }

  const normalizedLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 20;

  return history
    .map((record, index) => ({
      record,
      index,
      timeMs: typeof record === "object" && record !== null ? practiceRecordTimeMs(record) : null
    }))
    .filter((entry) => entry.timeMs !== null)
    .sort((left, right) => right.timeMs - left.timeMs || left.index - right.index)
    .slice(0, normalizedLimit)
    .map((entry) => entry.record);
};

const practiceRecordDurationSec = (record) => {
  for (const key of ["durationSec", "duration"]) {
    const value = record?.[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.round(value));
    }
  }
  return summarizePracticeRecord(record).durationSec;
};

const practiceRecordCompletedCount = (record) => {
  for (const key of ["completedCount", "completedTargetCount"]) {
    const value = record?.[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.round(value));
    }
  }
  return summarizePracticeRecord(record).completedCount;
};

const shiftPracticeDayKey = (dayKey, deltaDays) => {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
};

export const summarizePracticeHistory = (history = [], currentDate) => {
  const records = normalizePracticeHistory(history, Array.isArray(history) ? history.length : 0);
  const totalDurationSec = records.reduce((total, record) => total + practiceRecordDurationSec(record), 0);
  const totalCompletedCount = records.reduce((total, record) => total + practiceRecordCompletedCount(record), 0);
  const practiceDayKeys = [
    ...new Set(
      records
        .map((record) => formatPracticeDayKey(practiceRecordTimeMs(record)))
        .filter((dayKey) => dayKey !== null)
    )
  ].sort((left, right) => right.localeCompare(left));
  const practiceDaySet = new Set(practiceDayKeys);
  const anchorDayKey =
    currentDate === undefined ? practiceDayKeys[0] ?? null : formatPracticeDayKey(currentDate);
  let currentStreakDays = 0;

  if (anchorDayKey !== null) {
    for (
      let dayKey = anchorDayKey;
      practiceDaySet.has(dayKey);
      dayKey = shiftPracticeDayKey(dayKey, -1)
    ) {
      currentStreakDays += 1;
    }
  }

  return {
    totalSessions: records.length,
    totalDurationSec,
    totalCompletedCount,
    latestRecord: records[0] ?? null,
    practiceDays: practiceDayKeys.length,
    practiceDayKeys,
    currentStreakDays
  };
};

const numberOrNull = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);

const averageNumbers = (values) => {
  const numbers = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  return numbers.length === 0
    ? null
    : Math.round(numbers.reduce((total, value) => total + value, 0) / numbers.length);
};

const practiceTargetsForTemplate = (template) =>
  Array.isArray(template?.targets) && template.targets.length > 0 ? template.targets : chordLoopPractice.targets;

const practiceTempoPresetForId = (template, id, fallbackBpm) =>
  (template?.tempoPresets ?? practiceTempoPresets).find((preset) => preset.id === id) ?? {
    id,
    bpm: fallbackBpm
  };

const practiceTargetLabel = (template) =>
  practiceTargetsForTemplate(template)
    .map((target) => target.chord)
    .filter((chord) => typeof chord === "string" && chord.length > 0)
    .join("-");

const practiceRecordTargetCount = (record, template) => {
  const totalSteps = numberOrNull(record?.totalSteps);
  if (totalSteps !== null) {
    return Math.max(0, Math.round(totalSteps));
  }
  if (Array.isArray(record?.targets) && record.targets.length > 0) {
    return record.targets.length;
  }
  return practiceTargetsForTemplate(template).length;
};

const practiceRecordRhythmScore = (record) => {
  for (const value of [
    record?.rhythmScore,
    record?.averageRhythmScore,
    record?.rhythmAccuracy,
    record?.rhythmSummary?.averageRhythmScore,
    record?.score?.rhythmScore,
    record?.score?.rhythmAccuracy
  ]) {
    const score = numberOrNull(value);
    if (score !== null) {
      return Math.round(score);
    }
  }

  return averageNumbers((record?.events ?? []).map((event) => event?.rhythmScore));
};

const chordFromPracticeStep = (record, template) => {
  const targets = practiceTargetsForTemplate(template);
  const explicitStep = numberOrNull(record?.practiceStep);
  if (explicitStep !== null && targets[explicitStep]?.chord) {
    return targets[explicitStep].chord;
  }

  const events = Array.isArray(record?.events) ? record.events : [];
  for (const event of [...events].reverse()) {
    if (typeof event?.chord === "string" && event.chord.length > 0) {
      return event.chord;
    }
    const step = numberOrNull(event?.step);
    if (step !== null && targets[step]?.chord) {
      return targets[step].chord;
    }
  }

  return null;
};

const practiceRecordCurrentChord = (record, template) => {
  for (const value of [record?.focusChord, record?.currentChord, record?.activeChord]) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  if (Array.isArray(record?.chords) && typeof record.chords[0] === "string") {
    return record.chords[0];
  }
  return chordFromPracticeStep(record, template);
};

const practiceRecordWeakPoint = (record, template) => {
  if (typeof record?.weakPoint === "string" && record.weakPoint.length > 0) {
    return record.weakPoint;
  }

  const mode = record?.mode ?? record?.loopMode;
  const currentChord = practiceRecordCurrentChord(record, template);
  if (mode === "single" && currentChord !== null) {
    return currentChord;
  }

  if (Array.isArray(record?.completedSteps)) {
    const targets = practiceTargetsForTemplate(template);
    const missingIndex = record.completedSteps.findIndex((isComplete) => !isComplete);
    if (missingIndex >= 0) {
      return targets[missingIndex]?.chord ?? currentChord;
    }
  }

  return summarizePracticeRecord(record).weakPoint ?? currentChord;
};

const makePracticeRecommendation = ({ title, detail, bpm, tempoId, loopMode, focusChord, reason }) => ({
  title,
  detail,
  bpm,
  tempoId,
  loopMode,
  focusChord,
  reason
});

export const createNextPracticeRecommendation = (history = [], options = {}) => {
  const template = options.template ?? chordLoopPractice;
  const targetsLabel = practiceTargetLabel(template);
  const slowPreset = practiceTempoPresetForId(template, "slow", 60);
  const standardPreset = practiceTempoPresetForId(template, "standard", 70);
  const advancedPreset = practiceTempoPresetForId(template, "advanced", 85);
  const rawHistory = Array.isArray(history) ? history.filter((record) => record && typeof record === "object") : [];
  const normalizedHistory = normalizePracticeHistory(rawHistory, rawHistory.length);
  const records = normalizedHistory.length > 0 ? normalizedHistory : rawHistory;
  const latestRecord = records[0] ?? null;

  if (latestRecord === null) {
    return makePracticeRecommendation({
      title: "Start slow loop",
      detail: `Practice ${targetsLabel} at ${slowPreset.bpm} BPM with automatic looping.`,
      bpm: slowPreset.bpm,
      tempoId: slowPreset.id,
      loopMode: "auto",
      focusChord: null,
      reason: "No practice history yet."
    });
  }

  const rhythmScore = practiceRecordRhythmScore(latestRecord);
  const completedCount = practiceRecordCompletedCount(latestRecord);
  const targetCount = practiceRecordTargetCount(latestRecord, template);
  const completedAll = targetCount > 0 && completedCount >= targetCount;
  const latestBpm = numberOrNull(latestRecord.bpm) ?? standardPreset.bpm;
  const weakPoint = practiceRecordWeakPoint(latestRecord, template);
  const latestMode = latestRecord.mode ?? latestRecord.loopMode ?? "auto";
  const needsSlowFocus = (rhythmScore !== null && rhythmScore < 70) || !completedAll;

  if (needsSlowFocus) {
    const focusChord = weakPoint ?? practiceRecordCurrentChord(latestRecord, template);
    return makePracticeRecommendation({
      title: focusChord ? `Slow focus: ${focusChord}` : "Slow steady loop",
      detail: focusChord
        ? `Practice only ${focusChord} at ${slowPreset.bpm} BPM before returning to the full loop.`
        : `Practice ${targetsLabel} at ${slowPreset.bpm} BPM with automatic looping.`,
      bpm: slowPreset.bpm,
      tempoId: slowPreset.id,
      loopMode: focusChord ? "single" : "auto",
      focusChord,
      reason:
        rhythmScore !== null && rhythmScore < 70
          ? `Latest rhythm score was ${rhythmScore}, below the 70 passing target.`
          : latestMode === "single"
            ? "Latest single-mode practice was not complete."
            : `Latest practice completed ${completedCount}/${targetCount} targets.`
    });
  }

  if (rhythmScore !== null && rhythmScore >= 85 && completedAll) {
    const nextBpm =
      latestBpm >= advancedPreset.bpm ? Math.min(240, Math.round(latestBpm + 5)) : advancedPreset.bpm;
    return makePracticeRecommendation({
      title: "Raise the tempo",
      detail: `Practice ${targetsLabel} at ${nextBpm} BPM with automatic looping.`,
      bpm: nextBpm,
      tempoId: nextBpm === advancedPreset.bpm ? advancedPreset.id : "custom",
      loopMode: "auto",
      focusChord: null,
      reason: `Latest practice was complete with rhythm score ${rhythmScore}.`
    });
  }

  return makePracticeRecommendation({
    title: "Keep standard loop",
    detail: `Practice ${targetsLabel} at ${standardPreset.bpm} BPM with automatic looping.`,
    bpm: standardPreset.bpm,
    tempoId: standardPreset.id,
    loopMode: "auto",
    focusChord: null,
    reason: "Latest practice is stable enough to continue, but not ready for a tempo increase."
  });
};

const practiceRecordHasPassedStatus = (record) => {
  if (record?.passed === true || record?.result?.passed === true) {
    return true;
  }

  return [record?.status, record?.result, record?.result?.status]
    .filter((value) => typeof value === "string")
    .some((value) => value.toLowerCase() === "passed");
};

const milestoneCompletedCountForRecord = (record) => {
  const completedTargetCount = numberOrNull(record?.completedTargetCount);
  if (completedTargetCount !== null) {
    return Math.max(0, Math.round(completedTargetCount));
  }
  return practiceRecordCompletedCount(record);
};

const makePracticeMilestoneResult = ({
  status,
  title,
  detail,
  completedLoops,
  bestRhythmScore,
  requiredRhythmScore,
  requiredCompletedCount
}) => ({
  status,
  title,
  detail,
  completedLoops,
  bestRhythmScore,
  requiredRhythmScore,
  requiredCompletedCount,
  canPass: status === "ready_to_pass" || status === "passed"
});

export const evaluatePracticeMilestone = (history = [], options = {}) => {
  const template = options.template ?? chordLoopPractice;
  const requiredRhythmScore =
    numberOrNull(options.passingScore) ??
    numberOrNull(template?.passingScore) ??
    chordLoopPractice.passingScore;
  const requiredCompletedCount =
    numberOrNull(options.requiredCompletedCount) ?? practiceTargetsForTemplate(template).length;
  const rawHistory = Array.isArray(history) ? history.filter((record) => record && typeof record === "object") : [];
  const normalizedHistory = normalizePracticeHistory(rawHistory, rawHistory.length);
  const records = normalizedHistory.length > 0 ? normalizedHistory : rawHistory;
  const recordSummaries = records.map((record) => {
    const completedCount = milestoneCompletedCountForRecord(record);
    const rhythmScore = practiceRecordRhythmScore(record);
    return {
      record,
      completedCount,
      rhythmScore,
      completedAll: requiredCompletedCount > 0 && completedCount >= requiredCompletedCount,
      passed: practiceRecordHasPassedStatus(record)
    };
  });
  const completedLoops = recordSummaries.filter((summary) => summary.completedAll).length;
  const rhythmScores = recordSummaries
    .map((summary) => summary.rhythmScore)
    .filter((score) => score !== null);
  const bestRhythmScore = rhythmScores.length > 0 ? Math.max(...rhythmScores) : null;

  if (records.length === 0) {
    return makePracticeMilestoneResult({
      status: "not_started",
      title: "Lesson not started",
      detail: "No practice history yet.",
      completedLoops,
      bestRhythmScore,
      requiredRhythmScore,
      requiredCompletedCount
    });
  }

  if (recordSummaries.some((summary) => summary.passed)) {
    return makePracticeMilestoneResult({
      status: "passed",
      title: "Lesson passed",
      detail: "A practice record is explicitly marked as passed.",
      completedLoops,
      bestRhythmScore,
      requiredRhythmScore,
      requiredCompletedCount
    });
  }

  const passingSummary = recordSummaries.find(
    (summary) => summary.completedAll && summary.rhythmScore !== null && summary.rhythmScore >= requiredRhythmScore
  );
  if (passingSummary) {
    return makePracticeMilestoneResult({
      status: "ready_to_pass",
      title: "Ready to pass",
      detail: `Completed ${requiredCompletedCount}/${requiredCompletedCount} targets with rhythm score ${passingSummary.rhythmScore}.`,
      completedLoops,
      bestRhythmScore,
      requiredRhythmScore,
      requiredCompletedCount
    });
  }

  const latestSummary = recordSummaries[0];
  const detail =
    completedLoops > 0 && bestRhythmScore !== null
      ? `Completed a full loop, but best rhythm score ${bestRhythmScore} is below ${requiredRhythmScore}.`
      : `Latest practice completed ${latestSummary.completedCount}/${requiredCompletedCount} targets.`;

  return makePracticeMilestoneResult({
    status: "in_progress",
    title: "Lesson in progress",
    detail,
    completedLoops,
    bestRhythmScore,
    requiredRhythmScore,
    requiredCompletedCount
  });
};

const makeLessonPathNode = ({ id, title, type, status, detail }) => ({
  id,
  title,
  type,
  status,
  detail
});

export const evaluateMvpLessonProgress = (history = [], options = {}) => {
  const rawHistory = Array.isArray(history)
    ? history.filter((record) => record && typeof record === "object")
    : [];
  const milestone =
    options.milestone ?? evaluatePracticeMilestone(rawHistory, { template: options.template ?? chordLoopPractice });
  const completedStrings = numberOrNull(options.completedStrings) ?? 0;
  const tunerCompleted =
    options.tunerCompleted === true ||
    completedStrings >= 4 ||
    (options.inferTuningFromPractice !== false && rawHistory.length > 0);
  const practiceDone =
    milestone.completedLoops > 0 ||
    milestone.status === "ready_to_pass" ||
    milestone.status === "passed";
  const reviewDone = milestone.status === "passed";
  const hasPractice = rawHistory.length > 0;
  const tuningStatus = tunerCompleted ? "done" : "current";
  const practiceStatus = practiceDone
    ? "done"
    : tunerCompleted || hasPractice
      ? "current"
      : "locked";
  const reviewStatus = reviewDone
    ? "done"
    : practiceDone
      ? "current"
      : "locked";
  const nodes = [
    makeLessonPathNode({
      id: "tuning",
      title: "Tuning",
      type: "tool",
      status: tuningStatus,
      detail: tunerCompleted
        ? "Tuning prep is complete for this lesson."
        : "Start with standard G-C-E-A tuning."
    }),
    makeLessonPathNode({
      id: "practice",
      title: "Follow Practice",
      type: "practice",
      status: practiceStatus,
      detail: practiceDone
        ? "The chord-loop target is complete."
        : "Practice the C-Am-F-G7 loop with the beat."
    }),
    makeLessonPathNode({
      id: "review",
      title: "Review",
      type: "report",
      status: reviewStatus,
      detail: reviewDone
        ? "The lesson has been marked as passed."
        : "Review local rhythm and completion records."
    })
  ];
  const completedNodes = nodes.filter((node) => node.status === "done").length;
  const totalNodes = nodes.length;
  const nextNode = nodes.find((node) => node.status !== "done") ?? null;

  return {
    lessonId: mvpLesson.id,
    nodes,
    completedNodes,
    totalNodes,
    percent: totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100),
    nextNodeId: nextNode?.id ?? null,
    milestoneStatus: milestone.status
  };
};

export const designPrinciples = [
  "练习入口优先，不做营销式首页",
  "调音和跟练反馈必须大、清楚、低干扰",
  "颜色、文字、形状共同表达状态",
  "移动端触控目标不小于 44x44px",
  "后台和 Agent 控制台采用可访问组件与设计 tokens"
];
