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

export const chordLoopPractice = {
  id: "practice-c-am-f-g7-loop",
  type: "chord_switch",
  instrument: "ukulele",
  bpm: 70,
  timeSignature: "4/4",
  passingScore: 70,
  targets: [
    { id: "bar-1", bar: 1, beat: 1, chord: "C", primaryNote: "C4" },
    { id: "bar-2", bar: 2, beat: 1, chord: "Am", primaryNote: "A4" },
    { id: "bar-3", bar: 3, beat: 1, chord: "F", primaryNote: "F4" },
    { id: "bar-4", bar: 4, beat: 1, chord: "G7", primaryNote: "G4" }
  ]
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

export const designPrinciples = [
  "练习入口优先，不做营销式首页",
  "调音和跟练反馈必须大、清楚、低干扰",
  "颜色、文字、形状共同表达状态",
  "移动端触控目标不小于 44x44px",
  "后台和 Agent 控制台采用可访问组件与设计 tokens"
];
