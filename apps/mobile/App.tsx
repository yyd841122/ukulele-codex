import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as sharedPractice from "@ukulele/shared";
import {
  beginnerChords,
  buildSongDetailRoute,
  buildMvpCourseProgressPath,
  chordLoopPractice,
  chordLibraryCategories as sharedChordLibraryCategories,
  designPrinciples,
  designTokens,
  favoriteChordNames as sharedFavoriteChordNames,
  filterBeginnerSongs,
  getMvpCourseForPracticeTemplate,
  metronomeTempoPresets as sharedMetronomeTempoPresets,
  mvpHomeCheckinMinutes,
  mvpHomeHotSongRecommendations,
  mvpHomeQuickActions,
  mvpLearnTopicEntrances,
  mvpMelodyPracticePhrases,
  mvpPracticeTemplates,
  mvpLesson,
  mvpPracticeContent,
  practiceHubDisplayConfig as sharedPracticeHubDisplayConfig,
  practiceLoopModes as sharedPracticeLoopModes,
  practiceTempoPresets as sharedPracticeTempoPresets,
  songDetailDisplayConfig as sharedSongDetailDisplayConfig,
  tunerDisplayConfig as sharedTunerDisplayConfig,
  ukuleleInstrument
} from "@ukulele/shared";
import {
  centsBetween,
  midiToFrequency,
  noteNameToMidi,
  scorePitchEvent,
  scoreRhythmEvent,
  scoreRhythmTimeline,
  summarizeRhythmEvents
} from "@ukulele/audio-core";
import {
  ensureMicrophoneAccess,
  getMicrophonePermissionState,
  initialMicrophoneAccessState
} from "./src/audio/expoAudioEngine";
import { createMockTunerFrame } from "./src/audio/mockAudioEngine";
import { playPracticeBeatClick, preparePracticeBeatAudio } from "./src/audio/practiceBeatSound";
import { useMicrophoneRecorderMonitor } from "./src/audio/useMicrophoneRecorderMonitor";
import { useRealtimeTunerStream } from "./src/audio/useRealtimeTunerStream";
import { clearPracticeHistory, loadPracticeHistory, savePracticeHistory } from "./src/storage/practiceHistoryStore";

type Tab = "home" | "practice" | "songs" | "learn" | "me" | "tuner" | "chords" | "metronome" | "practiceRunner" | "melodyRunner";
type CourseFilter = "required" | "optional" | "pro";

const tabs: Array<{ id: Exclude<Tab, "tuner" | "chords" | "metronome" | "practiceRunner" | "melodyRunner">; label: string }> = [
  { id: "home", label: "首页" },
  { id: "practice", label: "练琴" },
  { id: "songs", label: "曲谱" },
  { id: "learn", label: "学习" },
  { id: "me", label: "我的" }
];

const courseFilters: Array<{ id: CourseFilter; label: string }> = [
  { id: "required", label: "必修" },
  { id: "optional", label: "选修" },
  { id: "pro", label: "Pro" }
];

const IN_TUNE_CENTS = 8;
const ACTION_CENTS = 12;

const practiceSuggestions = [
  "先稳住第一拍，右手扫弦不用急。",
  "Am 进入很稳，保持手腕放松。",
  "F 和弦按弦再靠近品丝一点。",
  "G7 收尾清楚，可以升到 75 BPM。"
];

const colors = designTokens.primitive.color;
const successGreen = "#16A34A";
const accentBeatRed = "#DC2626";
const lightBeatBlue = "#2F7A9A";
const ukuleleStringLabels = ["G", "C", "E", "A"];
type PracticeTempoId = "custom" | "slow" | "standard" | "advanced";
type PracticeLoopMode = "auto" | "single";
type SongFilter = "all" | "entry" | "advanced" | "pro";
type ChordCategoryId = "all" | "beginner" | "major" | "minor" | "seventh" | "accidental" | "barre";
const tempoLabelById: Record<Exclude<PracticeTempoId, "custom">, string> = {
  slow: "慢速",
  standard: "标准",
  advanced: "进阶"
};
const loopModeLabelById: Record<PracticeLoopMode, string> = {
  auto: "自动循环",
  single: "只练当前"
};
const practiceTempoPresets = sharedPracticeTempoPresets.map((preset) => ({
  ...preset,
  id: preset.id as Exclude<PracticeTempoId, "custom">,
  label: tempoLabelById[preset.id as Exclude<PracticeTempoId, "custom">] ?? preset.label
}));
const metronomeTempoPresets = sharedMetronomeTempoPresets.map((preset) => ({
  ...preset,
  id: preset.id as Exclude<PracticeTempoId, "custom">
}));
const tunerDisplayConfig = sharedTunerDisplayConfig;
const tunerStatusStageById = Object.fromEntries(
  tunerDisplayConfig.statusStages.map((stage) => [stage.id, stage])
);
const songDetailDisplayConfig = sharedSongDetailDisplayConfig;
const practiceHubDisplayConfig = sharedPracticeHubDisplayConfig;
const practiceLoopModes = sharedPracticeLoopModes.map((mode) => ({
  ...mode,
  id: mode.id as PracticeLoopMode,
  label: loopModeLabelById[mode.id as PracticeLoopMode] ?? mode.label
}));
const practiceContent = mvpPracticeContent;
const sharedContentSummary = {
  moduleCount: practiceContent.modules.length,
  courseCount: practiceContent.courses.length,
  songCount: practiceContent.songs.length
};
type PracticeTarget = {
  id: string;
  bar?: number;
  beat?: number;
  subdivision?: number;
  stroke?: string;
  accent?: boolean;
  chord?: string;
  chordId?: string;
  primaryNote?: string;
  lyric?: string;
  cue?: string;
  rhythmPatternId?: string;
};
type PracticeTemplate = {
  id: string;
  type: string;
  instrument?: string;
  bpm: number;
  timeSignature: string;
  passingScore?: number;
  rhythmPatternId?: string;
  transitionId?: string;
  songFragmentId?: string;
  targets: PracticeTarget[];
  tempoPresets?: typeof practiceTempoPresets;
  loopModes?: typeof practiceLoopModes;
  display?: {
    title?: string;
    subtitle?: string;
    targetLabel?: string;
  };
  action?: {
    primaryLabel?: string;
    secondaryLabel?: string;
    completionLabel?: string;
  };
};
const practiceTemplates = (
  practiceContent.practiceTemplates.length > 0
    ? practiceContent.practiceTemplates
    : mvpPracticeTemplates
) as PracticeTemplate[];
const rhythmPracticeTemplates = practiceTemplates.filter((template) => template.type === "rhythm_pattern");
const defaultPracticeTemplate = chordLoopPractice as PracticeTemplate;
type CourseCatalogItem = typeof practiceContent.courses[number];
type SongPracticeLine = {
  bar?: number;
  chord?: string;
  text?: string;
};
type BeginnerSong = typeof practiceContent.songs[number];
type SharedNavigationTarget = {
  type?: string;
  id?: string;
};
type MelodyPracticeNote = {
  id: string;
  note: string;
  primaryNote?: string;
  string: string;
  fret: number;
  beat: number;
};
const melodyPracticePhrases = mvpMelodyPracticePhrases as Record<string, MelodyPracticeNote[]>;

function getSongDifficultyLabel(song: BeginnerSong) {
  if (song.display?.difficultyLabel) return song.display.difficultyLabel;
  if (song.access === "pro") return "会员";
  return song.difficulty <= 1 ? "入门" : "进阶";
}

function getSongDisplay(song: BeginnerSong) {
  return song.display ?? {};
}

function getPracticeTemplateById(templateId?: string | null): PracticeTemplate {
  return practiceTemplates.find((template) => template.id === templateId) ?? defaultPracticeTemplate;
}

function getPracticeTemplateTitle(template: PracticeTemplate) {
  return template.display?.title ?? template.id;
}

function getPracticeTemplateShortLabel(template: PracticeTemplate) {
  if (template.type === "rhythm_pattern") return "节奏型";
  if (template.type === "chord_transition") return "换和弦";
  if (template.type === "song_fragment") return "歌曲";
  return "循环";
}

function getPracticeTargetChord(target?: PracticeTarget) {
  return target?.chord ?? "C";
}

function getPracticeTargetNote(target?: PracticeTarget) {
  return target?.primaryNote ?? "C4";
}

function getPracticeTargetBar(target?: PracticeTarget, fallbackIndex = 0) {
  return target?.bar ?? fallbackIndex + 1;
}

function getPracticeTargetCue(target?: PracticeTarget) {
  return target && "cue" in target && typeof target.cue === "string" ? target.cue : undefined;
}

function getStrokeLabel(stroke?: string) {
  if (stroke === "down") return "下扫";
  if (stroke === "up") return "上扫";
  if (stroke === "mute") return "切音";
  if (stroke === "rest") return "空拍";
  return "扫弦";
}

function getStrokeArrow(stroke?: string) {
  if (stroke === "down") return "↓";
  if (stroke === "up") return "↑";
  if (stroke === "mute") return "×";
  if (stroke === "rest") return "•";
  return "•";
}

function getRhythmAccentLabel(target?: PracticeTarget) {
  return target?.accent ? "重音" : "轻拍";
}

function getRhythmTemplateDisplayTitle(template: PracticeTemplate) {
  if (template.id === "practice-rhythm-down-four") return "↓ 四拍";
  if (template.id === "practice-rhythm-down-down-up-up") return "↓ ↓ ↑ ↑";
  if (template.id === "practice-rhythm-down-up-eight") return "↓↑ 连续";
  if (template.id === "practice-rhythm-chuck-two-four") return "↓ × ↓ ×";
  if (template.id === "practice-rhythm-waltz-three") return "3/4 ↓ ↓ ↑";
  if (template.id === "practice-rhythm-ballad-split") return "↓ • ↑ ↓ ↑";
  return getPracticeTemplateTitle(template);
}

function getBeatsPerBar(template: PracticeTemplate) {
  const beatsPerBar = Number(String(template.timeSignature ?? "4/4").split("/")[0]);
  return Number.isFinite(beatsPerBar) ? Math.max(1, Math.round(beatsPerBar)) : 4;
}

function getRhythmStepDurationMs(template: PracticeTemplate, bpm: number) {
  const targetCount = Math.max(1, template.targets?.length ?? getBeatsPerBar(template));
  return (60000 / bpm) * (getBeatsPerBar(template) / targetCount);
}

function getRhythmScoringBpm(template: PracticeTemplate, bpm: number) {
  return 60000 / getRhythmStepDurationMs(template, bpm);
}

const RHYTHM_AUTO_CAPTURE_OFFSETS_MS = [-28, 42, 18, -64, 75, 8, -35, 55];

function rhythmTimingFeedback(event?: Pick<PracticeLogEvent, "timingOffsetMs" | "rhythmScore" | "timingStatus"> | null) {
  if (!event || event.rhythmScore == null || event.timingOffsetMs == null) {
    return "开始后自动记录扫弦节奏，结束后生成本轮评分。";
  }
  const offset = Math.round(event.timingOffsetMs);
  if (event.timingStatus === "on-time") return `准 · ${event.rhythmScore} 分 · 偏差 ${Math.abs(offset)}ms`;
  if (event.timingStatus === "early") return `偏早 ${Math.abs(offset)}ms · ${event.rhythmScore} 分`;
  return `偏晚 ${Math.abs(offset)}ms · ${event.rhythmScore} 分`;
}

function getPracticeTargetSummary(target: PracticeTarget | undefined, template: PracticeTemplate) {
  const chord = getPracticeTargetChord(target);
  if (template.type === "rhythm_pattern") {
    return `${getStrokeLabel(target?.stroke)}${target?.accent ? " · 重音" : " · 轻拍"}`;
  }
  if (template.type === "chord_transition") {
    return `${chord} · 第 ${getPracticeTargetBar(target)} 小节落稳`;
  }
  if (template.type === "song_fragment") {
    return `${chord} · ${target?.lyric ?? "跟弹"}`;
  }
  return `${chord} · 和弦目标`;
}

function getPracticeTargetDetail(target: PracticeTarget | undefined, template: PracticeTemplate) {
  const beat = target?.beat ?? 1;
  const subdivision = target?.subdivision && target.subdivision > 1 ? `.${target.subdivision}` : "";
  if (template.type === "rhythm_pattern") {
    return `第 ${beat}${subdivision} 拍 · 右手 ${getStrokeLabel(target?.stroke)} · ${target?.accent ? "第一拍重音" : "保持轻拍"}`;
  }
  if (template.type === "chord_transition") {
    return `第 ${getPracticeTargetBar(target)} 小节第 ${beat} 拍前完成换指`;
  }
  if (template.type === "song_fragment") {
    return `第 ${getPracticeTargetBar(target)} 小节 · 歌词 ${target?.lyric ?? "la"} · 跟随当前和弦`;
  }
  return `第 ${getPracticeTargetBar(target)} 小节 · 第 ${beat} 拍`;
}

function getPracticeTemplateGoalMeta(template: PracticeTemplate) {
  if (template.type === "rhythm_pattern") return "目标：稳定扫弦方向和重音";
  if (template.type === "chord_transition") return "目标：换指在下一小节第一拍前落稳";
  if (template.type === "song_fragment") return "目标：把节奏、和弦和歌词放回同一条时间线";
  return "目标：四和弦循环连续完成";
}

function getPracticeTemplateChordNames(template?: PracticeTemplate | null) {
  if (!template) return [];
  return Array.from(new Set((template.targets ?? []).map((target) => getPracticeTargetChord(target))));
}

function getSongForPracticeTemplate(template: PracticeTemplate) {
  return practiceContent.songs.find((song) =>
    Array.isArray(song.practiceTemplateIds) && song.practiceTemplateIds.includes(template.id)
  ) ?? null;
}

function getSongPracticeLines(song: ReturnType<typeof getSongForPracticeTemplate>): SongPracticeLine[] {
  return Array.isArray(song?.practiceLines) ? song.practiceLines : [];
}

function getSongById(songId?: string | null): BeginnerSong | null {
  return practiceContent.songs.find((song) => song.id === songId) ?? null;
}

function getMelodyPhraseForSong(song?: BeginnerSong | null) {
  const phraseKey = String(song?.key ?? "C");
  return melodyPracticePhrases[phraseKey] ?? melodyPracticePhrases.C ?? [];
}

function createMelodyPracticeTemplate(song: BeginnerSong, phrase: MelodyPracticeNote[], bpm: number): PracticeTemplate {
  return {
    id: `practice-melody-${song.id}`,
    type: "melody_practice",
    instrument: "ukulele",
    bpm,
    timeSignature: song.timeSignature ?? "4/4",
    passingScore: 70,
    targets: phrase.map((note, index) => ({
      id: note.id,
      bar: Math.floor(index / 4) + 1,
      beat: note.beat,
      chord: song.chordNames?.[Math.floor(index / 2) % Math.max(1, song.chordNames.length)] ?? "C",
      primaryNote: note.primaryNote ?? `${note.note}4`,
      cue: `${note.string} string / fret ${note.fret}`
    })),
    display: {
      title: `${song.title} 单音跟弹`,
      subtitle: "先按节拍拨出目标单音，再回到歌曲片段跟弹。",
      targetLabel: "单音目标"
    }
  };
}

function getCourseSegments(course: CourseCatalogItem) {
  return Array.isArray(course.segments) && course.segments.length > 0
    ? course.segments
    : ["预习", "练习", "复盘", "完成"];
}

function getCourseActionLabel(course: CourseCatalogItem) {
  if (course.toolId === "tuner") return "打开调音器";
  if (course.primaryPracticeTemplateId) {
    return `开始${getPracticeTemplateShortLabel(getPracticeTemplateById(course.primaryPracticeTemplateId))}`;
  }
  if (course.linkedSongId) return "查看歌曲";
  return "查看和弦库";
}

function getCourseActionHint(course: CourseCatalogItem) {
  if (course.toolId === "tuner") return "下一步：打开调音器，把 G/C/E/A 调到绿色区";
  const template = getCoursePracticeTemplate(course);
  if (!template && course.linkedSongId) return "下一步：查看歌曲和本段用到的和弦";
  if (!template) return "下一步：查看课程步骤";
  if (template.type === "rhythm_pattern") return "下一步：进入节奏型练习，先稳住右手";
  if (template.type === "chord_transition") return "下一步：进入和弦转换，先练两个和弦";
  if (template.type === "song_fragment") return "下一步：进入歌曲片段，把节奏和和弦合起来";
  return `下一步：开始${getPracticeTemplateShortLabel(template)}`;
}

function getCoursePathStatusText(status: LessonPathStatus) {
  if (status === "done") return "已完成";
  if (status === "current") return "当前";
  if (status === "locked") return "未解锁";
  return "待开始";
}

function getCoursePracticeTemplate(course: CourseCatalogItem) {
  return course.primaryPracticeTemplateId
    ? practiceTemplates.find((template) => template.id === course.primaryPracticeTemplateId) ?? null
    : null;
}

function getCourseFollowupPracticeTemplate(course: CourseCatalogItem) {
  return course.followupPracticeTemplateId
    ? practiceTemplates.find((template) => template.id === course.followupPracticeTemplateId) ?? null
    : null;
}

function getCourseSong(course: CourseCatalogItem) {
  return course.linkedSongId
    ? practiceContent.songs.find((song) => song.id === course.linkedSongId) ?? null
    : null;
}

function getPracticeBeatNumbers(template: PracticeTemplate) {
  const beatsPerBar = Number(String(template.timeSignature ?? "4/4").split("/")[0]);
  const count = Number.isFinite(beatsPerBar) ? Math.max(1, Math.min(12, Math.round(beatsPerBar))) : 4;
  return Array.from({ length: count }, (_, index) => index + 1);
}

type PracticeLogEvent = {
  type: "start" | "bar" | "complete" | "reset" | "tempo" | "mode" | "end" | "tap";
  step: number;
  chord: string;
  bpm: number;
  loopMode: PracticeLoopMode;
  timestampMs: number;
  targetBeatIndex?: number;
  timingOffsetMs?: number;
  rhythmScore?: number;
  timingStatus?: "early" | "late" | "on-time";
};

type PracticeSessionInput = {
  courseId?: string | null;
  events: PracticeLogEvent[];
  completedSteps: boolean[];
  bpm: number;
  mode: PracticeLoopMode;
  lessonId: string;
  exerciseId: string;
  songId?: string | null;
  template: PracticeTemplate;
  templateId?: string;
  rhythmSummary?: RhythmPracticeSummary;
};

type PracticeSessionRecord = PracticeSessionInput & {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  completedCount: number;
  totalSteps: number;
  loopMode?: PracticeLoopMode;
};

type PracticeRecordSummary = {
  title: string;
  contentLabel: string;
  durationLabel: string;
  completedStepsLabel: string;
  bpmLabel: string;
  rhythmLabel: string;
  advice: string;
};

type RhythmPracticeSummary = {
  averageRhythmScore: number;
  earlyCount: number;
  lateCount: number;
  onTimeCount: number;
  suggestion: string;
};

type SharedPracticeRecord = {
  version?: number;
  courseId?: string | null;
  exerciseId?: string;
  lessonId?: string;
  songId?: string | null;
  templateId?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt?: string;
  bpm?: number;
  loopMode?: PracticeLoopMode;
  targets?: typeof chordLoopPractice.targets;
  events?: Array<PracticeLogEvent & { targetId?: string; bar?: number; beat?: number }>;
};

type SharedPracticeSummary = Partial<{
  durationSec: number;
  barsPracticed: number;
  completedCount: number;
  completedTargetCount: number;
  weakPoint: string | null;
  suggestion: string;
}>;

type PracticeHistorySummary = {
  totalSessions: number;
  totalDurationSec: number;
  totalCompletedCount: number;
  latestRecord: PracticeSessionRecord | null;
  practiceDays: number;
  practiceDayKeys: string[];
  currentStreakDays: number;
};

type NextPracticeRecommendation = {
  title: string;
  detail: string;
  bpm: number;
  tempoId: PracticeTempoId;
  loopMode: PracticeLoopMode;
  focusChord?: string | null;
  templateId?: string;
  courseId?: string;
  songId?: string;
  reason: string;
};

type PracticeMilestoneStatus = "not_started" | "in_progress" | "ready_to_pass" | "passed";

type PracticeMilestoneEvaluation = {
  status: PracticeMilestoneStatus;
  title: string;
  detail: string;
  completedLoops: number;
  bestRhythmScore: number;
  requiredRhythmScore: number;
  requiredCompletedCount: number;
  canPass: boolean;
};

type PracticePathSummaryItem = {
  courseId: string;
  templateId: string;
  songId?: string | null;
  type: string;
  title: string;
  attempts: number;
  status: "not_started" | "in_progress" | "passed";
  completedCount: number;
  targetCount: number;
  bestRhythmScore: number | null;
  latestRhythmScore: number | null;
  weakPoint: string | null;
};

type LessonPathStatus = "done" | "current" | "pending" | "locked";

type LessonPathNode = {
  id: "tuning" | "practice" | "review" | string;
  title: string;
  type: string;
  status: LessonPathStatus;
  detail: string;
};

type LessonPathProgress = {
  lessonId?: string;
  nodes: LessonPathNode[];
  completedNodes: number;
  totalNodes: number;
  percent: number;
  nextNodeId: string | null;
  milestoneStatus?: PracticeMilestoneStatus;
};

type CoursePathItem = {
  id: string;
  title: string;
  subtitle: string;
  status: LessonPathStatus;
  detail: string;
  progress: number;
};

type PracticeCompletionNotice = {
  title: string;
  detail: string;
} | null;

type PracticeLaunchConfig = {
  templateId?: string;
  bpm: number;
  tempoId: PracticeTempoId;
  loopMode: PracticeLoopMode;
  focusChord?: string | null;
  token: number;
};

type SharedPracticeTools = Partial<{
  createPracticeSessionRecord: (input: Record<string, unknown>) => SharedPracticeRecord;
  summarizePracticeRecord: (record: Record<string, unknown>) => SharedPracticeSummary;
  normalizePracticeHistory: <TRecord>(history: TRecord[], limit?: number) => TRecord[];
  summarizePracticeHistory: (history: Array<Record<string, unknown>>) => PracticeHistorySummary;
  createNextPracticeRecommendation: (
    history: Array<Record<string, unknown>>,
    options?: Record<string, unknown>
  ) => NextPracticeRecommendation;
  recommendNextPractice: (
    history: Array<Record<string, unknown>>,
    template?: Record<string, unknown>
  ) => NextPracticeRecommendation;
  evaluatePracticeMilestone: (
    history: Array<Record<string, unknown>>,
    options?: Record<string, unknown>
  ) => PracticeMilestoneEvaluation;
  evaluateMvpLessonProgress: (
    history: Array<Record<string, unknown>>,
    options?: Record<string, unknown>
  ) => LessonPathProgress;
  summarizeMvpPracticePath: (history: Array<Record<string, unknown>>) => PracticePathSummaryItem[];
  evaluateLessonProgress: (
    history: Array<Record<string, unknown>>,
    template?: Record<string, unknown>
  ) => PracticeMilestoneEvaluation;
}>;

const sharedPracticeTools = sharedPractice as unknown as SharedPracticeTools;

function createPracticeSessionRecord(input: PracticeSessionInput): PracticeSessionRecord {
  const startedAtMs = input.events[0]?.timestampMs ?? Date.now();
  const endedAtMs = input.events[input.events.length - 1]?.timestampMs ?? startedAtMs;
  const completedCount = input.completedSteps.filter(Boolean).length;
  const targets = input.template.targets ?? chordLoopPractice.targets;
  const sharedInput = {
    courseId: input.courseId,
    exerciseId: input.exerciseId,
    lessonId: input.lessonId,
    songId: input.songId,
    startedAt: new Date(startedAtMs).toISOString(),
    endedAt: new Date(endedAtMs).toISOString(),
    templateId: input.templateId ?? input.template.id,
    bpm: input.bpm,
    mode: input.mode,
    targets,
    events: input.events.map((event) => {
      const target = targets[event.step];
      return {
        ...event,
        targetId: target?.id,
        bar: target?.bar,
        beat: target?.beat
      };
    })
  };
  const sharedRecord = sharedPracticeTools.createPracticeSessionRecord?.(sharedInput) ?? {};

  return {
    ...input,
    ...sharedRecord,
    id: `practice-${startedAtMs}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: sharedRecord.startedAt ?? new Date(startedAtMs).toISOString(),
    endedAt: sharedRecord.endedAt ?? new Date(endedAtMs).toISOString(),
    durationSec: Math.max(0, Math.round((endedAtMs - startedAtMs) / 1000)),
    completedCount,
    totalSteps: input.completedSteps.length
  };
}

function summarizePracticeRecord(record: PracticeSessionRecord): PracticeRecordSummary {
  const sharedSummary = sharedPracticeTools.summarizePracticeRecord?.(record) ?? {};
  const totalSteps = record.totalSteps ?? chordLoopPractice.targets.length;
  const completedTargetCount = sharedSummary.completedTargetCount ?? record.completedCount ?? 0;
  const completedAll = completedTargetCount >= totalSteps;
  const mode = record.mode ?? record.loopMode ?? "auto";
  const modeLabel = mode === "auto" ? "自动循环" : "只练当前";
  const templateLabel = getPracticeTemplateTitle(record.template ?? getPracticeTemplateById(record.templateId ?? record.exerciseId));
  const course = record.courseId
    ? practiceContent.courses.find((item) => item.id === record.courseId)
    : getMvpCourseForPracticeTemplate(record.templateId ?? record.exerciseId);
  const song = record.songId
    ? practiceContent.songs.find((item) => item.id === record.songId)
    : null;
  const contentLabel = [
    course ? `第 ${course.order} 课` : null,
    song ? song.title : null
  ].filter(Boolean).join(" · ") || "本地练习";
  const durationLabel = formatPracticeDuration(sharedSummary.durationSec ?? record.durationSec ?? 0);
  const endedAt = record.endedAt ?? new Date().toISOString();
  const bpm = record.bpm ?? chordLoopPractice.bpm;
  const rhythmLabel = record.rhythmSummary?.averageRhythmScore
    ? `${record.rhythmSummary.averageRhythmScore}`
    : "--";
  const advice = completedAll
    ? "四个小节都完成了，下次可以尝试提高 5 BPM。"
    : mode === "single"
      ? "单小节练习已记录，继续把当前换指练稳。"
      : record.rhythmSummary?.suggestion
        ? translateRhythmSuggestion(record.rhythmSummary)
      : sharedSummary.weakPoint
        ? `下次优先稳住 ${sharedSummary.weakPoint}，先慢速再升速。`
        : "先保持四拍稳定，再追求更快换和弦。";

  return {
    title: `${templateLabel} · ${modeLabel} · ${new Date(endedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`,
    contentLabel,
    durationLabel,
    completedStepsLabel: `${completedTargetCount}/${totalSteps}`,
    bpmLabel: `${bpm} BPM`,
    rhythmLabel,
    advice
  };
}

function formatPracticeDuration(durationSec: number) {
  if (durationSec < 60) return `${durationSec}s`;
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return seconds === 0 ? `${minutes}min` : `${minutes}min ${seconds}s`;
}

function translateRhythmSuggestion(summary: RhythmPracticeSummary) {
  if (summary.onTimeCount >= summary.earlyCount + summary.lateCount) {
    return "完成点击基本贴住节拍，继续保持稳定四拍。";
  }
  if (summary.earlyCount > summary.lateCount) {
    return "完成点击偏早，下一轮等节拍落稳后再切换。";
  }
  if (summary.lateCount > summary.earlyCount) {
    return "完成点击偏晚，下一轮提前准备左手换指。";
  }
  return "完成时机有早有晚，先降 5 BPM 练稳定。";
}

function summarizePracticeRhythm(events: PracticeLogEvent[], bpm: number): RhythmPracticeSummary {
  const startEvent = events.find((event) => event.type === "start");
  const tapEvents = events.filter((event) => event.type === "tap" && event.rhythmScore != null && event.timingOffsetMs != null);
  if (tapEvents.length > 0) {
    return summarizeRhythmEvents(tapEvents) as RhythmPracticeSummary;
  }
  if (!startEvent) {
    return {
      averageRhythmScore: 0,
      earlyCount: 0,
      lateCount: 0,
      onTimeCount: 0,
      suggestion: "Start practicing to build a rhythm baseline."
    };
  }

  return scoreRhythmTimeline({
    startedAtMs: startEvent.timestampMs,
    bpm,
    events: events.filter((event) => event.type === "complete")
  }).summary as RhythmPracticeSummary;
}

function findPracticeStepByChord(chordName?: string | null, template: PracticeTemplate = defaultPracticeTemplate) {
  if (!chordName) return 0;
  const index = (template.targets ?? []).findIndex((target) => target.chord === chordName);
  return index >= 0 ? index : 0;
}

function normalizeLocalPracticeHistory(history: PracticeSessionRecord[]) {
  const normalize = sharedPracticeTools.normalizePracticeHistory;
  if (normalize) {
    return normalize(history, 20);
  }
  return [...history].slice(0, 20);
}

function summarizeLocalPracticeHistory(history: PracticeSessionRecord[]): PracticeHistorySummary {
  const summary = sharedPracticeTools.summarizePracticeHistory?.(history);
  if (summary) {
    return summary;
  }
  return {
    totalSessions: history.length,
    totalDurationSec: history.reduce((sum, record) => sum + (record.durationSec ?? 0), 0),
    totalCompletedCount: history.reduce((sum, record) => sum + (record.completedCount ?? 0), 0),
    latestRecord: history[0] ?? null,
    practiceDays: 0,
    practiceDayKeys: [],
    currentStreakDays: 0
  };
}

function createLocalNextPracticeRecommendation(history: PracticeSessionRecord[]): NextPracticeRecommendation {
  const sharedRecommendation =
    sharedPracticeTools.createNextPracticeRecommendation?.(history, { contentPath: true })
    ?? sharedPracticeTools.recommendNextPractice?.(history, chordLoopPractice);
  if (sharedRecommendation) {
    return normalizeRecommendation(sharedRecommendation);
  }

  const latestRecord = history[0];
  if (!latestRecord) {
    return {
      title: "从慢速四和弦开始",
      detail: "先用 60 BPM 自动循环，熟悉 C-Am-F-G7 的换指顺序。",
      bpm: 60,
      tempoId: "slow",
      loopMode: "auto",
      focusChord: null,
      reason: "还没有本地练习记录"
    };
  }

  const rhythmScore = latestRecord.rhythmSummary?.averageRhythmScore ?? 0;
  const completedCount = latestRecord.completedCount ?? 0;
  const fallbackTargets = defaultPracticeTemplate.targets;
  const totalSteps = latestRecord.totalSteps ?? fallbackTargets.length;
  const weakTarget = fallbackTargets.find((target, index) => !latestRecord.completedSteps?.[index]);

  if (completedCount < totalSteps || rhythmScore < 70) {
    const focusChord = weakTarget?.chord ?? latestRecord.events?.at(-1)?.chord ?? fallbackTargets[0]?.chord;
    return {
      title: `稳住 ${focusChord}`,
      detail: `用 60 BPM 只练 ${focusChord}，先把完成时机贴近节拍。`,
      bpm: 60,
      tempoId: "slow",
      loopMode: "single",
      focusChord,
      reason: rhythmScore < 70 ? "最近节奏参考分偏低" : "上一轮还有目标未完成"
    };
  }

  if (completedCount >= totalSteps && rhythmScore >= 85) {
    return {
      title: "升到进阶速度",
      detail: "上一轮完成度和节奏都不错，可以试 85 BPM 自动循环。",
      bpm: 85,
      tempoId: "advanced",
      loopMode: "auto",
      focusChord: null,
      reason: "上一轮完成度高，节奏稳定"
    };
  }

  return {
    title: "保持标准速度",
    detail: "继续 70 BPM 自动循环，目标是完整跑顺一轮。",
    bpm: 70,
    tempoId: "standard",
    loopMode: "auto",
    focusChord: null,
    reason: "当前表现适合巩固标准速度"
  };
}

function evaluateLocalPracticeMilestone(history: PracticeSessionRecord[]): PracticeMilestoneEvaluation {
  const sharedEvaluation =
    sharedPracticeTools.evaluatePracticeMilestone?.(history, { template: chordLoopPractice })
    ?? sharedPracticeTools.evaluateLessonProgress?.(history, chordLoopPractice);
  if (sharedEvaluation) {
    return localizeMilestoneEvaluation(sharedEvaluation);
  }

  const requiredCompletedCount = chordLoopPractice.targets.length;
  const requiredRhythmScore = chordLoopPractice.passingScore ?? 70;
  if (history.length === 0) {
    return {
      status: "not_started",
      title: "还未开始",
      detail: `完成 ${requiredCompletedCount} 个目标，并让节奏参考分达到 ${requiredRhythmScore} 即可通过。`,
      completedLoops: 0,
      bestRhythmScore: 0,
      requiredRhythmScore,
      requiredCompletedCount,
      canPass: false
    };
  }

  const completedRecords = history.filter((record) => (record.completedCount ?? 0) >= requiredCompletedCount);
  const bestRhythmScore = Math.max(
    0,
    ...history.map((record) => record.rhythmSummary?.averageRhythmScore ?? 0)
  );
  const explicitPassed = history.some((record) => {
    const status = (record as PracticeSessionRecord & { status?: string; result?: string }).status
      ?? (record as PracticeSessionRecord & { status?: string; result?: string }).result;
    return status === "passed";
  });
  const canPass = explicitPassed || (completedRecords.length > 0 && bestRhythmScore >= requiredRhythmScore);
  const status: PracticeMilestoneStatus = explicitPassed ? "passed" : canPass ? "ready_to_pass" : "in_progress";

  return localizeMilestoneEvaluation({
    status,
    title: status,
    detail: "",
    completedLoops: completedRecords.length,
    bestRhythmScore,
    requiredRhythmScore,
    requiredCompletedCount,
    canPass
  });
}

function evaluateLocalLessonPathProgress(
  history: PracticeSessionRecord[],
  milestone: PracticeMilestoneEvaluation
): LessonPathProgress {
  const sharedProgress = sharedPracticeTools.evaluateMvpLessonProgress?.(history, {
    template: chordLoopPractice,
    milestone
  });
  if (sharedProgress) {
    return localizeLessonPathProgress(sharedProgress);
  }

  const hasPractice = history.length > 0;
  const practiceDone =
    milestone.completedLoops > 0 ||
    milestone.status === "ready_to_pass" ||
    milestone.status === "passed";
  const reviewDone = milestone.status === "passed";
  const nodes: LessonPathNode[] = [
    {
      id: "tuning",
      title: "调音",
      type: "tool",
      status: hasPractice ? "done" : "current",
      detail: hasPractice ? "已进入本地跟练记录" : "先确认 G-C-E-A 标准调弦"
    },
    {
      id: "practice",
      title: "跟练",
      type: "practice",
      status: practiceDone ? "done" : hasPractice ? "current" : "locked",
      detail: practiceDone ? "四和弦循环已达标" : "按节拍跑顺 C-Am-F-G7"
    },
    {
      id: "review",
      title: "复盘",
      type: "report",
      status: reviewDone ? "done" : practiceDone ? "current" : "locked",
      detail: reviewDone ? "第一课已标记通过" : "查看节奏和完成记录"
    }
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
}

function buildCoursePath(history: PracticeSessionRecord[], type: CourseFilter = "required"): CoursePathItem[] {
  return buildMvpCourseProgressPath(history, { type }) as CoursePathItem[];
}

function localizeLessonPathProgress(progress: LessonPathProgress): LessonPathProgress {
  const titleById: Record<string, string> = {
    tuning: "调音",
    practice: "跟练",
    review: "复盘"
  };
  const detailById: Record<string, string> = {
    tuning: progress.nodes.find((node) => node.id === "tuning")?.status === "done"
      ? "课前准备已完成"
      : "确认 G-C-E-A 标准调弦",
    practice: progress.nodes.find((node) => node.id === "practice")?.status === "done"
      ? "四和弦循环已达标"
      : "按节拍跑顺 C-Am-F-G7",
    review: progress.nodes.find((node) => node.id === "review")?.status === "done"
      ? "第一课已标记通过"
      : "查看节奏和完成记录"
  };

  return {
    ...progress,
    nodes: progress.nodes.map((node) => ({
      ...node,
      title: titleById[node.id] ?? node.title,
      detail: detailById[node.id] ?? node.detail
    }))
  };
}

function localizeMilestoneEvaluation(evaluation: PracticeMilestoneEvaluation): PracticeMilestoneEvaluation {
  const titleByStatus: Record<PracticeMilestoneStatus, string> = {
    not_started: "还未开始",
    in_progress: "练习中",
    ready_to_pass: "可通过",
    passed: "已通过"
  };
  const detailByStatus: Record<PracticeMilestoneStatus, string> = {
    not_started: `完成 ${evaluation.requiredCompletedCount} 个目标，并让节奏参考分达到 ${evaluation.requiredRhythmScore} 即可通过。`,
    in_progress: `通过条件：完成 ${evaluation.requiredCompletedCount} 个目标，节奏参考分 ≥ ${evaluation.requiredRhythmScore}。`,
    ready_to_pass: "已经达到本课通过条件，可以标记通过或继续升速练习。",
    passed: "第一课已经通过，可以继续保持练习记录。"
  };
  return {
    ...evaluation,
    title: titleByStatus[evaluation.status] ?? evaluation.title,
    detail: detailByStatus[evaluation.status] ?? evaluation.detail
  };
}

function summarizeLocalPracticePath(history: PracticeSessionRecord[]): PracticePathSummaryItem[] {
  const sharedSummary = sharedPracticeTools.summarizeMvpPracticePath?.(history);
  if (sharedSummary) {
    return sharedSummary;
  }
  return ["practice-rhythm-down-four", "practice-transition-c-am", "practice-song-fragment-four-chord-hum"].map((templateId) => {
    const template = getPracticeTemplateById(templateId);
    const course = getMvpCourseForPracticeTemplate(templateId);
    return {
      courseId: course?.id ?? "",
      templateId,
      songId: course?.linkedSongId ?? null,
      type: template.type,
      title: course?.title ?? getPracticeTemplateTitle(template),
      attempts: 0,
      status: "not_started",
      completedCount: 0,
      targetCount: template.targets.length,
      bestRhythmScore: null,
      latestRhythmScore: null,
      weakPoint: null
    };
  });
}

function normalizeRecommendation(recommendation: NextPracticeRecommendation): NextPracticeRecommendation {
  const tempoId = recommendation.tempoId === "custom" ? tempoIdFromBpm(recommendation.bpm) : recommendation.tempoId;
  const normalized = {
    ...recommendation,
    bpm: recommendation.bpm ?? chordLoopPractice.bpm,
    tempoId,
    loopMode: recommendation.loopMode ?? "auto",
    focusChord: recommendation.focusChord ?? null
  };
  return localizeRecommendation(normalized);
}

function localizeRecommendation(recommendation: NextPracticeRecommendation): NextPracticeRecommendation {
  const modeLabel = recommendation.loopMode === "single" ? "只练当前" : "自动循环";
  const template = getPracticeTemplateById(recommendation.templateId);
  const targetLabel = recommendation.focusChord ?? getPracticeTemplateShortLabel(template);
  const title = recommendation.loopMode === "single"
    ? `稳住 ${targetLabel}`
    : template.type === "rhythm_pattern"
      ? "先稳右手节奏"
      : template.type === "chord_transition"
        ? "练和弦转换"
        : template.type === "song_fragment"
          ? "进入歌曲片段"
          : recommendation.bpm >= 85
            ? "升到进阶速度"
            : recommendation.bpm <= 60
              ? "从慢速循环开始"
              : "保持标准速度";
  const detail = recommendation.loopMode === "single"
    ? `用 ${recommendation.bpm} BPM ${modeLabel}，先把 ${targetLabel} 的换指和完成时机练稳。`
    : template.type === "rhythm_pattern"
      ? `用 ${recommendation.bpm} BPM ${modeLabel}，先把右手节奏型扫稳。`
      : template.type === "song_fragment"
        ? `用 ${recommendation.bpm} BPM ${modeLabel}，跟着歌曲片段练小节、和弦和节奏。`
        : `用 ${recommendation.bpm} BPM ${modeLabel}，完整跑顺 ${targetLabel}。`;

  return {
    ...recommendation,
    title,
    detail,
    reason: localizeRecommendationReason(recommendation)
  };
}

function localizeRecommendationReason(recommendation: NextPracticeRecommendation) {
  const reason = recommendation.reason.toLowerCase();
  if (reason.includes("no practice")) return "还没有本地练习记录";
  if (reason.includes("rhythm score") || reason.includes("below")) return "最近节奏参考分偏低";
  if (reason.includes("not complete") || reason.includes("completed")) return "上一轮还有目标未完成";
  if (reason.includes("tempo") || reason.includes("complete with rhythm")) return "上一轮完成度高，节奏稳定";
  return "根据最近练习记录生成";
}

function tempoIdFromBpm(bpm: number): PracticeTempoId {
  const preset = practiceTempoPresets.find((item) => item.bpm === bpm);
  return preset?.id ?? "custom";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [practiceHistory, setPracticeHistory] = useState<PracticeSessionRecord[]>([]);
  const [practiceLaunchConfig, setPracticeLaunchConfig] = useState<PracticeLaunchConfig | undefined>();
  const [melodyLaunchSongId, setMelodyLaunchSongId] = useState<string | null>(null);
  const [practiceCompletionNotice, setPracticeCompletionNotice] = useState<PracticeCompletionNotice>(null);
  const latestPracticeSummary = useMemo(() => {
    const latestRecord = practiceHistory[0];
    return latestRecord ? summarizePracticeRecord(latestRecord) : undefined;
  }, [practiceHistory]);
  const recentPracticeSummaries = useMemo(
    () => practiceHistory.slice(0, 3).map((record) => summarizePracticeRecord(record)),
    [practiceHistory]
  );
  const practiceHistorySummary = useMemo(
    () => summarizeLocalPracticeHistory(practiceHistory),
    [practiceHistory]
  );
  const practicePathSummary = useMemo(
    () => summarizeLocalPracticePath(practiceHistory),
    [practiceHistory]
  );
  const nextPracticeRecommendation = useMemo(
    () => createLocalNextPracticeRecommendation(practiceHistory),
    [practiceHistory]
  );
  const practiceMilestone = useMemo(
    () => evaluateLocalPracticeMilestone(practiceHistory),
    [practiceHistory]
  );
  const lessonPathProgress = useMemo(
    () => evaluateLocalLessonPathProgress(practiceHistory, practiceMilestone),
    [practiceHistory, practiceMilestone]
  );
  const coursePathsByFilter = useMemo<Record<CourseFilter, CoursePathItem[]>>(
    () => ({
      required: buildCoursePath(practiceHistory, "required"),
      optional: buildCoursePath(practiceHistory, "optional"),
      pro: buildCoursePath(practiceHistory, "pro")
    }),
    [practiceHistory]
  );
  const activePracticeRunnerTemplate = getPracticeTemplateById(practiceLaunchConfig?.templateId);
  const fixedScreen = activeTab === "home" || activeTab === "practice" || (activeTab === "practiceRunner" && activePracticeRunnerTemplate.type === "rhythm_pattern");

  useEffect(() => {
    let mounted = true;
    loadPracticeHistory<PracticeSessionRecord>().then((records) => {
      if (mounted) {
        setPracticeHistory(normalizeLocalPracticeHistory(records));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  function appendPracticeRecord(record: PracticeSessionRecord) {
    setPracticeHistory((history) => {
      const nextHistory = normalizeLocalPracticeHistory([record, ...history]);
      void savePracticeHistory(nextHistory);
      return nextHistory;
    });
  }

  function handlePracticeRecord(record: PracticeSessionRecord) {
    appendPracticeRecord(record);
    const completedCount = record.completedCount ?? record.completedSteps?.filter(Boolean).length ?? 0;
    const totalSteps = record.totalSteps ?? record.completedSteps?.length ?? 0;
    const rhythmScore = record.rhythmSummary?.averageRhythmScore ?? 0;
    if (totalSteps > 0 && completedCount >= totalSteps && rhythmScore >= 70) {
      const templateTitle = record.template ? getPracticeTemplateTitle(record.template) : "本次练习";
      setPracticeCompletionNotice({
        title: "练习达标",
        detail: `${templateTitle} · 节奏 ${rhythmScore} · 已回到课程路径`
      });
      setActiveTab("home");
    }
  }

  function clearPracticeRecords() {
    setPracticeHistory([]);
    setPracticeCompletionNotice(null);
    void clearPracticeHistory();
  }

  function startPractice(config?: Omit<PracticeLaunchConfig, "token">) {
    setPracticeCompletionNotice(null);
    if (config) {
      setPracticeLaunchConfig({ ...config, token: Date.now() });
    }
    setActiveTab("practiceRunner");
  }

  function startPracticeTemplate(templateId: string) {
    const template = getPracticeTemplateById(templateId);
    startPractice({
      templateId: template.id,
      bpm: template.bpm,
      tempoId: tempoIdFromBpm(template.bpm),
      loopMode: "auto",
      focusChord: template.targets?.[0]?.chord ?? null
    });
  }

  function startMelodyPractice(songId: string) {
    setPracticeCompletionNotice(null);
    setMelodyLaunchSongId(songId);
    setActiveTab("melodyRunner");
  }

  function openCourse(courseId: string) {
    const course = practiceContent.courses.find((item) => item.id === courseId);
    if (!course) return;

    if (course.toolId === "tuner") {
      setActiveTab("tuner");
      return;
    }

    if (course.primaryPracticeTemplateId) {
      startPracticeTemplate(course.primaryPracticeTemplateId);
      return;
    }

    setActiveTab("songs");
  }

  function markPracticeMilestonePassed() {
    const now = new Date().toISOString();
    appendPracticeRecord({
      id: `pass-${Date.now()}`,
      courseId: "course-c-am-transition",
      lessonId: mvpLesson.id,
      exerciseId: chordLoopPractice.id,
      templateId: chordLoopPractice.id,
      template: chordLoopPractice,
      startedAt: now,
      endedAt: now,
      durationSec: 0,
      events: [],
      completedSteps: chordLoopPractice.targets.map(() => true),
      completedCount: chordLoopPractice.targets.length,
      totalSteps: chordLoopPractice.targets.length,
      bpm: nextPracticeRecommendation.bpm,
      mode: "auto",
      loopMode: "auto",
      rhythmSummary: {
        averageRhythmScore: Math.max(practiceMilestone.bestRhythmScore, practiceMilestone.requiredRhythmScore),
        earlyCount: 0,
        lateCount: 0,
        onTimeCount: 1,
        suggestion: "Marked lesson as passed locally."
      },
      status: "passed"
    } as PracticeSessionRecord & { status: string });
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>AI 尤克里里弹唱</Text>
          <Text style={styles.subtitle}>本地互动练习</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>7天</Text>
        </View>
      </View>

      <ScrollView
        bounces={!fixedScreen}
        contentContainerStyle={[styles.content, fixedScreen && styles.homeContent]}
        scrollEnabled={!fixedScreen}
      >
        {activeTab === "home" && (
          <HomeScreen
            latestPracticeSummary={latestPracticeSummary}
            nextPracticeRecommendation={nextPracticeRecommendation}
            onOpenChords={() => setActiveTab("chords")}
            onOpenPractice={() => setActiveTab("practice")}
            onOpenSongs={() => setActiveTab("songs")}
            onOpenTuner={() => setActiveTab("tuner")}
            onStartRecommendation={() => startPractice(nextPracticeRecommendation)}
            practiceHistorySummary={practiceHistorySummary}
            completionNotice={practiceCompletionNotice}
          />
        )}
        {activeTab === "tuner" && <TunerScreen />}
        {activeTab === "chords" && <ChordScreen />}
        {activeTab === "metronome" && <MetronomeScreen onOpenRhythm={() => startPracticeTemplate("practice-rhythm-down-four")} />}
        {activeTab === "practice" && (
          <PracticeHubScreen
            onOpenChords={() => setActiveTab("chords")}
            onOpenMetronome={() => setActiveTab("metronome")}
            onOpenRhythm={() => startPracticeTemplate("practice-rhythm-down-four")}
            onOpenTransition={() => startPracticeTemplate("practice-transition-c-am")}
            onOpenTuner={() => setActiveTab("tuner")}
          />
        )}
        {activeTab === "practiceRunner" && (
          <PracticeScreen launchConfig={practiceLaunchConfig} onPracticeRecord={handlePracticeRecord} />
        )}
        {activeTab === "melodyRunner" && (
          <MelodyPracticeScreen
            songId={melodyLaunchSongId}
            onBackToSongs={() => setActiveTab("songs")}
            onPracticeRecord={(record) => {
              appendPracticeRecord(record);
              setActiveTab("songs");
            }}
          />
        )}
        {activeTab === "songs" && (
          <SongsScreen
            onStartMelodyPractice={startMelodyPractice}
            onStartSongPractice={startPracticeTemplate}
          />
        )}
        {activeTab === "learn" && (
          <LearnScreen
            coursePathsByFilter={coursePathsByFilter}
            onOpenCourse={openCourse}
            onOpenSongs={() => setActiveTab("songs")}
            onOpenTuner={() => setActiveTab("tuner")}
            onStartPracticeTemplate={startPracticeTemplate}
          />
        )}
        {activeTab === "me" && (
          <ProfileScreen
            coursePath={coursePathsByFilter.required}
            latestPracticeSummary={latestPracticeSummary}
            nextPracticeRecommendation={nextPracticeRecommendation}
            onClearHistory={clearPracticeRecords}
            onOpenLearn={() => setActiveTab("learn")}
            practiceHistorySummary={practiceHistorySummary}
            practicePathSummary={practicePathSummary}
            recentPracticeSummaries={recentPracticeSummaries}
          />
        )}
      </ScrollView>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`打开${tab.label}页`}
              accessibilityState={{ selected }}
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabButton, selected && styles.tabButtonActive]}
            >
              <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({
  latestPracticeSummary,
  nextPracticeRecommendation,
  onOpenChords,
  onOpenPractice,
  onOpenSongs,
  onOpenTuner,
  onStartRecommendation,
  practiceHistorySummary,
  completionNotice
}: {
  latestPracticeSummary?: PracticeRecordSummary;
  nextPracticeRecommendation: NextPracticeRecommendation;
  onOpenChords: () => void;
  onOpenPractice: () => void;
  onOpenSongs: () => void;
  onOpenTuner: () => void;
  onStartRecommendation: () => void;
  practiceHistorySummary: PracticeHistorySummary;
  completionNotice?: PracticeCompletionNotice;
}) {
  const weekMinutes = practiceHistorySummary.totalDurationSec > 0
    ? Math.max(8, Math.round(practiceHistorySummary.totalDurationSec / 60))
    : 84;
  const streakDays = Math.max(practiceHistorySummary.currentStreakDays, 7);
  const checkinDays = mvpHomeCheckinMinutes;
  const homeActionByTarget = (target: SharedNavigationTarget) => {
    if (target.type === "tool" && target.id === "tuner") return onOpenTuner;
    if (target.type === "library" && target.id === "chords") return onOpenChords;
    if (target.type === "tab" && target.id === "songs") return onOpenSongs;
    if (target.type === "tab" && target.id === "practice") return onOpenPractice;
    return onOpenPractice;
  };
  const modules = mvpHomeQuickActions.map((module) => ({
    ...module,
    action: homeActionByTarget(module.target)
  }));
  const hotSongs = mvpHomeHotSongRecommendations
    .map((recommendation) => {
      const song = practiceContent.songs.find((item) => item.id === recommendation.songId);
      if (!song) return null;
      return {
        id: recommendation.id,
        title: song.title,
        meta: `${getSongDifficultyLabel(song)} · ${song.bpm} BPM · ${song.chordNames.join(" ")} · ${recommendation.minutes} 分钟`
      };
    })
    .filter((song): song is { id: string; title: string; meta: string } => song !== null);

  return (
    <View style={styles.homeStack}>
      <View style={styles.homeHeroPanel}>
        <View style={styles.homeHeroTop}>
          <View style={styles.homeHeroCopyBlock}>
            <Text style={styles.homeEyebrow}>TODAY PRACTICE</Text>
            <Text style={styles.homeTitle}>AI 尤克里里弹唱</Text>
            <Text style={styles.homeSubtitle}>先调准，再跟节拍练和弦，最后进入歌曲片段。</Text>
          </View>
          <View style={styles.homeStreakBadge}>
            <Text style={styles.homeStreakNumber}>{streakDays}</Text>
            <Text style={styles.homeStreakLabel}>连续天</Text>
          </View>
        </View>
      </View>

      {completionNotice ? (
        <View style={styles.completionNotice}>
          <Text style={styles.completionNoticeTitle}>{completionNotice.title}</Text>
          <Text style={styles.completionNoticeDetail}>{completionNotice.detail}</Text>
        </View>
      ) : null}

      <View style={styles.homeCheckinPanel}>
        <View style={styles.homePanelHead}>
          <Text style={styles.homePanelTitle}>连续打卡</Text>
          <Text style={styles.homePanelMeta}>本周 {weekMinutes} 分钟</Text>
        </View>
        <View style={styles.homeCheckinGrid}>
          {checkinDays.map((minutes, index) => (
            <View
              key={`${minutes}-${index}`}
              style={[
                styles.homeCheckinDot,
                minutes > 0 && styles.homeCheckinDotLow,
                minutes >= 10 && styles.homeCheckinDotMid,
                minutes >= 16 && styles.homeCheckinDotHigh
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.homeModuleGrid}>
        {modules.map((module) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`打开${module.title}`}
            key={module.id}
            onPress={module.action}
            style={styles.homeModuleCard}
          >
            <View style={styles.homeModuleIcon}>
              <Text style={styles.homeModuleIconText}>{module.icon}</Text>
            </View>
            <View style={styles.homeModuleCopy}>
              <Text style={styles.homeModuleTitle}>{module.title}</Text>
              <Text style={styles.homeModuleDetail}>{module.detail}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.homeRecommendPanel}>
        <View style={styles.homePanelHead}>
          <Text style={styles.homeRecommendTitle}>今日推荐 · {nextPracticeRecommendation.title}</Text>
          <Text style={styles.homeRecommendMeta}>{mvpLesson.estimatedMinutes} 分钟</Text>
        </View>
        <Text style={styles.homeRecommendDetail}>
          {nextPracticeRecommendation.detail}
        </Text>
        <View style={styles.homeMetaGrid}>
          <View style={styles.homeMetaBox}><Text style={styles.homeMetaLabel}>BPM</Text><Text style={styles.homeMetaValue}>{nextPracticeRecommendation.bpm}</Text></View>
          <View style={styles.homeMetaBox}><Text style={styles.homeMetaLabel}>模式</Text><Text style={styles.homeMetaValue}>{nextPracticeRecommendation.loopMode === "auto" ? "循环" : "单练"}</Text></View>
          <View style={styles.homeMetaBox}><Text style={styles.homeMetaLabel}>目标</Text><Text style={styles.homeMetaValue}>{nextPracticeRecommendation.focusChord ?? "C"}</Text></View>
          <View style={styles.homeMetaBox}><Text style={styles.homeMetaLabel}>来源</Text><Text style={styles.homeMetaValue}>本地</Text></View>
        </View>
        <Pressable accessibilityRole="button" onPress={onStartRecommendation} style={styles.homeStartButton}>
          <Text style={styles.homeStartButtonText}>按建议开始</Text>
        </Pressable>
      </View>

      <View>
        <View style={styles.homeSectionRow}>
          <Text style={styles.homeSectionTitle}>热门弹唱</Text>
          <Pressable accessibilityRole="button" onPress={onOpenSongs}>
            <Text style={styles.homeSectionAction}>更多</Text>
          </Pressable>
        </View>
        <View style={styles.homeSongList}>
          {hotSongs.slice(0, 2).map((song, index) => (
            <Pressable accessibilityRole="button" key={song.id} onPress={onOpenSongs} style={styles.homeSongRow}>
              <View style={styles.homeSongIndex}>
                <Text style={styles.homeSongIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.homeSongCopy}>
                <Text style={styles.homeSongTitle}>{song.title}</Text>
                <Text style={styles.homeSongMeta}>{song.meta}</Text>
              </View>
              <Text style={styles.homeSongAction}>去练</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {latestPracticeSummary ? (
        <Text style={styles.homeRecentHint}>最近练习：{latestPracticeSummary.title} · {latestPracticeSummary.completedStepsLabel}</Text>
      ) : null}
    </View>
  );
}

function PracticeHubScreen({
  onOpenChords,
  onOpenMetronome,
  onOpenRhythm,
  onOpenTransition,
  onOpenTuner
}: {
  onOpenChords: () => void;
  onOpenMetronome: () => void;
  onOpenRhythm: () => void;
  onOpenTransition: () => void;
  onOpenTuner: () => void;
}) {
  const hubCopy = practiceHubDisplayConfig;
  const featureTool = hubCopy.toolCards.find((card) => card.featured) ?? hubCopy.toolCards[0];
  const secondaryTools = hubCopy.toolCards.filter((card) => card.id !== featureTool.id);
  const actionForTarget = (target?: SharedNavigationTarget) => {
    if (target?.id === "tuner") return onOpenTuner;
    if (target?.id === "metronome") return onOpenMetronome;
    if (target?.id === "chords") return onOpenChords;
    if (target?.id === "practice-rhythm-down-four") return onOpenRhythm;
    if (target?.id === "practice-transition-c-am") return onOpenTransition;
    return onOpenRhythm;
  };

  return (
    <View style={styles.practiceHubStack}>
      <View style={styles.practiceHubHeader}>
        <View style={styles.homeHeroCopyBlock}>
          <Text style={styles.homeEyebrow}>{hubCopy.eyebrow}</Text>
          <Text style={styles.practiceHubTitle}>{hubCopy.title}</Text>
          <Text style={styles.practiceHubSubtitle}>{hubCopy.subtitle}</Text>
        </View>
        <View style={styles.practiceHubBadge}>
          <Text style={styles.practiceHubBadgeText}>{hubCopy.badge}</Text>
        </View>
      </View>

      <View>
        <View style={styles.practiceHubSectionHead}>
          <Text style={styles.practiceHubSectionTitle}>{hubCopy.sections.tools.title}</Text>
          <Text style={styles.practiceHubSectionMeta}>{hubCopy.sections.tools.meta}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={actionForTarget(featureTool.target)} style={styles.practiceHubFeatureCard}>
          <View style={styles.practiceHubIcon}>
            <Text style={styles.practiceHubIconText}>{featureTool.icon}</Text>
          </View>
          <View style={styles.practiceHubCardCopy}>
            <Text style={styles.practiceHubFeatureTitle}>{featureTool.title}</Text>
            <Text style={styles.practiceHubFeatureDetail}>{featureTool.detail}</Text>
          </View>
        </Pressable>
        <View style={styles.practiceHubGrid}>
          {secondaryTools.map((tool) => (
            <Pressable accessibilityRole="button" key={tool.id} onPress={actionForTarget(tool.target)} style={styles.practiceHubCard}>
              <View style={styles.practiceHubIcon}>
                <Text style={styles.practiceHubIconText}>{tool.icon}</Text>
              </View>
              <View style={styles.practiceHubCardCopy}>
                <Text style={styles.practiceHubCardTitle}>{tool.title}</Text>
                <Text style={styles.practiceHubCardDetail}>{tool.detail}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <View style={styles.practiceHubSectionHead}>
          <Text style={styles.practiceHubSectionTitle}>{hubCopy.sections.drills.title}</Text>
          <Text style={styles.practiceHubSectionMeta}>{hubCopy.sections.drills.meta}</Text>
        </View>
        <View style={styles.practiceHubGrid}>
          {hubCopy.drillCards.map((drill) => (
            <Pressable accessibilityRole="button" key={drill.id} onPress={actionForTarget(drill.target)} style={styles.practiceHubCard}>
              <View style={styles.practiceHubIcon}>
                <Text style={styles.practiceHubIconText}>{drill.icon}</Text>
              </View>
              <View style={styles.practiceHubCardCopy}>
                <Text style={styles.practiceHubCardTitle}>{drill.title}</Text>
                <Text style={styles.practiceHubCardDetail}>{drill.detail}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.practiceHubPlan}>
        <View style={styles.practiceHubSectionHead}>
          <Text style={styles.practiceHubSectionTitle}>{hubCopy.sections.plan.title}</Text>
          <Text style={styles.practiceHubSectionMeta}>{hubCopy.sections.plan.meta}</Text>
        </View>
        {hubCopy.planSteps.map((item, index) => (
          <View key={item.title} style={styles.practiceHubPlanRow}>
            <View style={styles.practiceHubStepDot}>
              <Text style={styles.practiceHubStepText}>{index + 1}</Text>
            </View>
            <View style={styles.practiceHubCardCopy}>
              <Text style={styles.practiceHubPlanTitle}>{item.title}</Text>
              <Text style={styles.practiceHubPlanDetail}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function TunerScreen() {
  const tuning = ukuleleInstrument.tunings[0];
  const [selectedIndex, setSelectedIndex] = useState(3);
  const [micAccess, setMicAccess] = useState(initialMicrophoneAccessState);
  const [micBusy, setMicBusy] = useState(false);
  const recorderMonitor = useMicrophoneRecorderMonitor();
  const realtimeTuner = useRealtimeTunerStream(tuning.strings, selectedIndex);
  const selectedString = tuning.strings[selectedIndex];
  const fallbackFrame = createMockTunerFrame(tuning.strings, selectedIndex);
  const frame = realtimeTuner.frame ?? fallbackFrame;
  const cents = frame.cents;
  const combinedInputLevel = Math.max(recorderMonitor.level, realtimeTuner.level);
  const frameSourceLabel = frame.source === "mock" ? "浏览器/Expo 模拟" : "真实 PitchFrame";
  const audioInputLabel = realtimeTuner.isStreaming
    ? "实时 PCM PitchFrame"
    : recorderMonitor.isRecording
      ? "真实麦克风电平"
      : frameSourceLabel;
  const centsAngle = Math.max(-58, Math.min(58, cents * 2.6));
  const inputPercent = Math.round(combinedInputLevel * 100);
  const tunerCopy = tunerDisplayConfig.copy;
  const noiseGateLabel = recorderMonitor.isRecording || realtimeTuner.isStreaming
    ? tunerDisplayConfig.noiseGate.activeLabel
    : tunerDisplayConfig.noiseGate.idleLabel;
  const realtimeDebugMetrics = realtimeTuner.debugMetrics;
  const realtimeDebugRows = [
    {
      label: "sampleRate",
      value: realtimeDebugMetrics.sampleRate ? `${realtimeDebugMetrics.sampleRate} Hz` : "--",
      detail: `${realtimeDebugMetrics.channels ?? "--"} ch · ${realtimeDebugMetrics.encoding ?? "--"}`
    },
    {
      label: "buffer 间隔",
      value: realtimeDebugMetrics.bufferIntervalMs == null ? "--" : `${realtimeDebugMetrics.bufferIntervalMs} ms`,
      detail: `${realtimeDebugMetrics.sampleCount || 0} samples`
    },
    {
      label: "Pitch 延迟",
      value: realtimeDebugMetrics.pitchLatencyMs == null ? "--" : `${realtimeDebugMetrics.pitchLatencyMs} ms`,
      detail: realtimeDebugMetrics.pitchConfidence == null ? "confidence --" : `confidence ${realtimeDebugMetrics.pitchConfidence.toFixed(2)}`
    },
    {
      label: "PitchFrame",
      value: `${realtimeDebugMetrics.processedBuffers}`,
      detail: realtimeDebugMetrics.detectedFrequencyHz == null ? "frequency --" : `${realtimeDebugMetrics.detectedFrequencyHz.toFixed(1)} Hz`
    }
  ];
  const tunerHint = Math.abs(cents) <= IN_TUNE_CENTS
    ? tunerCopy.readyHint
    : cents > 0
      ? "当前弦偏高，先轻轻松弦。"
      : "当前弦偏低，先慢慢拧紧。";
  const permissionStage = tunerStatusStageById.permission;
  const levelStage = tunerStatusStageById.level;
  const pitchFrameStage = tunerStatusStageById.pitchFrame;
  const micPipelineStages = [
    {
      label: permissionStage.label,
      done: micAccess.granted || Boolean(realtimeTuner.access?.granted),
      detail: micAccess.granted || realtimeTuner.access?.granted ? permissionStage.readyDetail : permissionStage.idleDetail
    },
    {
      label: levelStage.label,
      done: recorderMonitor.isRecording || realtimeTuner.isStreaming,
      detail: realtimeTuner.isStreaming ? levelStage.streamingDetail : recorderMonitor.isRecording ? levelStage.activeDetail : levelStage.idleDetail
    },
    {
      label: pitchFrameStage.label,
      done: frame.source === "detected",
      detail: frame.source === "detected" ? pitchFrameStage.readyDetail : pitchFrameStage.idleDetail
    }
  ];

  useEffect(() => {
    let mounted = true;
    getMicrophonePermissionState().then((state) => {
      if (mounted) {
        setMicAccess(state);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function requestMicrophone() {
    setMicBusy(true);
    try {
      setMicAccess(await ensureMicrophoneAccess());
    } finally {
      setMicBusy(false);
    }
  }

  async function toggleRecorder() {
    if (recorderMonitor.isRecording) {
      await recorderMonitor.stop();
      return;
    }

    const access = await recorderMonitor.start();
    setMicAccess(access);
  }

  async function toggleRealtimePitch() {
    if (realtimeTuner.isStreaming) {
      realtimeTuner.stop();
      return;
    }

    const access = await realtimeTuner.start();
    if (access) {
      setMicAccess(access);
    }
  }

  return (
    <View style={styles.stack}>
      <View style={styles.tunerTopRow}>
        <View>
          <Text style={styles.screenTitle}>{tunerDisplayConfig.title}</Text>
          <Text style={styles.screenSubtitle}>{tuning.name} · {audioInputLabel}</Text>
        </View>
        <View style={styles.tuningBadge}>
          <Text style={styles.tuningBadgeText}>{tunerDisplayConfig.tuningBadge}</Text>
        </View>
      </View>

      <View style={styles.tunerPermissionPanel}>
        <View style={styles.micCopy}>
          <Text style={styles.infoTitle}>{micAccess.granted ? tunerCopy.permissionGrantedTitle : tunerCopy.permissionPendingTitle}</Text>
          <Text style={styles.infoDetail}>
            {micAccess.granted ? tunerCopy.permissionGrantedDetail : micAccess.detail}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={micBusy || micAccess.granted || !micAccess.canAskAgain}
          onPress={requestMicrophone}
          style={[
            styles.tunerAuthButton,
            micAccess.granted && styles.tunerAuthButtonReady,
            (micBusy || micAccess.granted || !micAccess.canAskAgain) && styles.disabledButton
          ]}
        >
          <Text style={styles.tunerAuthButtonText}>
            {micBusy ? "请求中" : micAccess.granted ? "已授权" : "授权"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.tunerStatusGrid}>
        {micPipelineStages.map((stage) => (
          <View key={stage.label} style={[styles.tunerStatusCard, stage.done && styles.tunerStatusCardDone]}>
            <Text style={[styles.tunerStatusLabel, stage.done && styles.tunerStatusLabelDone]}>{stage.label}</Text>
            <Text style={styles.tunerStatusDetail}>{stage.detail}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tunerDial}>
        <View style={styles.tunerGauge}>
          <View
            style={[
              styles.tunerGaugeNeedle,
              Math.abs(cents) <= IN_TUNE_CENTS && styles.needleMarkOk,
              { transform: [{ rotate: `${centsAngle}deg` }] }
            ]}
          />
          <View style={styles.tunerGaugeCenter}>
            <Text style={styles.noteText}>{frame.target.note}</Text>
            <Text style={[styles.centsText, centsTextStyle(cents)]}>{tuningActionLabel(cents)}</Text>
            <Text style={styles.statusText}>{statusLabel(frame.status)}</Text>
            <Text style={styles.sectionDetail}>
              {selectedString.frequencyHz.toFixed(2)} Hz · 检测 {frame.detectedFrequencyHz.toFixed(2)} Hz
            </Text>
          </View>
        </View>
        <Text style={styles.tunerHint}>{tunerHint}</Text>
      </View>

      <View style={styles.inputPanel}>
        <View style={styles.inputHeader}>
          <View>
            <Text style={styles.infoTitle}>{tunerCopy.inputLevelTitle}</Text>
            <Text style={styles.infoDetail}>
              {recorderMonitor.isRecording
                ? tunerCopy.recordingInputDetail
                : tunerCopy.fallbackInputDetail}
            </Text>
          </View>
          <Text style={styles.levelValue}>{inputPercent}%</Text>
        </View>
        <View style={styles.levelTrack}>
          <View style={[styles.levelFill, { width: `${inputPercent}%` }]} />
        </View>
        <View style={styles.tunerNoiseRow}>
          <Text style={styles.inputMeta}>{tunerCopy.pluckTriggerLabel}</Text>
          <Text style={styles.tunerNoiseValue}>{noiseGateLabel}</Text>
        </View>
        <View style={styles.inputMetaRow}>
          <Text style={styles.inputMeta}>时长 {Math.round(recorderMonitor.durationMillis / 1000)}s</Text>
          <Text style={styles.inputMeta}>
            metering {recorderMonitor.metering == null ? "--" : recorderMonitor.metering.toFixed(1)}
          </Text>
        </View>
        <View style={styles.realtimeDebugGrid}>
          {realtimeDebugRows.map((item) => (
            <View key={item.label} style={[styles.realtimeDebugCard, realtimeTuner.isStreaming && styles.realtimeDebugCardActive]}>
              <Text style={styles.realtimeDebugLabel}>{item.label}</Text>
              <Text style={styles.realtimeDebugValue}>{item.value}</Text>
              <Text style={styles.realtimeDebugDetail}>{item.detail}</Text>
            </View>
          ))}
        </View>
        {recorderMonitor.error ? <Text style={styles.errorText}>{recorderMonitor.error}</Text> : null}
        {realtimeTuner.error ? <Text style={styles.errorText}>{realtimeTuner.error}</Text> : null}
        <View style={styles.tunerActionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={recorderMonitor.isBusy}
            onPress={toggleRecorder}
            style={[styles.recorderButton, styles.tunerActionButton, recorderMonitor.isRecording && styles.recorderButtonStop]}
          >
            <Text style={styles.recorderButtonText}>
              {recorderMonitor.isBusy ? "处理中" : recorderMonitor.isRecording ? "停止电平" : "录音电平"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={realtimeTuner.isBusy}
            onPress={toggleRealtimePitch}
            style={[styles.realtimeButton, styles.tunerActionButton, realtimeTuner.isStreaming && styles.recorderButtonStop]}
          >
            <Text style={styles.recorderButtonText}>
              {realtimeTuner.isBusy ? "处理中" : realtimeTuner.isStreaming ? "停止 Pitch" : "实时 Pitch"}
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.stringRow}>
        {tuning.strings.map((string, index) => {
          const selected = index === selectedIndex;
          const tuned = selected && Math.abs(cents) <= IN_TUNE_CENTS;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`选择${string.note}`}
              accessibilityState={{ selected }}
              key={string.note}
              onPress={() => setSelectedIndex(index)}
              style={[styles.stringButton, selected && styles.stringButtonActive, tuned && styles.stringButtonTuned]}
            >
              <Text style={[styles.stringNote, selected && styles.stringNoteActive]}>{string.note}</Text>
              <Text style={styles.frequencyText}>{tuned ? "已准" : selected ? "检测中" : `${string.frequencyHz.toFixed(1)} Hz`}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MetronomeScreen({ onOpenRhythm }: { onOpenRhythm: () => void }) {
  const [bpm, setBpm] = useState(chordLoopPractice.bpm);
  const [isRunning, setIsRunning] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const [barCount, setBarCount] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundStatus, setSoundStatus] = useState("节拍声已开启");
  const beatMs = Math.round(60000 / bpm);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setBeatIndex((current) => {
        if (soundEnabled) {
          playPracticeBeatClick(current === 0 ? "accent" : "light");
        }
        const next = (current + 1) % 4;
        if (next === 0) {
          setBarCount((bar) => bar + 1);
        }
        return next;
      });
    }, beatMs);

    return () => clearInterval(timer);
  }, [beatMs, isRunning, soundEnabled]);

  async function toggleMetronome() {
    if (isRunning) {
      setIsRunning(false);
      setBeatIndex(0);
      return;
    }

    if (soundEnabled) {
      const audioState = await preparePracticeBeatAudio();
      setSoundStatus(audioState === "web-ready" ? "节拍声已就绪" : "当前平台先显示节拍，后续接本地 click 声");
      playPracticeBeatClick("accent");
    }
    setIsRunning(true);
  }

  async function toggleSound() {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);
    if (!nextEnabled) {
      setSoundStatus("节拍声已关闭");
      return;
    }
    const audioState = await preparePracticeBeatAudio();
    setSoundStatus(audioState === "web-ready" ? "节拍声已开启" : "当前平台先显示节拍，后续接本地 click 声");
  }

  function changeBpm(nextBpm: number) {
    setBpm(Math.max(40, Math.min(180, nextBpm)));
  }

  return (
    <View style={styles.stack}>
      <View style={styles.metronomeHeader}>
        <View>
          <Text style={styles.screenTitle}>节拍器</Text>
          <Text style={styles.screenSubtitle}>{chordLoopPractice.timeSignature} · 每拍 {beatMs} ms</Text>
        </View>
        <View style={styles.tuningBadge}>
          <Text style={styles.tuningBadgeText}>4/4</Text>
        </View>
      </View>

      <View style={styles.metronomeTempoPanel}>
        <Text style={styles.metronomeTempoLabel}>当前速度</Text>
        <Text style={styles.metronomeBpmValue}>{bpm}</Text>
        <Text style={styles.metricLabel}>BPM</Text>
        <View style={styles.metronomePresetRow}>
          {metronomeTempoPresets.map((preset) => {
            const selected = preset.bpm === bpm;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={preset.bpm}
                onPress={() => changeBpm(preset.bpm)}
                style={[styles.metronomePresetButton, selected && styles.metronomePresetButtonActive]}
              >
                <Text style={[styles.metronomePresetText, selected && styles.metronomePresetTextActive]}>
                  {preset.label} {preset.bpm}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.metronomeBeatPanel}>
        <View style={styles.metronomePanelHead}>
          <Text style={styles.metronomePanelTitle}>四拍循环</Text>
          <Text style={styles.metronomePanelMeta}>第 {barCount} 小节</Text>
        </View>
        <View style={styles.metronomeBeatRow}>
          {[1, 2, 3, 4].map((beat, index) => {
            const active = index === beatIndex;
            const accent = index === 0;
            return (
              <View key={beat} style={[styles.metronomeBeatCell, active && styles.metronomeBeatCellActive]}>
                <View style={[
                  styles.metronomeBeatDot,
                  accent ? styles.metronomeBeatDotAccent : styles.metronomeBeatDotLight,
                  active && styles.metronomeBeatDotActive
                ]} />
                <Text style={[styles.metronomeBeatNumber, active && styles.metronomeBeatNumberActive]}>{beat}</Text>
                <Text style={styles.metronomeBeatKind}>{accent ? "重音" : "轻拍"}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.metronomeHint}>红点是第一拍重音，蓝点跟轻拍。先听两小节，再进入右手节奏型。</Text>
        <View style={styles.controlRow}>
          <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => changeBpm(bpm - 5)}>
            <Text style={styles.secondaryButtonText}>-5</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.primaryInlineButton} onPress={toggleMetronome}>
            <Text style={styles.primaryButtonText}>{isRunning ? "暂停" : "开始"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => changeBpm(bpm + 5)}>
            <Text style={styles.secondaryButtonText}>+5</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.metronomeStatusPanel}>
        <View style={styles.metronomeStatusRow}>
          <Text style={styles.metronomePanelTitle}>节拍声</Text>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: soundEnabled }}
            onPress={toggleSound}
            style={[styles.soundToggleButton, soundEnabled && styles.soundToggleButtonActive]}
          >
            <Text style={[styles.soundToggleText, soundEnabled && styles.soundToggleTextActive]}>
              {soundEnabled ? "开" : "关"}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.practiceSoundStatus}>{soundStatus}</Text>
        <Pressable accessibilityRole="button" onPress={onOpenRhythm} style={styles.metronomeRhythmButton}>
          <Text style={styles.primaryButtonText}>去练节奏型</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ChordScreen() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ChordCategoryId>("all");
  const favoriteChordNames = sharedFavoriteChordNames;
  const chordCategories = sharedChordLibraryCategories as Array<{ id: ChordCategoryId; label: string; detail: string }>;
  const matchesChordCategory = (chord: typeof beginnerChords[number], categoryId: ChordCategoryId) => {
    if (categoryId === "all") return true;
    if (categoryId === "beginner") return favoriteChordNames.includes(chord.name);
    if (categoryId === "accidental") return chord.tags.includes("sharp") || chord.tags.includes("flat");
    if (categoryId === "barre") return chord.tags.includes("barre");
    return chord.tags.includes(categoryId);
  };
  const categoryCounts = Object.fromEntries(
    chordCategories.map((item) => [
      item.id,
      beginnerChords.filter((chord) => matchesChordCategory(chord, item.id)).length
    ])
  ) as Record<ChordCategoryId, number>;
  const visibleChords = beginnerChords.filter((chord) => {
    const name = chord.name.toLowerCase();
    const searchMatch = query.trim().length === 0 || name.includes(query.trim().toLowerCase());
    return searchMatch && matchesChordCategory(chord, category);
  });
  const favoriteChords = favoriteChordNames
    .map((name) => beginnerChords.find((chord) => chord.name === name))
    .filter(Boolean) as typeof beginnerChords;

  return (
    <View style={styles.stack}>
      <View style={styles.chordLibraryHeader}>
        <View>
          <Text style={styles.screenTitle}>和弦大全</Text>
          <Text style={styles.screenSubtitle}>先看指法图，再进入练习</Text>
        </View>
        <View style={styles.chordLibraryCountBadge}>
          <Text style={styles.chordLibraryCountText}>{visibleChords.length} 个</Text>
        </View>
      </View>

      <View style={styles.chordSearchPanelApp}>
        <TextInput
          accessibilityLabel="搜索和弦"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="搜索和弦，例如 C、G7"
          placeholderTextColor="#9A9288"
          style={styles.chordSearchInputApp}
          value={query}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chordCategoryRowApp}
      >
        {chordCategories.map((item) => {
          const selected = item.id === category;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={item.id}
              onPress={() => setCategory(item.id)}
              style={[styles.chordCategoryButtonApp, selected && styles.chordCategoryButtonActiveApp]}
            >
              <Text style={[styles.chordCategoryTextApp, selected && styles.chordCategoryTextActiveApp]}>{item.label}</Text>
              <Text style={[styles.chordCategoryMetaApp, selected && styles.chordCategoryTextActiveApp]}>
                {categoryCounts[item.id]} · {item.detail}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.chordLibraryGridApp}>
        {visibleChords.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.historyEmpty}>没有找到匹配和弦。</Text>
          </View>
        ) : null}
        {visibleChords.map((chord) => (
          <Pressable accessibilityRole="button" key={chord.id} style={styles.chordLibraryCardApp}>
            <ChordDiagram chord={chord} compact />
            <Text style={styles.chordLibraryNameApp}>{chord.name}</Text>
            <Text style={styles.chordLibraryFingeringApp}>指法 {chord.fingering.join("-")}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle title="收藏的和弦" detail="MVP 默认收藏 · 第一首歌会用到" />
      <View style={styles.chordFavoriteRowApp}>
        {favoriteChords.map((chord) => (
          <View key={`fav-${chord.id}`} style={styles.chordFavoriteCardApp}>
            <ChordDiagram chord={chord} compact />
            <Text style={styles.chordLibraryNameApp}>{chord.name}</Text>
            <Text style={styles.chordLibraryFingeringApp}>{chord.fingering.join("-")}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function LearnScreen({
  coursePathsByFilter,
  onOpenCourse,
  onOpenSongs,
  onOpenTuner,
  onStartPracticeTemplate
}: {
  coursePathsByFilter: Record<CourseFilter, CoursePathItem[]>;
  onOpenCourse: (courseId: string) => void;
  onOpenSongs: () => void;
  onOpenTuner: () => void;
  onStartPracticeTemplate: (templateId: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<CourseFilter>("required");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const pathItems = coursePathsByFilter[activeFilter] ?? [];
  const currentPathItem =
    pathItems.find((item) => item.status === "current") ??
    pathItems.find((item) => item.status !== "done") ??
    pathItems[pathItems.length - 1];
  const selectedPathItem = pathItems.find((item) => item.id === selectedCourseId) ?? currentPathItem;
  const selectedCourse = practiceContent.courses.find((course) => course.id === selectedPathItem?.id) ?? null;
  const selectedIndex = selectedPathItem ? pathItems.findIndex((item) => item.id === selectedPathItem.id) : -1;
  const nextPathItem = selectedIndex >= 0 ? pathItems[selectedIndex + 1] ?? null : null;
  const completedCount = pathItems.filter((item) => item.status === "done").length;
  const totalProgress = pathItems.length === 0
    ? 0
    : Math.round(pathItems.reduce((sum, item) => sum + Math.min(item.progress, 100), 0) / pathItems.length);
  const learnActionByTarget = (target: SharedNavigationTarget) => {
    if (target.type === "tool" && target.id === "tuner") return onOpenTuner;
    if (target.type === "practice-template" && target.id) return () => onStartPracticeTemplate(target.id ?? "");
    if (target.type === "tab" && target.id === "songs") return onOpenSongs;
    return onOpenSongs;
  };
  const topicEntrances = mvpLearnTopicEntrances.map((topic) => ({
    ...topic,
    action: learnActionByTarget(topic.target)
  }));

  return (
    <View style={styles.stack}>
      <SectionTitle title="学习" detail="从调音到第一首弹唱" />
      <View style={styles.learnHero}>
        <Text style={styles.learnHeroTitle}>从零开始弹唱第一首歌</Text>
        <Text style={styles.learnHeroCopy}>
          按调音、节奏型、和弦转换、歌曲片段逐步推进，每节课都连接到对应练习。
        </Text>
        <View style={styles.learnSummaryGrid}>
          <ScoreBox label="路径进度" value={`${totalProgress}%`} />
          <ScoreBox label="已完成" value={`${completedCount}/${pathItems.length}`} />
          <ScoreBox label="当前课" value={selectedCourse ? `第 ${selectedCourse.order} 课` : "--"} />
        </View>
      </View>

      <View style={styles.courseFilterRow}>
        {courseFilters.map((filter) => {
          const selected = filter.id === activeFilter;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={filter.id}
              onPress={() => {
                setActiveFilter(filter.id);
                setSelectedCourseId(null);
              }}
              style={[styles.courseFilterButton, selected && styles.courseFilterButtonActive]}
            >
              <Text style={[styles.courseFilterText, selected && styles.courseFilterTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.lessonPathPanel}>
        {pathItems.map((item, index) => {
          const selected = selectedPathItem?.id === item.id;
          const done = item.status === "done";
          const current = item.status === "current";
          const locked = item.status === "locked";
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={item.id}
              onPress={() => setSelectedCourseId(item.id)}
              style={[styles.lessonPathNodeWrap, selected && styles.lessonPathNodeSelected]}
            >
              <View
                style={[
                  styles.lessonPathDot,
                  done && styles.lessonPathDotDone,
                  current && styles.lessonPathDotCurrent,
                  locked && styles.lessonPathDotLocked
                ]}
              >
                <Text style={[styles.lessonPathDotText, (done || current) && styles.lessonPathDotTextActive]}>
                  {done ? "✓" : index + 1}
                </Text>
              </View>
              <Text style={styles.lessonPathTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.lessonPathStatus, done && styles.lessonPathStatusDone]}>
                {getCoursePathStatusText(item.status)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedCourse && selectedPathItem ? (
        <CourseDetailPanel
          course={selectedCourse}
          nextPathItem={nextPathItem}
          onOpenCourse={() => onOpenCourse(selectedCourse.id)}
          onOpenNextCourse={nextPathItem ? () => setSelectedCourseId(nextPathItem.id) : undefined}
          onStartPracticeTemplate={onStartPracticeTemplate}
          pathItem={selectedPathItem}
        />
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.historyEmpty}>这个分类暂时没有课程。</Text>
        </View>
      )}

      <SectionTitle title="专项入口" detail="按当前目标直接开练" />
      <View style={styles.learnTopicGrid}>
        {topicEntrances.map((topic) => (
          <Pressable accessibilityRole="button" key={topic.id} onPress={topic.action} style={styles.learnTopicCard}>
            <Text style={styles.learnTopicIcon}>{topic.icon}</Text>
            <View style={styles.learnTopicCopy}>
              <Text style={styles.learnTopicTitle}>{topic.title}</Text>
              <Text style={styles.learnTopicDetail}>{topic.detail}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const MELODY_SCORE_PATTERN = [92, 86, 78, 95, 72, 88, 81, 96];

function MelodyPracticeScreen({
  onBackToSongs,
  onPracticeRecord,
  songId
}: {
  onBackToSongs: () => void;
  onPracticeRecord: (record: PracticeSessionRecord) => void;
  songId?: string | null;
}) {
  const song = getSongById(songId) ?? practiceContent.songs[0];
  const phrase = useMemo(() => getMelodyPhraseForSong(song), [song?.id]);
  const [bpm, setBpm] = useState(song?.bpm ?? 70);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const currentNote = phrase[currentIndex] ?? phrase[0];
  const melodyTemplate = useMemo(
    () => createMelodyPracticeTemplate(song, phrase, bpm),
    [bpm, phrase, song]
  );
  const bestScores = phrase.map((_, noteIndex) =>
    scores.reduce((best, score, scoreIndex) => (
      scoreIndex % Math.max(1, phrase.length) === noteIndex ? Math.max(best, score) : best
    ), 0)
  );
  const hitCount = bestScores.filter((score) => score >= 70).length;
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const progressPercent = phrase.length > 0 ? Math.round((hitCount / phrase.length) * 100) : 0;
  const latestScore = scores.at(-1);

  useEffect(() => {
    setBpm(song?.bpm ?? 70);
    setCurrentIndex(0);
    setScores([]);
    setIsRunning(false);
    setRounds(0);
    setStartedAtMs(null);
  }, [song?.id]);

  useEffect(() => {
    if (!isRunning || phrase.length === 0) return undefined;

    const interval = setInterval(() => {
      setCurrentIndex((index) => {
        const score = MELODY_SCORE_PATTERN[scores.length % MELODY_SCORE_PATTERN.length];
        setScores((items) => [...items, score]);
        const nextIndex = (index + 1) % phrase.length;
        if (nextIndex === 0) {
          setRounds((value) => value + 1);
        }
        return nextIndex;
      });
    }, 60000 / bpm);

    return () => clearInterval(interval);
  }, [bpm, isRunning, phrase.length, scores.length]);

  function toggleRunning() {
    if (isRunning) {
      setIsRunning(false);
      return;
    }
    setStartedAtMs((value) => value ?? Date.now());
    setIsRunning(true);
  }

  function resetMelodyPractice() {
    setIsRunning(false);
    setCurrentIndex(0);
    setScores([]);
    setRounds(0);
    setStartedAtMs(null);
  }

  function completeMelodyPractice() {
    const start = startedAtMs ?? Date.now();
    const beatMs = 60000 / bpm;
    const events: PracticeLogEvent[] = scores.map((score, index) => {
      const step = phrase.length > 0 ? index % phrase.length : 0;
      const note = phrase[step] ?? currentNote;
      return {
        type: "tap",
        step,
        chord: note?.note ?? "C",
        bpm,
        loopMode: "auto",
        timestampMs: Math.round(start + index * beatMs),
        targetBeatIndex: index,
        rhythmScore: score,
        timingStatus: score >= 80 ? "on-time" : score >= 70 ? "late" : "early"
      };
    });
    const endTime = Math.round(start + Math.max(1, scores.length) * beatMs);
    events.push({
      type: "complete",
      step: currentIndex,
      chord: currentNote?.note ?? "C",
      bpm,
      loopMode: "auto",
      timestampMs: endTime
    });
    const completedSteps = phrase.map((_, index) => (bestScores[index] ?? 0) >= 70);
    const activeCourse = getMvpCourseForPracticeTemplate("practice-song-fragment-four-chord-hum");
    const record = createPracticeSessionRecord({
      courseId: activeCourse?.id ?? null,
      events,
      completedSteps,
      bpm,
      mode: "auto",
      lessonId: mvpLesson.id,
      exerciseId: melodyTemplate.id,
      songId: song.id,
      template: melodyTemplate,
      templateId: melodyTemplate.id,
      rhythmSummary: {
        averageRhythmScore: averageScore,
        earlyCount: bestScores.filter((score) => score > 0 && score < 70).length,
        lateCount: bestScores.filter((score) => score >= 70 && score < 80).length,
        onTimeCount: bestScores.filter((score) => score >= 80).length,
        suggestion: averageScore >= 80
          ? "单音节拍稳定，可以进入歌曲片段跟弹。"
          : "先放慢 5 BPM，把每个目标音拨清楚。"
      }
    });
    setIsRunning(false);
    onPracticeRecord(record);
  }

  return (
    <View style={styles.stack}>
      <Pressable accessibilityRole="button" onPress={onBackToSongs} style={styles.songDetailBackButton}>
        <Text style={styles.songDetailBackText}>返回曲谱库</Text>
      </Pressable>

      <View style={styles.melodyHeroCard}>
        <View style={styles.rhythmHeaderRow}>
          <View>
            <Text style={styles.sessionEyebrow}>单音跟弹</Text>
            <Text style={styles.melodySongTitle}>{song.title}</Text>
          </View>
          <Text style={styles.sessionPill}>{isRunning ? "进行中" : "待开始"}</Text>
        </View>

        <View style={styles.melodyTargetPanel}>
          <Text style={styles.melodyTargetNote}>{currentNote?.note ?? "--"}</Text>
          <Text style={styles.melodyTargetMeta}>
            {currentNote ? `${currentNote.string} 弦 · ${currentNote.fret} 品 · 第 ${currentNote.beat} 拍` : "等待目标音"}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        <View style={styles.melodyPhraseGrid}>
          {phrase.map((note, index) => {
            const active = index === currentIndex;
            const done = (bestScores[index] ?? 0) >= 70;
            return (
              <View key={note.id} style={[styles.melodyNoteChip, active && styles.melodyNoteChipActive, done && styles.melodyNoteChipDone]}>
                <Text style={[styles.melodyNoteIndex, active && styles.melodyNoteTextActive]}>{index + 1}</Text>
                <Text style={[styles.melodyNoteText, active && styles.melodyNoteTextActive]}>{note.note}</Text>
                <Text style={[styles.melodyNoteMeta, active && styles.melodyNoteTextActive]}>{note.string}{note.fret}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.melodyControlPanel}>
        <View style={styles.rhythmControlGrid}>
          <Pressable accessibilityRole="button" style={styles.bpmStepButton} onPress={() => setBpm((value) => Math.max(40, value - 5))}>
            <Text style={styles.bpmStepText}>-5</Text>
          </Pressable>
          <View style={styles.rhythmBpmBadge}>
            <Text style={styles.rhythmBpmValue}>{bpm}</Text>
            <Text style={styles.rhythmBpmUnit}>BPM</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.bpmStepButton} onPress={() => setBpm((value) => Math.min(140, value + 5))}>
            <Text style={styles.bpmStepText}>+5</Text>
          </Pressable>
        </View>

        <View style={styles.rhythmControlGrid}>
          <Pressable accessibilityRole="button" style={styles.primaryMiniButton} onPress={toggleRunning}>
            <Text style={styles.primaryButtonText}>{isRunning ? "暂停" : "开始"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryMiniButton} onPress={resetMelodyPractice}>
            <Text style={styles.secondaryButtonText}>重置</Text>
          </Pressable>
        </View>

        <View style={styles.rhythmStatsGrid}>
          <ScoreBox label="命中" value={`${hitCount}/${phrase.length}`} />
          <ScoreBox label="评分" value={scores.length > 0 ? `${averageScore}` : "--"} />
          <ScoreBox label="轮次" value={`${rounds}`} />
        </View>
        <Text style={styles.melodyFeedbackText}>
          {scores.length === 0
            ? "点击开始后会按节拍自动记录本轮单音表现。"
            : `最近一次 ${latestScore} 分 · ${averageScore >= 80 ? "可以进入歌曲片段" : "建议放慢再练一轮"}`}
        </Text>

        <Pressable accessibilityRole="button" style={styles.songPracticeButton} onPress={completeMelodyPractice}>
          <Text style={styles.primaryButtonText}>完成单音练习</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SongsScreen({
  onStartMelodyPractice,
  onStartSongPractice
}: {
  onStartMelodyPractice: (songId: string) => void;
  onStartSongPractice: (templateId: string) => void;
}) {
  const songs = practiceContent.songs;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SongFilter>("all");
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const filters: Array<{ id: SongFilter; label: string }> = [
    { id: "all", label: "全部" },
    { id: "entry", label: "入门" },
    { id: "advanced", label: "进阶" },
    { id: "pro", label: "Pro" }
  ];
  const visibleSongs = filterBeginnerSongs({
    query,
    access: filter === "pro" ? "pro" : filter === "all" ? undefined : "free",
    maxDifficulty: filter === "entry" ? 1 : undefined,
    minDifficulty: filter === "advanced" ? 2 : undefined
  });
  const selectedSong = songs.find((song) => song.id === selectedSongId) ?? null;

  if (selectedSong) {
    const templateId = selectedSong.practiceTemplateIds?.[0] ?? "practice-c-am-f-g7-loop";
    const locked = selectedSong.access !== "free";
    const lines = getSongPracticeLines(selectedSong);
    const chordNames = selectedSong.chordNames ?? ["C", "Am", "F", "G7"];
    const display = getSongDisplay(selectedSong);
    const routeSteps = buildSongDetailRoute(selectedSong);
    const detailCopy = songDetailDisplayConfig;
    const lineCount = lines.length || 4;

    return (
      <View style={styles.stack}>
        <Pressable accessibilityRole="button" onPress={() => setSelectedSongId(null)} style={styles.songDetailBackButton}>
          <Text style={styles.songDetailBackText}>‹ {detailCopy.backLabel}</Text>
        </Pressable>

        <View style={styles.songDetailHeroCard}>
          <View style={styles.songDetailHeader}>
            <View style={[styles.songAvatar, { backgroundColor: display.light ?? "#FFE4D6" }]}>
              <Text style={[styles.songAvatarText, { color: display.color ?? colors.coral }]}>
                {display.emoji ?? "♪"}
              </Text>
            </View>
            <View style={styles.songTitleBlock}>
              <Text style={styles.songTitle}>{selectedSong.title}</Text>
              <Text style={styles.songMeta}>
                {selectedSong.artist} · {getSongDifficultyLabel(selectedSong)} · {selectedSong.key} 调 · {selectedSong.bpm} BPM
              </Text>
              <ChordMiniList chordNames={chordNames} />
            </View>
            <Text style={[styles.songAccessBadge, locked && styles.songAccessBadgeLocked]}>
              {locked ? "Pro" : "免费"}
            </Text>
          </View>
          <Text style={styles.songDetailGoal}>
            {locked
              ? detailCopy.goals.locked
              : detailCopy.goals.playable.replace("{bars}", String(lineCount))}
          </Text>
        </View>

        <SectionTitle
          title={detailCopy.sectionLabels.chordPrepTitle}
          detail={`${chordNames.length} 个和弦 · ${detailCopy.sectionLabels.chordPrepDetailSuffix}`}
        />
        <View style={styles.songPrepPanel}>
          <ChordMiniList chordNames={chordNames} />
        </View>

        <SectionTitle title={detailCopy.sectionLabels.routeTitle} detail={detailCopy.sectionLabels.routeDetail} />
        <View style={styles.songRouteGrid}>
          {routeSteps.map((item) => (
            <View key={item.step} style={styles.songRouteStep}>
              <Text style={styles.songRouteIndex}>{item.step}</Text>
              <Text style={styles.songRouteTitle}>{item.title}</Text>
              <Text style={styles.songRouteDetail}>{item.detail}</Text>
            </View>
          ))}
        </View>

        <SectionTitle
          title={detailCopy.sectionLabels.fragmentTitle}
          detail={`${lines.length || 1} ${detailCopy.sectionLabels.fragmentUnit}`}
        />
        <View style={styles.songLineList}>
          {(lines.length > 0 ? lines : [{ ...detailCopy.fallbackLine, chord: chordNames[0] }]).map((line, index) => (
            <View key={`${selectedSong.id}-${line.bar ?? index}`} style={styles.songPreviewLine}>
              <ChordMiniCard chordName={line.chord ?? chordNames[0]} />
              <Text style={styles.songPreviewText}>{line.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={locked}
          onPress={() => onStartSongPractice(templateId)}
          style={[styles.songPracticeButton, locked && styles.songPracticeButtonDisabled]}
        >
          <Text style={[styles.primaryButtonText, locked && styles.songPracticeButtonTextDisabled]}>
            {locked ? detailCopy.actions.lockedSongFragment : detailCopy.actions.startSongFragment}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={locked}
          onPress={() => onStartMelodyPractice(selectedSong.id)}
          style={[styles.songMelodyButton, locked && styles.songPracticeButtonDisabled]}
        >
          <Text style={[styles.songMelodyButtonText, locked && styles.songPracticeButtonTextDisabled]}>
            {locked ? detailCopy.actions.lockedMelody : detailCopy.actions.startMelody}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title="曲谱库" detail={`${songs.length} 首 · 从歌曲片段进入弹唱`} />
      <View style={styles.songSearchPanel}>
        <TextInput
          accessibilityLabel="搜索曲谱"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="搜索歌曲、调式、和弦"
          placeholderTextColor="#9A9288"
          style={styles.songSearchInput}
          value={query}
        />
        <View style={styles.songFilterRow}>
          {filters.map((item) => {
            const selected = item.id === filter;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[styles.songFilterButton, selected && styles.songFilterButtonActive]}
              >
                <Text style={[styles.songFilterText, selected && styles.songFilterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {visibleSongs.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.historyEmpty}>没有找到匹配曲谱。</Text>
        </View>
      ) : null}

      {visibleSongs.map((song) => {
        const locked = song.access !== "free";
        const display = getSongDisplay(song);
        return (
          <Pressable
            accessibilityRole="button"
            disabled={locked}
            key={song.id}
            onPress={() => setSelectedSongId(song.id)}
            style={[styles.songDetailCard, locked && styles.songDetailCardLocked]}
          >
            <View style={styles.songDetailHeader}>
              <View style={[styles.songAvatar, { backgroundColor: display.light ?? "#FFE4D6" }]}>
                <Text style={[styles.songAvatarText, { color: display.color ?? colors.coral }]}>
                  {display.emoji ?? "♪"}
                </Text>
              </View>
              <View style={styles.songTitleBlock}>
                <Text style={styles.songTitle}>{song.title}</Text>
                <Text style={styles.songMeta}>
                  {song.artist} · {getSongDifficultyLabel(song)} · {song.key} 调 · {song.bpm} BPM
                </Text>
                <ChordMiniList chordNames={song.chordNames ?? ["C", "Am", "F", "G7"]} />
              </View>
              <Text style={[styles.songAccessBadge, locked && styles.songAccessBadgeLocked]}>
                {locked ? "Pro" : "免费"}
              </Text>
            </View>
            <View style={[styles.songPracticeButton, locked && styles.songPracticeButtonDisabled]}>
              <Text style={[styles.primaryButtonText, locked && styles.songPracticeButtonTextDisabled]}>
                {locked ? "后续解锁完整曲谱" : "查看详情"}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <SectionTitle title="和弦大全" detail={`${beginnerChords.length} 个常用和弦`} />
      <View style={styles.chordLibraryGrid}>
        {beginnerChords.map((chord) => (
          <View key={chord.id} style={styles.chordLibraryCard}>
            <ChordDiagram chord={chord} compact />
            <Text style={styles.chordLibraryName}>{chord.name}</Text>
            <Text style={styles.chordLibraryMeta}>指法 {chord.fingering.join("-")}</Text>
          </View>
        ))}
      </View>

    </View>
  );
}

function ProfileScreen({
  coursePath,
  latestPracticeSummary,
  nextPracticeRecommendation,
  onClearHistory,
  onOpenLearn,
  practiceHistorySummary,
  practicePathSummary,
  recentPracticeSummaries
}: {
  coursePath: CoursePathItem[];
  latestPracticeSummary?: PracticeRecordSummary;
  nextPracticeRecommendation: NextPracticeRecommendation;
  onClearHistory: () => void;
  onOpenLearn: () => void;
  practiceHistorySummary: PracticeHistorySummary;
  practicePathSummary: PracticePathSummaryItem[];
  recentPracticeSummaries: PracticeRecordSummary[];
}) {
  const rhythmScores = recentPracticeSummaries
    .map((summary) => Number(summary.rhythmLabel))
    .filter((score) => Number.isFinite(score) && score > 0);
  const bestRhythmScore = rhythmScores.length > 0 ? Math.max(...rhythmScores) : null;
  const courseDoneCount = coursePath.filter((item) => item.status === "done").length;
  const courseProgress = coursePath.length === 0
    ? 0
    : Math.round(coursePath.reduce((sum, item) => sum + Math.min(item.progress, 100), 0) / coursePath.length);
  const currentCourse = coursePath.find((item) => item.status === "current") ?? coursePath.find((item) => item.status !== "done") ?? coursePath[coursePath.length - 1];
  const badges = [
    { label: "连续练习", value: `${practiceHistorySummary.currentStreakDays} 天`, active: practiceHistorySummary.currentStreakDays > 0 },
    { label: "节奏记录", value: latestPracticeSummary?.rhythmLabel ?? "--", active: Boolean(latestPracticeSummary) },
    { label: "首段跟弹", value: practiceHistorySummary.totalSessions > 0 ? "已记录" : "未开始", active: practiceHistorySummary.totalSessions > 0 },
    { label: "歌曲库", value: `${practiceContent.songs.length} 首`, active: true }
  ];

  return (
    <View style={styles.stack}>
      <SectionTitle title="我的练习" detail="本地档案 · MVP" />
      <View style={styles.profileHero}>
        <Text style={styles.profileHeroTitle}>P0 入门阶段</Text>
        <Text style={styles.profileHeroCopy}>
          当前重点是调准音、稳定节奏、完成四和弦循环，再进入歌曲片段。
        </Text>
        <View style={styles.reportGrid}>
          <ScoreBox label="练习" value={`${practiceHistorySummary.totalSessions}`} />
          <ScoreBox label="时长" value={formatPracticeDuration(practiceHistorySummary.totalDurationSec)} />
          <ScoreBox label="天数" value={`${practiceHistorySummary.practiceDays}`} />
          <ScoreBox label="连续" value={`${practiceHistorySummary.currentStreakDays}`} />
        </View>
      </View>

      <View style={styles.profileCoursePanel}>
        <View style={styles.profilePanelHead}>
          <View style={styles.profilePanelCopy}>
            <Text style={styles.profilePanelTitle}>第一课路径</Text>
            <Text style={styles.profilePanelMeta}>
              {courseDoneCount}/{coursePath.length} 个必修节点完成 · 当前 {currentCourse?.title ?? "待开始"}
            </Text>
          </View>
          <Text style={styles.profileProgressBadge}>{courseProgress}%</Text>
        </View>
        <View style={styles.profileProgressTrack}>
          <View style={[styles.profileProgressFill, { width: `${courseProgress}%` }]} />
        </View>
        <View style={styles.profileCourseStrip}>
          {coursePath.map((item) => (
            <View
              key={item.id}
              style={[
                styles.profileCourseStep,
                item.status === "done" && styles.profileCourseStepDone,
                item.status === "current" && styles.profileCourseStepCurrent
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.profileScoreGrid}>
        <ProfileMetric label="最近节奏" value={latestPracticeSummary?.rhythmLabel ?? "--"} />
        <ProfileMetric label="最高节奏" value={bestRhythmScore == null ? "--" : `${bestRhythmScore}`} />
        <ProfileMetric label="练习次数" value={`${practiceHistorySummary.totalSessions}`} />
      </View>

      <Pressable accessibilityRole="button" onPress={onOpenLearn} style={styles.profileAdviceCard}>
        <View style={styles.profilePanelCopy}>
          <Text style={styles.profilePanelTitle}>下一步建议</Text>
          <Text style={styles.profilePanelMeta}>
            {nextPracticeRecommendation.title} · {nextPracticeRecommendation.bpm} BPM · {localizeRecommendationReason(nextPracticeRecommendation)}
          </Text>
        </View>
        <Text style={styles.profileAdviceArrow}>›</Text>
      </Pressable>

      <SectionTitle title="成就" detail="本地模拟徽章" />
      <View style={styles.badgeGrid}>
        {badges.map((badge) => (
          <View key={badge.label} style={[styles.badgeCard, !badge.active && styles.badgeCardLocked]}>
            <Text style={styles.badgeMark}>{badge.active ? "✓" : "·"}</Text>
            <Text style={styles.badgeLabel}>{badge.label}</Text>
            <Text style={styles.badgeValue}>{badge.value}</Text>
          </View>
        ))}
      </View>

      <SectionTitle title="练习路径" detail="节奏 · 换和弦 · 歌曲片段" />
      <View style={styles.reviewReportPanel}>
        <PracticePathSummaryList items={practicePathSummary} />
      </View>

      <SectionTitle title="最近练习" detail={latestPracticeSummary ? latestPracticeSummary.title : "还没有记录"} />
      <View style={styles.practiceSession}>
        <View style={styles.practiceHistoryHeader}>
          <Text style={styles.historyTitle}>本地记录</Text>
          <Pressable
            accessibilityRole="button"
            disabled={recentPracticeSummaries.length === 0}
            onPress={onClearHistory}
            style={[styles.clearHistoryButton, recentPracticeSummaries.length === 0 && styles.clearHistoryButtonDisabled]}
          >
            <Text style={[styles.clearHistoryText, recentPracticeSummaries.length === 0 && styles.clearHistoryTextDisabled]}>清空</Text>
          </Pressable>
        </View>
        {recentPracticeSummaries.length === 0 ? (
          <Text style={styles.historyEmpty}>完成一次练琴后，这里会出现最近记录。</Text>
        ) : (
          <View style={styles.historyList}>
            {recentPracticeSummaries.map((summary, index) => (
              <View key={`${summary.title}-${index}`} style={styles.historyRow}>
                <View style={styles.historyIndex}>
                  <Text style={styles.historyIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.historyCopy}>
                  <Text style={styles.historyRowTitle}>{summary.title}</Text>
                  <Text style={styles.historyRowMeta}>
                    {summary.contentLabel} · {summary.completedStepsLabel} · {summary.durationLabel} · {summary.bpmLabel} · 节奏 {summary.rhythmLabel}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function PracticePathSummaryList({ items }: { items: PracticePathSummaryItem[] }) {
  return (
    <View style={styles.pathSummaryList}>
      {items.map((item) => (
        <View key={item.templateId} style={styles.pathSummaryRow}>
          <View style={styles.pathSummaryCopy}>
            <Text style={styles.pathSummaryTitle}>{item.title}</Text>
            <Text style={styles.pathSummaryMeta}>
              {item.completedCount}/{item.targetCount} · 节奏 {item.bestRhythmScore ?? "--"} · {item.attempts} 次
            </Text>
          </View>
          <Text style={[styles.pathSummaryBadge, item.status === "passed" && styles.pathSummaryBadgePassed]}>
            {practicePathStatusLabel(item.status)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PracticeScreen({
  launchConfig,
  onPracticeRecord
}: {
  launchConfig?: PracticeLaunchConfig;
  onPracticeRecord: (record: PracticeSessionRecord) => void;
}) {
  const initialTemplate = getPracticeTemplateById(launchConfig?.templateId);
  const initialStep = findPracticeStepByChord(launchConfig?.focusChord, initialTemplate);
  const [activeTemplateId, setActiveTemplateId] = useState(initialTemplate.id);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [practiceBpm, setPracticeBpm] = useState(launchConfig?.bpm ?? initialTemplate.bpm ?? chordLoopPractice.bpm);
  const [practiceTempoId, setPracticeTempoId] = useState<PracticeTempoId>(launchConfig?.tempoId ?? "standard");
  const [practiceLoopMode, setPracticeLoopMode] = useState<PracticeLoopMode>(launchConfig?.loopMode ?? "auto");
  const [practiceBeat, setPracticeBeat] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [beatSoundEnabled, setBeatSoundEnabled] = useState(true);
  const [beatSoundStatus, setBeatSoundStatus] = useState("节拍声已开启");
  const [rhythmStartedAtMs, setRhythmStartedAtMs] = useState<number | null>(null);
  const [, setRhythmAutoCaptureIndex] = useState(0);
  const [latestRhythmTap, setLatestRhythmTap] = useState<PracticeLogEvent | null>(null);
  const [practiceMicAccess, setPracticeMicAccess] = useState(initialMicrophoneAccessState);
  const [practiceMicBusy, setPracticeMicBusy] = useState(false);
  const [practiceEvents, setPracticeEvents] = useState<PracticeLogEvent[]>([]);
  const [sessionClosed, setSessionClosed] = useState(false);
  const activeTemplate = useMemo(() => getPracticeTemplateById(activeTemplateId), [activeTemplateId]);
  const practiceTargets = activeTemplate.targets ?? chordLoopPractice.targets;
  const activeBeatNumbers = useMemo(() => getPracticeBeatNumbers(activeTemplate), [activeTemplate]);
  const beatCycleLength = activeTemplate.type === "rhythm_pattern"
    ? Math.max(1, practiceTargets.length)
    : activeBeatNumbers.length;
  const activeTemplateIndex = Math.max(0, practiceTemplates.findIndex((template) => template.id === activeTemplate.id));
  const activeCourse = getMvpCourseForPracticeTemplate(activeTemplate.id);
  const activeSong = useMemo(() => getSongForPracticeTemplate(activeTemplate), [activeTemplate]);
  const songPracticeLines = useMemo(() => getSongPracticeLines(activeSong), [activeSong]);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(() =>
    initialTemplate.targets.map(() => false)
  );
  const stepReports = useMemo(() => {
    return practiceTargets.map((target, index) => {
      const expectedMidi = noteNameToMidi(getPracticeTargetNote(target));
      const detectedMidi = index === 2 ? expectedMidi - 1 : expectedMidi;
      const targetHz = midiToFrequency(expectedMidi);
      const detectedHz = midiToFrequency(detectedMidi);
      const cents = centsBetween(detectedHz, targetHz);
      const event = scorePitchEvent({
        expectedMidi,
        detectedMidi,
        cents,
        confidence: index === 2 ? 0.72 : 0.93,
        timingOffsetMs: [-28, 42, 135, 18][index]
      });
      return {
        target,
        event,
        suggestion: getPracticeTargetCue(target) ?? activeTemplate.display?.subtitle ?? practiceSuggestions[index % practiceSuggestions.length]
      };
    });
  }, [activeTemplate, practiceTargets]);
  const activeTarget = practiceTargets[currentStep] ?? practiceTargets[0];
  const activeReport = stepReports[currentStep];
  const activeSongLineIndex = songPracticeLines.findIndex((line, index) =>
    (line.bar ?? index + 1) === getPracticeTargetBar(activeTarget, currentStep)
  );
  const completedCount = completedSteps.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / practiceTargets.length) * 100);
  const barsPracticed = practiceEvents.filter((event) => event.type === "bar").length;
  const completedClicks = practiceEvents.filter((event) => event.type === "complete").length;
  const rhythmTapCount = practiceEvents.filter((event) => event.type === "tap").length;
  const firstEventAt = practiceEvents[0]?.timestampMs;
  const lastEventAt = practiceEvents[practiceEvents.length - 1]?.timestampMs;
  const practiceDurationSec = firstEventAt && lastEventAt ? Math.max(0, Math.round((lastEventAt - firstEventAt) / 1000)) : 0;
  const rhythmSummary = useMemo(
    () => summarizePracticeRhythm(practiceEvents, practiceBpm),
    [practiceEvents, practiceBpm]
  );
  const rhythmScoreLabel = completedClicks > 0 || rhythmTapCount > 0 ? `${rhythmSummary.averageRhythmScore}` : "--";
  const rhythmTimingLabel = completedClicks > 0 || rhythmTapCount > 0
    ? `准 ${rhythmSummary.onTimeCount} · 早 ${rhythmSummary.earlyCount} · 晚 ${rhythmSummary.lateCount}`
    : "完成一次小节后生成节奏参考";
  const practiceAdvice = practiceLoopMode === "single"
    ? `当前锁定 ${getPracticeTargetChord(activeTarget)}，适合把当前目标练熟后再切自动循环。`
    : barsPracticed >= practiceTargets.length
      ? "已经跑完一轮练习，可以尝试升到进阶 85。"
      : "先保持稳定四拍，再追求更快换和弦。";

  useEffect(() => {
    if (!launchConfig) return;
    setIsRunning(false);
    setPracticeBpm(launchConfig.bpm);
    setPracticeTempoId(launchConfig.tempoId);
    setPracticeLoopMode(launchConfig.loopMode);
    const nextTemplate = getPracticeTemplateById(launchConfig.templateId);
    setActiveTemplateId(nextTemplate.id);
    setCurrentStep(findPracticeStepByChord(launchConfig.focusChord, nextTemplate));
    setPracticeBeat(0);
    setPracticeEvents([]);
    setRhythmStartedAtMs(null);
    setRhythmAutoCaptureIndex(0);
    setLatestRhythmTap(null);
    setCompletedSteps(nextTemplate.targets.map(() => false));
    setSessionClosed(false);
  }, [launchConfig?.token]);

  function createPracticeEvent(type: PracticeLogEvent["type"], step = currentStep): PracticeLogEvent {
    const target = practiceTargets[step] ?? activeTarget;
    return {
      type,
      step,
      chord: getPracticeTargetChord(target),
      bpm: practiceBpm,
      loopMode: practiceLoopMode,
      timestampMs: Date.now()
    };
  }

  function recordPracticeEvent(type: PracticeLogEvent["type"], step = currentStep) {
    const event = createPracticeEvent(type, step);
    setPracticeEvents((events) => [...events, event]);
    return event;
  }

  function commitPracticeSession(events: PracticeLogEvent[], steps: boolean[]) {
    const hasPracticeActivity = events.some((event) => event.type === "start" || event.type === "bar" || event.type === "complete" || event.type === "tap")
      || steps.some(Boolean);
    if (!hasPracticeActivity) {
      return;
    }

    const record = createPracticeSessionRecord({
      courseId: activeCourse?.id ?? null,
      events,
      completedSteps: steps,
      bpm: practiceBpm,
      mode: practiceLoopMode,
      lessonId: mvpLesson.id,
      exerciseId: activeTemplate.id,
      songId: activeSong?.id ?? null,
      template: activeTemplate,
      templateId: activeTemplate.id,
      rhythmSummary: summarizePracticeRhythm(events, practiceBpm)
    });
    onPracticeRecord(record);
    setSessionClosed(true);
  }

  function createAutoRhythmCapture(captureIndex: number, startedAtMs: number): PracticeLogEvent {
    const stepDurationMs = getRhythmStepDurationMs(activeTemplate, practiceBpm);
    const offsetMs = RHYTHM_AUTO_CAPTURE_OFFSETS_MS[captureIndex % RHYTHM_AUTO_CAPTURE_OFFSETS_MS.length];
    const eventTimeMs = startedAtMs + captureIndex * stepDurationMs + offsetMs;
    const scored = scoreRhythmEvent({
      eventTimeMs,
      startedAtMs,
      bpm: getRhythmScoringBpm(activeTemplate, practiceBpm),
      beatIndex: captureIndex
    });
    const step = captureIndex % practiceTargets.length;
    return {
      type: "tap",
      step,
      chord: getPracticeTargetChord(practiceTargets[step]),
      bpm: practiceBpm,
      loopMode: practiceLoopMode,
      timestampMs: Date.now(),
      targetBeatIndex: captureIndex,
      timingOffsetMs: scored.timingOffsetMs,
      rhythmScore: scored.rhythmScore,
      timingStatus: scored.timingStatus as PracticeLogEvent["timingStatus"]
    };
  }

  useEffect(() => {
    if (!isRunning) return undefined;

    const interval = setInterval(() => {
      if (activeTemplate.type === "rhythm_pattern") {
        const startedAtMs = rhythmStartedAtMs ?? Date.now();
        if (!rhythmStartedAtMs) {
          setRhythmStartedAtMs(startedAtMs);
        }
        setRhythmAutoCaptureIndex((captureIndex) => {
          const event = createAutoRhythmCapture(captureIndex, startedAtMs);
          setPracticeEvents((events) => [...events, event]);
          setCompletedSteps((steps) => steps.map((done, index) => done || index === event.step));
          setLatestRhythmTap(event);
          return captureIndex + 1;
        });
      }
      setPracticeBeat((value) => {
        const nextBeat = (value + 1) % beatCycleLength;
        if (beatSoundEnabled) {
          const nextTarget = practiceTargets[nextBeat] ?? practiceTargets[0];
          const isAccent = activeTemplate.type === "rhythm_pattern" ? Boolean(nextTarget?.accent) : nextBeat === 0;
          void playPracticeBeatClick(isAccent ? "accent" : "light");
        }
        if (nextBeat === 0) {
          setCurrentStep((step) => {
            recordPracticeEvent("bar", step);
            return practiceLoopMode === "auto" ? (step + 1) % practiceTargets.length : step;
          });
        }
        return nextBeat;
      });
    }, activeTemplate.type === "rhythm_pattern" ? getRhythmStepDurationMs(activeTemplate, practiceBpm) : 60000 / practiceBpm);

    return () => clearInterval(interval);
  }, [activeTemplate, beatCycleLength, beatSoundEnabled, isRunning, practiceBpm, practiceLoopMode, practiceTargets, rhythmStartedAtMs]);

  async function togglePracticeRunning() {
    if (isRunning) {
      const endEvent = recordPracticeEvent("end");
      commitPracticeSession([...practiceEvents, endEvent], completedSteps);
      setIsRunning(false);
      return;
    }

    if (beatSoundEnabled) {
      const audioState = await preparePracticeBeatAudio();
      setBeatSoundStatus(audioState === "web-ready" ? "节拍声已就绪" : "当前平台先显示节拍，后续接本地 click 声");
      void playPracticeBeatClick("accent");
    }

    if (sessionClosed) {
      setPracticeEvents([]);
      setCompletedSteps(practiceTargets.map(() => false));
      setCurrentStep(0);
      setPracticeBeat(0);
      setRhythmAutoCaptureIndex(0);
      setLatestRhythmTap(null);
    }
    const startTime = Date.now();
    setRhythmStartedAtMs(startTime);
    const startEvent: PracticeLogEvent = {
      type: "start",
      step: currentStep,
      chord: getPracticeTargetChord(activeTarget),
      bpm: practiceBpm,
      loopMode: practiceLoopMode,
      timestampMs: startTime
    };
    if (activeTemplate.type === "rhythm_pattern") {
      const firstCapture = createAutoRhythmCapture(0, startTime);
      setPracticeEvents((events) => [...events, startEvent, firstCapture]);
      setCompletedSteps((steps) => steps.map((done, index) => done || index === firstCapture.step));
      setLatestRhythmTap(firstCapture);
      setRhythmAutoCaptureIndex(1);
    } else {
      setPracticeEvents((events) => [...events, startEvent]);
      setRhythmAutoCaptureIndex(0);
    }
    setSessionClosed(false);
    setIsRunning(true);
  }

  async function toggleBeatSound() {
    const nextEnabled = !beatSoundEnabled;
    setBeatSoundEnabled(nextEnabled);
    if (!nextEnabled) {
      setBeatSoundStatus("节拍声已关闭");
      return;
    }

    const audioState = await preparePracticeBeatAudio();
    setBeatSoundStatus(audioState === "web-ready" ? "节拍声已开启" : "当前平台先显示节拍，后续接本地 click 声");
    void playPracticeBeatClick(practiceBeat === 0 ? "accent" : "light");
  }

  async function enablePracticeMicrophone() {
    setPracticeMicBusy(true);
    try {
      setPracticeMicAccess(await ensureMicrophoneAccess());
    } finally {
      setPracticeMicBusy(false);
    }
  }

  function completeCurrentStep() {
    const nextCompletedSteps = completedSteps.map((done, index) => (index === currentStep ? true : done));
    const completeEvent = recordPracticeEvent("complete");
    setCompletedSteps(nextCompletedSteps);
    setPracticeBeat(0);
    if (practiceLoopMode === "single") {
      commitPracticeSession([...practiceEvents, completeEvent], nextCompletedSteps);
      setIsRunning(false);
      return;
    }
    if (currentStep === practiceTargets.length - 1) {
      commitPracticeSession([...practiceEvents, completeEvent], nextCompletedSteps);
      setIsRunning(false);
      return;
    }
    setCurrentStep((value) => value + 1);
  }

  function resetPractice() {
    const resetEvent = createPracticeEvent("reset");
    if (!sessionClosed) {
      commitPracticeSession([...practiceEvents, resetEvent], completedSteps);
    }
    setIsRunning(false);
    setCurrentStep(0);
    setPracticeBeat(0);
    setPracticeEvents([]);
    setRhythmStartedAtMs(null);
    setRhythmAutoCaptureIndex(0);
    setLatestRhythmTap(null);
    setSessionClosed(false);
    setCompletedSteps(practiceTargets.map(() => false));
  }

  function moveToPreviousStep() {
    setPracticeBeat(0);
    setCurrentStep((value) => (value + practiceTargets.length - 1) % practiceTargets.length);
  }

  function selectPracticeTemplate(template: PracticeTemplate) {
    setIsRunning(false);
    setActiveTemplateId(template.id);
    setPracticeBpm(template.bpm ?? chordLoopPractice.bpm);
    setPracticeTempoId(template.bpm === 60 ? "slow" : template.bpm === 85 ? "advanced" : "standard");
    setPracticeLoopMode("auto");
    setCurrentStep(0);
    setPracticeBeat(0);
    setPracticeEvents([]);
    setRhythmStartedAtMs(null);
    setRhythmAutoCaptureIndex(0);
    setLatestRhythmTap(null);
    setCompletedSteps(template.targets.map(() => false));
    setSessionClosed(false);
  }

  function applyTempoPreset(preset: typeof practiceTempoPresets[number]) {
    setPracticeTempoId(preset.id);
    setPracticeBpm(preset.bpm);
    setPracticeBeat(0);
    recordPracticeEvent("tempo");
  }

  function completeRhythmGroup() {
    const events = [
      ...practiceEvents,
      ...practiceTargets.map((_, index) => createPracticeEvent("complete", index))
    ];
    const steps = practiceTargets.map(() => true);
    setPracticeEvents(events);
    setCompletedSteps(steps);
    setIsRunning(false);
    setPracticeBeat(0);
    commitPracticeSession(events, steps);
  }

  if (activeTemplate.type === "rhythm_pattern") {
    const activeRhythmTarget = practiceTargets[practiceBeat % practiceTargets.length] ?? activeTarget;
    const rhythmAction = getStrokeArrow(activeRhythmTarget.stroke);
    const rhythmDetail = `第 ${activeRhythmTarget?.beat ?? 1}${activeRhythmTarget?.subdivision && activeRhythmTarget.subdivision > 1 ? `.${activeRhythmTarget.subdivision}` : ""} 拍 · ${getRhythmAccentLabel(activeRhythmTarget)}`;
    const rhythmProgressPercent = Math.round(((practiceBeat + 1) / Math.max(1, practiceTargets.length)) * 100);
    const rhythmFeedback = rhythmTimingFeedback(latestRhythmTap);

    return (
      <View style={styles.stack}>
        <SectionTitle title="节奏练习" detail={`${getRhythmTemplateDisplayTitle(activeTemplate)} · ${practiceBpm} BPM`} />
        <View style={styles.rhythmRunner}>
          <View style={styles.rhythmHeaderRow}>
            <View>
              <Text style={styles.sessionEyebrow}>当前节奏型</Text>
              <Text style={styles.rhythmRunnerTitle}>{getRhythmTemplateDisplayTitle(activeTemplate)}</Text>
            </View>
            <Text style={styles.sessionPill}>{isRunning ? "进行中" : "待开始"}</Text>
          </View>

          <View style={styles.rhythmTemplateGrid}>
            {rhythmPracticeTemplates.map((template) => {
              const selected = template.id === activeTemplate.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={template.id}
                  style={[styles.rhythmTemplateButton, selected && styles.rhythmTemplateButtonActive]}
                  onPress={() => selectPracticeTemplate(template)}
                >
                  <Text style={[styles.rhythmTemplateText, selected && styles.rhythmTemplateTextActive]}>
                    {getRhythmTemplateDisplayTitle(template)}
                  </Text>
                  <Text style={[styles.rhythmTemplateMeta, selected && styles.rhythmTemplateTextActive]}>
                    {template.bpm ?? 60} BPM
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.rhythmActionPanel}>
            <Text style={styles.rhythmActionText}>{rhythmAction}</Text>
            <Text style={styles.rhythmActionDetail}>{rhythmDetail}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${rhythmProgressPercent}%` }]} />
            </View>
          </View>

          <View style={styles.rhythmDotGrid}>
            {practiceTargets.map((target, index) => {
              const active = index === practiceBeat;
              const accent = Boolean(target.accent) || index === 0;
              return (
                <View key={target.id} style={styles.rhythmDotWrap}>
                  <View
                    style={[
                      styles.rhythmDot,
                      accent ? styles.rhythmDotAccent : styles.rhythmDotLight,
                      active && styles.rhythmDotActive
                    ]}
                  >
                    <Text style={styles.rhythmDotText}>{getStrokeArrow(target.stroke)}</Text>
                  </View>
                  <Text style={[styles.practiceBeatText, active && styles.practiceBeatTextActive]}>
                    {target.beat}{target.subdivision && target.subdivision > 1 ? `.${target.subdivision}` : ""}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.rhythmControlGrid}>
            <Pressable
              accessibilityRole="button"
              style={styles.bpmStepButton}
              onPress={() => {
                setPracticeTempoId("custom");
                recordPracticeEvent("tempo");
                setPracticeBpm((value) => Math.max(40, value - 5));
              }}
            >
              <Text style={styles.bpmStepText}>-5</Text>
            </Pressable>
            <View style={styles.rhythmBpmBadge}>
              <Text style={styles.rhythmBpmValue}>{practiceBpm}</Text>
              <Text style={styles.rhythmBpmUnit}>BPM</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              style={styles.bpmStepButton}
              onPress={() => {
                setPracticeTempoId("custom");
                recordPracticeEvent("tempo");
                setPracticeBpm((value) => Math.min(140, value + 5));
              }}
            >
              <Text style={styles.bpmStepText}>+5</Text>
            </Pressable>
          </View>

          <View style={styles.rhythmControlGrid}>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: beatSoundEnabled }}
              style={[styles.soundToggleButton, beatSoundEnabled && styles.soundToggleButtonActive]}
              onPress={toggleBeatSound}
            >
              <Text style={[styles.soundToggleText, beatSoundEnabled && styles.soundToggleTextActive]}>
                节拍声 {beatSoundEnabled ? "开" : "关"}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.primaryMiniButton} onPress={togglePracticeRunning}>
              <Text style={styles.primaryButtonText}>{isRunning ? "暂停" : "开始"}</Text>
            </Pressable>
          </View>
          <Text style={styles.practiceSoundStatus}>{beatSoundStatus}</Text>

          <View style={styles.rhythmScorePanel}>
            <View style={[styles.rhythmTapButton, isRunning && styles.rhythmAutoCaptureActive]}>
              <Text style={styles.rhythmTapButtonText}>{isRunning ? "自动记录中" : rhythmTapCount > 0 ? "本轮完成" : "等待开始"}</Text>
            </View>
            <Text style={styles.rhythmFeedbackText}>{rhythmFeedback}</Text>
          </View>

          <View style={styles.rhythmStatsGrid}>
            <ScoreBox label="已练" value={`${barsPracticed} 小节`} />
            <ScoreBox label="节奏" value={rhythmScoreLabel} />
            <ScoreBox label="完成" value={`${completedCount}/${practiceTargets.length}`} />
          </View>

          <View style={styles.rhythmControlGrid}>
            <Pressable accessibilityRole="button" style={styles.secondaryMiniButton} onPress={resetPractice}>
              <Text style={styles.secondaryButtonText}>重置</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.secondaryMiniButton} onPress={completeRhythmGroup}>
              <Text style={styles.secondaryButtonText}>完成本组</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title="跟练" detail={`${getPracticeTemplateShortLabel(activeTemplate)} · ${practiceBpm} BPM · ${activeTemplate.timeSignature}`} />
      {activeCourse ? (
        <View style={styles.practiceCoursePanel}>
          <View style={styles.practiceCourseBadge}>
            <Text style={styles.practiceCourseBadgeText}>第 {activeCourse.order} 课</Text>
          </View>
          <View style={styles.practiceCourseCopy}>
            <Text style={styles.practiceCourseTitle}>{activeCourse.title}</Text>
            <Text style={styles.practiceCourseMeta}>{activeCourse.subtitle}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.practiceSession}>
        <View style={styles.reportHeader}>
          <View>
            <Text style={styles.sessionEyebrow}>当前任务</Text>
            <Text style={styles.sessionTitle}>{getPracticeTargetChord(activeTarget)} · {practiceAction(getPracticeTargetChord(activeTarget), activeTemplate)}</Text>
          </View>
          <Text style={styles.sessionPill}>{isRunning ? "进行中" : "待开始"}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.sessionMeta}>
          已完成 {completedCount}/{practiceTargets.length} · 第 {getPracticeTargetBar(activeTarget, currentStep)} 小节 · 第 {practiceBeat + 1} 拍
        </Text>
        <Text style={styles.practiceCueText}>
          {activeReport?.suggestion ?? activeTemplate.display?.subtitle ?? "跟着节拍完成当前目标。"}
        </Text>
        <View style={styles.practiceTargetInsight}>
          <View style={styles.practiceTargetInsightHeader}>
            <Text style={styles.practiceTargetInsightLabel}>{activeTemplate.display?.targetLabel ?? "当前目标"}</Text>
            <Text style={styles.practiceTargetInsightMeta}>{getPracticeTemplateGoalMeta(activeTemplate)}</Text>
          </View>
          <View style={styles.practiceTargetInsightGrid}>
            {practiceTargets.map((target, index) => {
              const active = index === currentStep;
              const completed = completedSteps[index];
              return (
                <Pressable
                  accessibilityRole="button"
                  key={`${target.id}-insight`}
                  style={[
                    styles.practiceTargetMiniCard,
                    active && styles.practiceTargetMiniCardActive,
                    completed && styles.practiceTargetMiniCardDone
                  ]}
                  onPress={() => {
                    setCurrentStep(index);
                    setPracticeBeat(0);
                  }}
                >
                  <Text style={[styles.practiceTargetMiniIndex, active && styles.practiceTargetMiniIndexActive]}>
                    {completed ? "✓" : getPracticeTargetBar(target, index)}
                  </Text>
                  <Text style={[styles.practiceTargetMiniTitle, active && styles.practiceTargetMiniTitleActive]} numberOfLines={1}>
                    {getPracticeTargetSummary(target, activeTemplate)}
                  </Text>
                  <Text style={[styles.practiceTargetMiniDetail, active && styles.practiceTargetMiniDetailActive]} numberOfLines={2}>
                    {getPracticeTargetDetail(target, activeTemplate)}
                  </Text>
                  <ChordMiniCard chordName={getPracticeTargetChord(target)} dense />
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.templatePicker}>
          <View style={styles.pathHeader}>
            <Text style={styles.pathTitle}>练习路径</Text>
            <Text style={styles.pathMeta}>第 {activeTemplateIndex + 1}/{practiceTemplates.length} 步</Text>
          </View>
          {practiceTemplates.map((template) => {
            const selected = template.id === activeTemplate.id;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={template.id}
                style={[styles.templateChip, selected && styles.templateChipActive]}
                onPress={() => selectPracticeTemplate(template)}
              >
                <View style={styles.templateChipHeader}>
                  <Text style={[styles.templateStepBadge, selected && styles.templateStepBadgeActive]}>
                    {practiceTemplates.findIndex((item) => item.id === template.id) + 1}
                  </Text>
                  <Text style={[styles.templateChipType, selected && styles.templateChipTextActive]}>
                    {getPracticeTemplateShortLabel(template)}
                  </Text>
                </View>
                <Text style={[styles.templateChipTitle, selected && styles.templateChipTextActive]} numberOfLines={1}>
                  {getPracticeTemplateTitle(template)}
                </Text>
                <Text style={[styles.templateChipSubtitle, selected && styles.templateChipTextActive]} numberOfLines={2}>
                  {template.display?.subtitle ?? "按当前目标完成一组练习。"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.practiceOptionPanel}>
          <View style={styles.segmentRow}>
            {practiceTempoPresets.map((preset) => {
              const selected = practiceTempoId === preset.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={preset.id}
                  style={[styles.segmentButton, selected && styles.segmentButtonActive]}
                  onPress={() => applyTempoPreset(preset)}
                >
                  <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextActive]}>
                    {preset.label} {preset.bpm}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.segmentRow}>
            {practiceLoopModes.map((mode) => {
              const selected = practiceLoopMode === mode.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={mode.id}
                  style={[styles.segmentButton, selected && styles.segmentButtonActive]}
                  onPress={() => {
                    setPracticeLoopMode(mode.id);
                    setPracticeBeat(0);
                    recordPracticeEvent("mode");
                  }}
                >
                  <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextActive]}>{mode.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.practiceMicPanel}>
          <View style={styles.practiceMicCopy}>
            <Text style={styles.practiceMicTitle}>麦克风跟练</Text>
            <Text style={styles.practiceMicDetail}>
              {practiceMicAccess.granted
                ? "权限已开通；Expo App 后续接入实时扫弦 PCM。"
                : "用于后续真实扫弦节奏评分，网页预览可直接拾音。"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={practiceMicBusy || practiceMicAccess.granted}
            style={[
              styles.practiceMicButton,
              practiceMicAccess.granted && styles.practiceMicButtonReady,
              practiceMicBusy && styles.disabledButton
            ]}
            onPress={enablePracticeMicrophone}
          >
            <Text style={[styles.practiceMicButtonText, practiceMicAccess.granted && styles.practiceMicButtonTextReady]}>
              {practiceMicBusy ? "请求中" : practiceMicAccess.granted ? "已开通" : "打开麦克风"}
            </Text>
          </Pressable>
        </View>
        {activeTemplate.type === "chord_transition" ? (
          <ChordTransitionFocusPanel
            chordNames={getPracticeTemplateChordNames(activeTemplate)}
            activeChordName={getPracticeTargetChord(activeTarget)}
          />
        ) : null}
        <View style={styles.practiceMainGrid}>
          <View style={styles.practiceChordColumn}>
            <ChordFingeringGuide chordName={getPracticeTargetChord(activeTarget)} compact />
          </View>
          <View style={styles.practiceCoachColumn}>
            <View style={styles.practiceBeatPanel}>
              <View style={styles.practiceBeatHeader}>
                <Text style={styles.practiceBeatTitle}>跟练节拍</Text>
                <Text style={styles.practiceBeatMeta}>{practiceBpm} BPM</Text>
              </View>
              <View style={styles.practiceBeatGrid}>
                {activeBeatNumbers.map((beat, index) => {
                  const isAccent = index === 0;
                  const active = index === practiceBeat;
                  return (
                    <View key={beat} style={styles.practiceBeatDotWrap}>
                      <View
                        style={[
                          styles.practiceBeatDot,
                          isAccent ? styles.practiceBeatDotAccent : styles.practiceBeatDotLight,
                          active && styles.practiceBeatDotActive
                        ]}
                      />
                      <Text style={[styles.practiceBeatText, active && styles.practiceBeatTextActive]}>{beat}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.practiceBeatHint}>红点是第一拍重音，蓝点跟轻拍。</Text>
              <View style={styles.bpmAdjustRow}>
                <Pressable
                  accessibilityRole="button"
                  style={styles.bpmStepButton}
                  onPress={() => {
                    setPracticeTempoId("custom");
                    recordPracticeEvent("tempo");
                    setPracticeBpm((value) => Math.max(40, value - 5));
                  }}
                >
                  <Text style={styles.bpmStepText}>-5</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={styles.bpmStepButton}
                  onPress={() => {
                    setPracticeTempoId("custom");
                    recordPracticeEvent("tempo");
                    setPracticeBpm((value) => Math.min(140, value + 5));
                  }}
                >
                  <Text style={styles.bpmStepText}>+5</Text>
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: beatSoundEnabled }}
                style={[styles.soundToggleButton, beatSoundEnabled && styles.soundToggleButtonActive]}
                onPress={toggleBeatSound}
              >
                <Text style={[styles.soundToggleText, beatSoundEnabled && styles.soundToggleTextActive]}>
                  节拍声 {beatSoundEnabled ? "开" : "关"}
                </Text>
              </Pressable>
              <Text style={styles.practiceSoundStatus}>{beatSoundStatus}</Text>
            </View>
            <View style={styles.practiceControlGrid}>
              <Pressable
                accessibilityRole="button"
                style={styles.secondaryMiniButton}
                onPress={moveToPreviousStep}
              >
                <Text style={styles.secondaryButtonText}>上一</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.primaryMiniButton}
                onPress={togglePracticeRunning}
              >
                <Text style={styles.primaryButtonText}>{isRunning ? "暂停" : "开始"}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.secondaryMiniButton}
                onPress={completeCurrentStep}
              >
                <Text style={styles.secondaryButtonText}>完成</Text>
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" style={styles.resetCompactButton} onPress={resetPractice}>
              <Text style={styles.resetButtonText}>重置练习</Text>
            </Pressable>
          </View>
        </View>
        {activeTemplate.type === "song_fragment" && songPracticeLines.length > 0 ? (
          <View style={styles.songFragmentPanel}>
            <View style={styles.songFragmentHeader}>
              <Text style={styles.songFragmentTitle}>{activeSong?.title ?? "歌曲片段"}</Text>
              <Text style={styles.songFragmentMeta}>{practiceBpm} BPM · {activeTemplate.timeSignature}</Text>
            </View>
            {songPracticeLines.map((line, index) => {
              const active = index === (activeSongLineIndex >= 0 ? activeSongLineIndex : currentStep);
              return (
                <View key={`${line.bar ?? index}-${line.chord ?? "line"}`} style={[styles.songLineRow, active && styles.songLineRowActive]}>
                  <Text style={[styles.songLineChord, active && styles.songLineChordActive]}>{line.chord ?? getPracticeTargetChord(practiceTargets[index])}</Text>
                  <Text style={[styles.songLineText, active && styles.songLineTextActive]}>{line.text ?? "跟着节拍扫弦"}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
      <View style={styles.practiceTimeline}>
        {practiceTargets.map((target, index) => {
          const active = index === currentStep;
          const completed = completedSteps[index];
          const chord = getPracticeTargetChord(target);
          return (
            <View key={target.id} style={[styles.targetBlock, active && styles.targetBlockActive, completed && styles.targetBlockDone]}>
              <View style={styles.barBadge}>
                <Text style={styles.barBadgeText}>{completed ? "✓" : getPracticeTargetBar(target, index)}</Text>
              </View>
              <View style={styles.targetCopy}>
                <Text style={styles.targetAction}>{practiceAction(chord, activeTemplate)}</Text>
                <Text style={styles.targetBeat}>第 {getPracticeTargetBar(target, index)} 小节 · 第 {target.beat ?? 1} 拍</Text>
              </View>
              <View style={styles.targetChordBox}>
                <ChordMiniCard chordName={chord} dense />
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.reportPanel}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>本次练习</Text>
          <Text style={styles.reportPill}>{practiceLoopMode === "auto" ? "循环" : "单和弦"}</Text>
        </View>
        <View style={styles.reportGrid}>
          <ScoreBox label="练过" value={`${barsPracticed} 小节`} />
          <ScoreBox label="完成" value={`${completedCount}/${practiceTargets.length}`} />
          <ScoreBox label="时长" value={`${practiceDurationSec}s`} />
          <ScoreBox label="节奏" value={rhythmScoreLabel} />
        </View>
        <Text style={styles.reportLine}>
          当前：{practiceBpm} BPM · {practiceLoopMode === "auto" ? "自动循环" : `只练 ${getPracticeTargetChord(activeTarget)}`} · 最近目标 {getPracticeTargetChord(activeTarget)}
        </Text>
        <Text style={styles.reportLine}>
          参考评分：音准 {activeReport?.event.pitchScore ?? "--"} · 节奏 {rhythmScoreLabel} · {rhythmTimingLabel} · 建议：{practiceAdvice}
        </Text>
      </View>
    </View>
  );
}

function CourseDetailPanel({
  course,
  pathItem,
  nextPathItem,
  onOpenCourse,
  onOpenNextCourse,
  onStartPracticeTemplate
}: {
  course: CourseCatalogItem;
  pathItem: CoursePathItem;
  nextPathItem?: CoursePathItem | null;
  onOpenCourse: () => void;
  onOpenNextCourse?: () => void;
  onStartPracticeTemplate: (templateId: string) => void;
}) {
  const segments = getCourseSegments(course);
  const template = getCoursePracticeTemplate(course);
  const followupTemplate = getCourseFollowupPracticeTemplate(course);
  const song = getCourseSong(course);
  const completedSegmentCount = Math.min(segments.length, Math.floor(pathItem.progress / 25));
  const activeSegmentIndex = Math.min(segments.length - 1, completedSegmentCount);
  const templateChordNames = getPracticeTemplateChordNames(template);
  const followupChordNames = getPracticeTemplateChordNames(followupTemplate);
  const pathStatusText = getCoursePathStatusText(pathItem.status);
  const actionHint = getCourseActionHint(course);
  const shouldOpenNextCourse = pathItem.status === "done" && Boolean(nextPathItem);
  const primaryActionLabel = shouldOpenNextCourse
    ? `进入下一课 · ${nextPathItem?.title}`
    : pathItem.status === "done"
      ? `复练本课 · ${getCourseActionLabel(course)}`
      : getCourseActionLabel(course);
  const handlePrimaryCourseAction = () => {
    if (shouldOpenNextCourse && onOpenNextCourse) {
      onOpenNextCourse();
      return;
    }
    onOpenCourse();
  };

  return (
    <View style={styles.courseDetailPanel}>
      <View style={styles.courseStateRow}>
        <Text
          style={[
            styles.courseStatePill,
            pathItem.status === "done" && styles.courseStatePillDone,
            pathItem.status === "current" && styles.courseStatePillCurrent,
            pathItem.status === "locked" && styles.courseStatePillLocked
          ]}
        >
          {pathStatusText}
        </Text>
        <Text style={styles.courseStateHint} numberOfLines={2}>{actionHint}</Text>
      </View>
      <View style={styles.courseDetailHeader}>
        <View style={styles.courseDetailCopy}>
          <Text style={styles.courseDetailEyebrow}>第 {course.order} 课 · {course.estimatedMinutes} 分钟</Text>
          <Text style={styles.courseDetailTitle}>{course.title}</Text>
          <Text style={styles.courseDetailSubtitle}>{course.subtitle}</Text>
        </View>
        <View style={styles.courseProgressBadge}>
          <Text style={styles.courseProgressBadgeText}>{pathItem.progress}%</Text>
        </View>
      </View>

      <View style={styles.courseProgressTrack}>
        <View style={[styles.courseProgressFill, { width: `${pathItem.progress}%` }]} />
      </View>

      <View style={styles.courseSegmentGrid}>
        {segments.map((segment, index) => {
          const done = index < completedSegmentCount;
          const active = !done && index === activeSegmentIndex;
          return (
            <View
              key={`${course.id}-${segment}`}
              style={[
                styles.courseSegmentItem,
                done && styles.courseSegmentDone,
                active && styles.courseSegmentActive
              ]}
            >
              <Text
                style={[
                  styles.courseSegmentIndex,
                  (done || active) && styles.courseSegmentIndexActive
                ]}
              >
                {done ? "✓" : index + 1}
              </Text>
              <Text style={styles.courseSegmentText} numberOfLines={2}>{segment}</Text>
            </View>
          );
        })}
      </View>

      {template || followupTemplate || song ? (
        <View style={styles.courseResourcePanel}>
          {template ? (
            <View style={styles.courseResourceRow}>
              <Text style={styles.courseResourceLabel}>练习</Text>
              <View style={styles.courseResourceBody}>
                <Text style={styles.courseResourceValue} numberOfLines={2}>
                  {getPracticeTemplateTitle(template)} · {template.bpm} BPM
                </Text>
                <ChordMiniList chordNames={templateChordNames} />
              </View>
            </View>
          ) : null}
          {followupTemplate ? (
            <View style={styles.courseResourceRow}>
              <Text style={styles.courseResourceLabel}>跟进</Text>
              <View style={styles.courseResourceBody}>
                <Text style={styles.courseResourceValue} numberOfLines={2}>
                  {getPracticeTemplateTitle(followupTemplate)} · {followupTemplate.bpm} BPM
                </Text>
                <ChordMiniList chordNames={followupChordNames} />
              </View>
            </View>
          ) : null}
          {song ? (
            <View style={styles.courseResourceRow}>
              <Text style={styles.courseResourceLabel}>歌曲</Text>
              <View style={styles.courseResourceBody}>
                <Text style={styles.courseResourceValue} numberOfLines={2}>
                  {song.title} · {song.key} 调
                </Text>
                <ChordMiniList chordNames={song.chordNames ?? []} />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={handlePrimaryCourseAction}
        style={styles.courseActionButton}
      >
        <Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
      </Pressable>
      {followupTemplate && course.followupPracticeTemplateId ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onStartPracticeTemplate(course.followupPracticeTemplateId as string)}
          style={styles.courseSecondaryActionButton}
        >
          <Text style={styles.courseSecondaryActionText}>
            练跟进 · {getPracticeTemplateTitle(followupTemplate)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricCardLabel}>{label}</Text>
      <Text style={styles.metricCardValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoDetail}>{detail}</Text>
    </View>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileMetricCard}>
      <Text style={styles.profileMetricValue}>{value}</Text>
      <Text style={styles.profileMetricLabel}>{label}</Text>
    </View>
  );
}

function ScoreBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scoreBox}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  );
}

function ChordFingeringGuide({ chordName, compact = false }: { chordName: string; compact?: boolean }) {
  const chord = getBeginnerChord(chordName);
  if (!chord) return null;

  return (
    <View style={[styles.fingeringGuide, compact && styles.fingeringGuideCompact]}>
      <ChordDiagram chord={chord} compact={compact} />
      <Text style={[styles.fingeringHelp, compact && styles.fingeringHelpCompact]}>
        {compact ? `指法 ${chord.fingering.join("-")} · 数字为手指` : "只弹 ○ / ● 的弦；× 的弦不弹。● 里的数字是手指编号：1 食指 · 2 中指 · 3 无名指。"}
      </Text>
    </View>
  );
}

function ChordTransitionFocusPanel({
  chordNames,
  activeChordName
}: {
  chordNames: string[];
  activeChordName: string;
}) {
  const visibleNames = chordNames.slice(0, 2);
  if (visibleNames.length < 2) return null;

  return (
    <View style={styles.chordTransitionFocusPanel}>
      <View style={styles.chordTransitionFocusHeader}>
        <Text style={styles.chordTransitionFocusTitle}>换和弦指法对照</Text>
        <Text style={styles.chordTransitionFocusMeta}>看图换指，不只看代码</Text>
      </View>
      <View style={styles.chordTransitionDiagramRow}>
        {visibleNames.map((name, index) => {
          const chord = getBeginnerChord(name);
          if (!chord) return null;
          const active = name === activeChordName;
          return (
            <View key={`transition-focus-${name}`} style={[styles.chordTransitionDiagramCard, active && styles.chordTransitionDiagramCardActive]}>
              <Text style={[styles.chordTransitionDiagramLabel, active && styles.chordTransitionDiagramLabelActive]}>
                {index === 0 ? "起始" : "换到"} · {name}
              </Text>
              <ChordDiagram chord={chord} compact />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ChordDiagram({ chord, compact = false }: { chord: NonNullable<ReturnType<typeof getBeginnerChord>>; compact?: boolean }) {
  const fretsToShow = Math.max(4, Math.max(...chord.fingering) + 1);

  return (
    <View style={styles.chordDiagram}>
      <View style={[styles.chordBadgeLarge, compact && styles.chordBadgeCompact]}>
        <Text style={[styles.chordBadgeLargeText, compact && styles.chordBadgeCompactText]}>{chord.name}</Text>
      </View>
      <View style={[styles.chordBoard, compact && styles.chordBoardCompact]}>
        <View style={[styles.playMarkerRow, compact && styles.playMarkerRowCompact]}>
          {chord.fingering.map((fret, index) => (
            <Text key={`${chord.id}-marker-${index}`} style={[styles.playMarker, compact && styles.playMarkerCompact]}>
              {fret < 0 ? "×" : fret === 0 ? "○" : "●"}
            </Text>
          ))}
        </View>
        <View style={styles.boardRow}>
          <View style={[styles.fretNumberRail, compact && styles.fretNumberRailCompact]}>
            {Array.from({ length: fretsToShow }, (_, index) => (
              <Text key={`${chord.id}-fret-${index}`} style={[styles.fretNumberLabel, compact && styles.fretNumberLabelCompact]}>{index + 1}</Text>
            ))}
          </View>
          <View style={[styles.fretboard, compact && styles.fretboardCompact]}>
            {ukuleleStringLabels.map((label, index) => (
              <View
                key={`${chord.id}-string-${label}`}
                style={[styles.stringLine, { left: `${(index / (ukuleleStringLabels.length - 1)) * 100}%` }]}
              />
            ))}
            {Array.from({ length: fretsToShow + 1 }, (_, index) => (
              <View
                key={`${chord.id}-line-${index}`}
                style={[styles.fretLine, index === 0 && styles.nutLine, { top: `${(index / fretsToShow) * 100}%` }]}
              />
            ))}
            {chord.fingering.map((fret, index) => {
              if (fret <= 0) return null;
              const finger = chord.fingers[index] || fret;
              return (
                <View
                  key={`${chord.id}-dot-${index}`}
                  style={[
                    styles.fingerDot,
                    compact && styles.fingerDotCompact,
                    {
                      left: `${(index / (ukuleleStringLabels.length - 1)) * 100}%`,
                      top: `${((fret - 0.5) / fretsToShow) * 100}%`
                    }
                  ]}
                >
                  <Text style={[styles.fingerDotText, compact && styles.fingerDotTextCompact]}>{finger}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={[styles.diagramStringLabels, compact && styles.diagramStringLabelsCompact]}>
          {ukuleleStringLabels.map((label) => (
            <Text key={`${chord.id}-label-${label}`} style={[styles.diagramStringLabel, compact && styles.diagramStringLabelCompact]}>{label}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function MicroChordDiagram({ chord }: { chord: NonNullable<ReturnType<typeof getBeginnerChord>> }) {
  const fretsToShow = 4;

  return (
    <View style={styles.microChordDiagram}>
      <View style={styles.microMarkerRow}>
        {chord.fingering.map((fret, index) => (
          <Text key={`${chord.id}-micro-marker-${index}`} style={styles.microMarker}>
            {fret < 0 ? "×" : fret === 0 ? "○" : "●"}
          </Text>
        ))}
      </View>
      <View style={styles.microFretboard}>
        {ukuleleStringLabels.map((label, index) => (
          <View
            key={`${chord.id}-micro-string-${label}`}
            style={[styles.microStringLine, { left: `${(index / (ukuleleStringLabels.length - 1)) * 100}%` }]}
          />
        ))}
        {Array.from({ length: fretsToShow + 1 }, (_, index) => (
          <View
            key={`${chord.id}-micro-fret-${index}`}
            style={[styles.microFretLine, index === 0 && styles.microNutLine, { top: `${(index / fretsToShow) * 100}%` }]}
          />
        ))}
        {chord.fingering.map((fret, index) => {
          if (fret <= 0) return null;
          return (
            <View
              key={`${chord.id}-micro-dot-${index}`}
              style={[
                styles.microFingerDot,
                {
                  left: `${(index / (ukuleleStringLabels.length - 1)) * 100}%`,
                  top: `${((Math.min(fret, fretsToShow) - 0.5) / fretsToShow) * 100}%`
                }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

function ChordMiniCard({ chordName, dense = false }: { chordName: string; dense?: boolean }) {
  const chord = getBeginnerChord(chordName);
  if (!chord) return <Text style={styles.chordMiniFallback}>{chordName}</Text>;

  return (
    <View style={[styles.chordMiniCard, dense && styles.chordMiniCardDense]}>
      <Text style={[styles.chordMiniName, dense && styles.chordMiniNameDense]}>{chord.name}</Text>
      <MicroChordDiagram chord={chord} />
    </View>
  );
}

function ChordMiniList({ chordNames }: { chordNames: string[] }) {
  const uniqueNames = Array.from(new Set(chordNames.filter(Boolean)));
  if (uniqueNames.length === 0) return null;

  return (
    <View style={styles.chordMiniList}>
      {uniqueNames.map((name) => (
        <ChordMiniCard key={`mini-chord-${name}`} chordName={name} />
      ))}
    </View>
  );
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
    </View>
  );
}

function getBeginnerChord(chordName: string) {
  return beginnerChords.find((chord) => chord.name === chordName);
}

function statusLabel(status?: string) {
  if (status === "in-tune") return "在允许范围内，保持即可";
  if (status === "close") return "基本准，多拨一次确认";
  if (status === "flat") return "弦太松，请拧紧";
  if (status === "sharp") return "弦太紧，请松弦";
  return "等待拾音";
}

function lessonPathStatusLabel(status: LessonPathStatus) {
  if (status === "done") return "已完成";
  if (status === "current") return "当前";
  if (status === "pending") return "待继续";
  return "未解锁";
}

function practicePathStatusLabel(status: PracticePathSummaryItem["status"]) {
  if (status === "passed") return "已达标";
  if (status === "in_progress") return "练习中";
  return "未开始";
}

function tuningActionLabel(cents: number) {
  const amount = Math.abs(cents).toFixed(1);
  if (Math.abs(cents) <= IN_TUNE_CENTS) {
    return `已准 ${amount} cents · 不用调`;
  }
  if (Math.abs(cents) <= ACTION_CENTS) {
    return `基本准 ${amount} cents · 先不动`;
  }
  return cents > 0
    ? `偏高 ${amount} cents · 请松弦`
    : `偏低 ${amount} cents · 请拧紧`;
}

function practiceAction(chord: string, template: PracticeTemplate = defaultPracticeTemplate) {
  if (template.type === "rhythm_pattern") return "下扫节奏";
  if (template.type === "chord_transition") return `换到 ${chord}`;
  if (template.type === "song_fragment") return `歌曲片段 ${chord}`;
  if (chord === "C") return "下扫四拍";
  if (chord === "Am") return "换到 Am";
  if (chord === "F") return "换到 F";
  return "收在 G7";
}

function centsTextStyle(cents: number) {
  if (Math.abs(cents) <= IN_TUNE_CENTS) {
    return { color: successGreen };
  }
  if (Math.abs(cents) <= ACTION_CENTS) {
    return { color: colors.amber };
  }
  return { color: cents > 0 ? colors.coral : "#3A6EA5" };
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.paper
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DED6CA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  appName: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.ink
  },
  subtitle: {
    marginTop: 2,
    color: "#6B6258"
  },
  levelBadge: {
    minWidth: 54,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED6CA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  levelBadgeText: {
    color: colors.forest,
    fontWeight: "900"
  },
  content: {
    padding: 14,
    paddingBottom: 90
  },
  homeContent: {
    flexGrow: 1
  },
  stack: {
    gap: 16
  },
  homeStack: {
    gap: 9
  },
  homeHeroPanel: {
    borderRadius: 15,
    padding: 12,
    backgroundColor: "#E6F7F4",
    borderWidth: 1,
    borderColor: "#C7ECE7"
  },
  homeHeroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8
  },
  homeHeroCopyBlock: {
    flex: 1
  },
  homeEyebrow: {
    color: "#0F766E",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0
  },
  homeTitle: {
    marginTop: 2,
    color: colors.forest,
    fontSize: 22,
    lineHeight: 25,
    fontWeight: "900"
  },
  homeSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16
  },
  homeStreakBadge: {
    minWidth: 56,
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF"
  },
  homeStreakNumber: {
    color: colors.forest,
    fontSize: 17,
    lineHeight: 19,
    fontWeight: "900"
  },
  homeStreakLabel: {
    marginTop: 1,
    color: "#64748B",
    fontSize: 10,
    fontWeight: "900"
  },
  homeCheckinPanel: {
    borderRadius: 13,
    padding: 10,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: colors.line
  },
  homePanelHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  homePanelTitle: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  homePanelMeta: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800"
  },
  homeCheckinGrid: {
    marginTop: 7,
    flexDirection: "row",
    gap: 3
  },
  homeCheckinDot: {
    flex: 1,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#E2E8F0"
  },
  homeCheckinDotLow: {
    backgroundColor: "#BFEDE7"
  },
  homeCheckinDotMid: {
    backgroundColor: "#5ED5C8"
  },
  homeCheckinDotHigh: {
    backgroundColor: "#0F766E"
  },
  homeModuleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  homeModuleCard: {
    width: "48.7%",
    minHeight: 66,
    borderRadius: 12,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: colors.line
  },
  homeModuleIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2F1"
  },
  homeModuleIconText: {
    fontSize: 18
  },
  homeModuleCopy: {
    flex: 1
  },
  homeModuleTitle: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  homeModuleDetail: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 10,
    lineHeight: 13
  },
  homeRecommendPanel: {
    borderRadius: 14,
    padding: 10,
    gap: 7,
    backgroundColor: colors.forest
  },
  homeRecommendTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  homeRecommendMeta: {
    color: "#D9E4DB",
    fontSize: 11,
    fontWeight: "900"
  },
  homeRecommendDetail: {
    color: "#D9E4DB",
    fontSize: 11,
    lineHeight: 15
  },
  homeMetaGrid: {
    flexDirection: "row",
    gap: 5
  },
  homeMetaBox: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)"
  },
  homeMetaLabel: {
    color: "#BBD2CC",
    fontSize: 9,
    fontWeight: "800"
  },
  homeMetaValue: {
    marginTop: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900"
  },
  homeStartButton: {
    minHeight: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.amber
  },
  homeStartButtonText: {
    color: "#1F2522",
    fontSize: 14,
    fontWeight: "900"
  },
  homeSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  homeSectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  homeSectionAction: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900"
  },
  homeSongList: {
    marginTop: 7,
    gap: 6
  },
  homeSongRow: {
    minHeight: 48,
    borderRadius: 12,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: colors.line
  },
  homeSongIndex: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7"
  },
  homeSongIndexText: {
    color: colors.forest,
    fontWeight: "900"
  },
  homeSongCopy: {
    flex: 1
  },
  homeSongTitle: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: "900"
  },
  homeSongMeta: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 10,
    lineHeight: 13
  },
  homeSongAction: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900"
  },
  homeRecentHint: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17
  },
  practiceHubStack: {
    gap: 10
  },
  practiceHubHeader: {
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#E6F7F4",
    borderWidth: 1,
    borderColor: "#C7ECE7"
  },
  practiceHubTitle: {
    marginTop: 2,
    color: colors.forest,
    fontSize: 23,
    lineHeight: 26,
    fontWeight: "900"
  },
  practiceHubSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16
  },
  practiceHubBadge: {
    minWidth: 66,
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF"
  },
  practiceHubBadgeText: {
    color: colors.forest,
    fontSize: 11,
    fontWeight: "900"
  },
  practiceHubSectionHead: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  practiceHubSectionTitle: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  practiceHubSectionMeta: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800"
  },
  practiceHubFeatureCard: {
    minHeight: 70,
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.forest
  },
  practiceHubGrid: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8
  },
  practiceHubCard: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: colors.line
  },
  practiceHubIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2F1"
  },
  practiceHubIconText: {
    fontSize: 18
  },
  practiceHubCardCopy: {
    flex: 1
  },
  practiceHubFeatureTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  practiceHubFeatureDetail: {
    marginTop: 2,
    color: "#D9E4DB",
    fontSize: 11,
    lineHeight: 15
  },
  practiceHubCardTitle: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  practiceHubCardDetail: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 10,
    lineHeight: 13
  },
  practiceHubPlan: {
    borderRadius: 13,
    padding: 10,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: colors.line
  },
  practiceHubPlanRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  practiceHubStepDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E"
  },
  practiceHubStepText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900"
  },
  practiceHubPlanTitle: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: "900"
  },
  practiceHubPlanDetail: {
    marginTop: 1,
    color: "#64748B",
    fontSize: 10,
    lineHeight: 13
  },
  heroBand: {
    backgroundColor: colors.forest,
    borderRadius: 8,
    padding: 20,
    gap: 12
  },
  heroTitle: {
    color: "#FFF8EC",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 31
  },
  heroCopy: {
    color: "#D9E4DB",
    lineHeight: 22
  },
  completionNotice: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#B7E4C7",
    backgroundColor: "#ECFDF3",
    padding: 12,
    gap: 4
  },
  completionNoticeTitle: {
    color: successGreen,
    fontSize: 15,
    fontWeight: "900"
  },
  completionNoticeDetail: {
    color: colors.forest,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  lessonPathPanel: {
    minHeight: 142,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: 8,
    padding: 10
  },
  courseFilterRow: {
    flexDirection: "row",
    gap: 8
  },
  courseFilterButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#EEE8DC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8
  },
  courseFilterButtonActive: {
    borderColor: colors.forest,
    backgroundColor: colors.forest
  },
  courseFilterText: {
    color: "#756D64",
    fontSize: 13,
    fontWeight: "900"
  },
  courseFilterTextActive: {
    color: "#FFF8EC"
  },
  lessonPathNodeWrap: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingVertical: 4
  },
  lessonPathNodeSelected: {
    backgroundColor: "#F7EFE2"
  },
  lessonPathDot: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED6CA",
    backgroundColor: "#EEE8DC",
    alignItems: "center",
    justifyContent: "center"
  },
  lessonPathDotDone: {
    borderColor: successGreen,
    backgroundColor: successGreen
  },
  lessonPathDotCurrent: {
    borderColor: colors.amber,
    backgroundColor: colors.amber
  },
  lessonPathDotLocked: {
    opacity: 0.55
  },
  lessonPathDotText: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "900"
  },
  lessonPathDotTextActive: {
    color: "#FFF8EC"
  },
  lessonPathTitle: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  lessonPathDetail: {
    color: "#756D64",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center"
  },
  lessonPathMeta: {
    color: "#9A9288",
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center"
  },
  lessonPathStatus: {
    marginTop: "auto",
    color: "#756D64",
    fontSize: 11,
    fontWeight: "800"
  },
  lessonPathStatusDone: {
    color: successGreen
  },
  courseDetailPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
    gap: 10
  },
  courseStateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F8F3EA"
  },
  courseStatePill: {
    minWidth: 54,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: "#756D64",
    backgroundColor: "#E6DED0",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  courseStatePillDone: {
    color: successGreen,
    backgroundColor: "#DCFCE7"
  },
  courseStatePillCurrent: {
    color: "#B45309",
    backgroundColor: "#FEF3C7"
  },
  courseStatePillLocked: {
    color: "#6D28D9",
    backgroundColor: "#F3E8FF"
  },
  courseStateHint: {
    flex: 1,
    color: colors.forest,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16
  },
  courseDetailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  courseDetailCopy: {
    flex: 1,
    gap: 4
  },
  courseDetailEyebrow: {
    color: "#8A8176",
    fontSize: 12,
    fontWeight: "800"
  },
  courseDetailTitle: {
    color: colors.forest,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23
  },
  courseDetailSubtitle: {
    color: "#756D64",
    fontSize: 13,
    lineHeight: 18
  },
  courseProgressBadge: {
    minWidth: 54,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#E6F4EA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8
  },
  courseProgressBadgeText: {
    color: successGreen,
    fontSize: 15,
    fontWeight: "900"
  },
  courseProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#EAE2D5",
    overflow: "hidden"
  },
  courseProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: successGreen
  },
  courseSegmentGrid: {
    flexDirection: "row",
    gap: 8
  },
  courseSegmentItem: {
    flex: 1,
    minHeight: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#F8F3EA",
    padding: 8,
    gap: 6
  },
  courseSegmentDone: {
    borderColor: successGreen,
    backgroundColor: "#ECFDF3"
  },
  courseSegmentActive: {
    borderColor: colors.amber,
    backgroundColor: "#FFF4D6"
  },
  courseSegmentIndex: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#E6DED0",
    color: colors.forest,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 24
  },
  courseSegmentIndexActive: {
    backgroundColor: colors.forest,
    color: "#FFF8EC"
  },
  courseSegmentText: {
    color: colors.forest,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16
  },
  courseResourcePanel: {
    borderRadius: 8,
    backgroundColor: "#F8F3EA",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    gap: 8
  },
  courseResourceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  courseResourceLabel: {
    width: 36,
    color: "#8A8176",
    fontSize: 12,
    fontWeight: "900"
  },
  courseResourceValue: {
    flex: 1,
    color: colors.forest,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  courseResourceBody: {
    flex: 1,
    gap: 6
  },
  courseActionButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center"
  },
  courseSecondaryActionButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#F8F3EA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  courseSecondaryActionText: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  practiceCoursePanel: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 10,
    gap: 10
  },
  practiceCourseBadge: {
    minWidth: 62,
    borderRadius: 8,
    backgroundColor: "#E6F4EA",
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: "center"
  },
  practiceCourseBadgeText: {
    color: successGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  practiceCourseCopy: {
    flex: 1,
    gap: 3
  },
  practiceCourseTitle: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  practiceCourseMeta: {
    color: "#756D64",
    fontSize: 12,
    lineHeight: 17
  },
  songDetailCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
    gap: 12
  },
  songDetailCardLocked: {
    opacity: 0.72
  },
  songDetailBackButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    borderRadius: 999,
    backgroundColor: "#EEE8DC",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  songDetailBackText: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: "900"
  },
  songDetailHeroCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
    gap: 12
  },
  songDetailGoal: {
    color: "#756D64",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700"
  },
  songPrepPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 10
  },
  songRouteGrid: {
    flexDirection: "row",
    gap: 8
  },
  songRouteStep: {
    flex: 1,
    minHeight: 96,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 10,
    gap: 5
  },
  songRouteIndex: {
    width: 24,
    height: 24,
    borderRadius: 999,
    overflow: "hidden",
    color: "#FFF8EC",
    backgroundColor: colors.forest,
    textAlign: "center",
    lineHeight: 24,
    fontSize: 12,
    fontWeight: "900"
  },
  songRouteTitle: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: "900"
  },
  songRouteDetail: {
    color: "#756D64",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700"
  },
  songSearchPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 10,
    gap: 10
  },
  songSearchInput: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: "#F2EBDD",
    color: colors.forest,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 12
  },
  songFilterRow: {
    flexDirection: "row",
    gap: 8
  },
  songFilterButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: "#F2EBDD",
    alignItems: "center",
    justifyContent: "center"
  },
  songFilterButtonActive: {
    backgroundColor: colors.forest
  },
  songFilterText: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "900"
  },
  songFilterTextActive: {
    color: "#FFF8EC"
  },
  emptyPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 14
  },
  chordLibraryHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  chordLibraryCountBadge: {
    minWidth: 58,
    minHeight: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCECE2",
    paddingHorizontal: 10
  },
  chordLibraryCountText: {
    color: colors.forest,
    fontWeight: "900"
  },
  chordSearchPanelApp: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  chordSearchInputApp: {
    minHeight: 44,
    color: colors.ink,
    fontWeight: "800"
  },
  chordCategoryRowApp: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8
  },
  chordCategoryButtonApp: {
    minWidth: 86,
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  chordCategoryButtonActiveApp: {
    backgroundColor: colors.forest
  },
  chordCategoryTextApp: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "900"
  },
  chordCategoryMetaApp: {
    marginTop: 2,
    color: "#8A8176",
    fontSize: 9,
    fontWeight: "800"
  },
  chordCategoryTextActiveApp: {
    color: "#FFF8EC"
  },
  chordLibraryGridApp: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  chordLibraryCardApp: {
    width: "31.7%",
    minHeight: 210,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 7,
    alignItems: "center",
    gap: 4
  },
  chordLibraryNameApp: {
    color: colors.forest,
    fontSize: 18,
    fontWeight: "900"
  },
  chordLibraryFingeringApp: {
    color: "#756D64",
    fontSize: 10,
    fontWeight: "800"
  },
  chordFavoriteRowApp: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chordFavoriteCardApp: {
    width: "23.5%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 6,
    alignItems: "center",
    gap: 4
  },
  songDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  songAvatar: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: "#FFE4D6",
    alignItems: "center",
    justifyContent: "center"
  },
  songAvatarText: {
    color: colors.coral,
    fontSize: 28,
    fontWeight: "900"
  },
  songTitleBlock: {
    flex: 1,
    gap: 5
  },
  songTitle: {
    color: colors.forest,
    fontSize: 18,
    fontWeight: "900"
  },
  songMeta: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "700"
  },
  songChordLine: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: "900"
  },
  songAccessBadge: {
    minWidth: 44,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E6F4EA",
    color: successGreen,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 26,
    textAlign: "center"
  },
  songAccessBadgeLocked: {
    backgroundColor: "#F2EBDD",
    color: "#756D64"
  },
  songLineList: {
    gap: 6
  },
  songPreviewLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 8,
    backgroundColor: "#F8F3EA",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  songPreviewChord: {
    width: 34,
    color: colors.coral,
    fontSize: 14,
    fontWeight: "900"
  },
  songPreviewText: {
    flex: 1,
    color: "#756D64",
    fontSize: 12,
    lineHeight: 17
  },
  songPracticeButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center"
  },
  songMelodyButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.coral,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center"
  },
  songMelodyButtonText: {
    color: colors.coral,
    fontSize: 15,
    fontWeight: "900"
  },
  songPracticeButtonDisabled: {
    backgroundColor: "#E6DED0"
  },
  songPracticeButtonTextDisabled: {
    color: "#756D64"
  },
  melodyHeroCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
    gap: 12
  },
  melodySongTitle: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25
  },
  melodyTargetPanel: {
    minHeight: 160,
    borderRadius: 8,
    backgroundColor: "#F8F3EA",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 8
  },
  melodyTargetNote: {
    color: colors.coral,
    fontSize: 64,
    fontWeight: "900",
    lineHeight: 72
  },
  melodyTargetMeta: {
    color: colors.forest,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center"
  },
  melodyPhraseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  melodyNoteChip: {
    width: "22.5%",
    minHeight: 66,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5DED4",
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
    gap: 2
  },
  melodyNoteChipActive: {
    borderColor: colors.coral,
    backgroundColor: colors.coral
  },
  melodyNoteChipDone: {
    borderColor: successGreen
  },
  melodyNoteIndex: {
    color: "#9A9288",
    fontSize: 10,
    fontWeight: "900"
  },
  melodyNoteText: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: "900"
  },
  melodyNoteMeta: {
    color: "#756D64",
    fontSize: 11,
    fontWeight: "800"
  },
  melodyNoteTextActive: {
    color: "#FFF8EC"
  },
  melodyControlPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
    gap: 12
  },
  melodyFeedbackText: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center"
  },
  chordLibraryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  chordLibraryCard: {
    width: "48%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 10,
    alignItems: "center",
    gap: 6
  },
  chordLibraryName: {
    color: colors.forest,
    fontSize: 18,
    fontWeight: "900"
  },
  chordLibraryMeta: {
    color: "#756D64",
    fontSize: 11,
    fontWeight: "700"
  },
  learnHero: {
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#E6F7F4",
    borderWidth: 1,
    borderColor: "#C7ECE7"
  },
  learnHeroTitle: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: "900"
  },
  learnHeroCopy: {
    marginTop: 8,
    color: "#64748B",
    lineHeight: 20
  },
  learnSummaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14
  },
  learnTopicGrid: {
    gap: 10
  },
  learnTopicCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: colors.line
  },
  learnTopicIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: "hidden",
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: "#E6F7F4",
    fontSize: 19
  },
  learnTopicCopy: {
    flex: 1
  },
  learnTopicTitle: {
    color: colors.forest,
    fontSize: 16,
    fontWeight: "900"
  },
  learnTopicDetail: {
    marginTop: 5,
    color: "#756D64",
    lineHeight: 19
  },
  lockedSongRow: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#F8F3EA",
    padding: 12,
    gap: 4
  },
  lockedSongTitle: {
    color: colors.forest,
    fontSize: 15,
    fontWeight: "900"
  },
  lockedSongMeta: {
    color: "#756D64",
    fontSize: 12,
    lineHeight: 17
  },
  profileHero: {
    borderRadius: 8,
    backgroundColor: colors.forest,
    padding: 16,
    gap: 12
  },
  profileHeroTitle: {
    color: "#FFF8EC",
    fontSize: 20,
    fontWeight: "900"
  },
  profileHeroCopy: {
    color: "#D9E4DB",
    fontSize: 13,
    lineHeight: 20
  },
  profileCoursePanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
    gap: 10
  },
  profilePanelHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  profilePanelCopy: {
    flex: 1,
    gap: 3
  },
  profilePanelTitle: {
    color: colors.forest,
    fontSize: 15,
    fontWeight: "900"
  },
  profilePanelMeta: {
    color: "#756D64",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700"
  },
  profileProgressBadge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: successGreen,
    backgroundColor: "#DCFCE7",
    fontSize: 12,
    fontWeight: "900"
  },
  profileProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#EAE2D5",
    overflow: "hidden"
  },
  profileProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: successGreen
  },
  profileCourseStrip: {
    flexDirection: "row",
    gap: 5
  },
  profileCourseStep: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB"
  },
  profileCourseStepDone: {
    backgroundColor: successGreen
  },
  profileCourseStepCurrent: {
    backgroundColor: colors.amber
  },
  profileScoreGrid: {
    flexDirection: "row",
    gap: 8
  },
  profileMetricCard: {
    flex: 1,
    minHeight: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
    padding: 8
  },
  profileMetricValue: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: "900"
  },
  profileMetricLabel: {
    marginTop: 3,
    color: "#756D64",
    fontSize: 11,
    fontWeight: "800"
  },
  profileAdviceCard: {
    minHeight: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  profileAdviceArrow: {
    width: 30,
    height: 30,
    borderRadius: 999,
    overflow: "hidden",
    color: "#FFF8EC",
    backgroundColor: colors.forest,
    textAlign: "center",
    lineHeight: 30,
    fontSize: 20,
    fontWeight: "900"
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  badgeCard: {
    width: "48%",
    minHeight: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: successGreen,
    backgroundColor: "#ECFDF3",
    padding: 12,
    gap: 6
  },
  badgeCardLocked: {
    borderColor: colors.line,
    backgroundColor: "#F8F3EA"
  },
  badgeMark: {
    width: 28,
    height: 28,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: colors.forest,
    color: "#FFF8EC",
    textAlign: "center",
    lineHeight: 28,
    fontWeight: "900"
  },
  badgeLabel: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  badgeValue: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "700"
  },
  reviewReportPanel: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8
  },
  reviewReportNote: {
    color: "#756D64",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700"
  },
  pathSummaryList: {
    gap: 8
  },
  pathSummaryRow: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#F8F3EA",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  pathSummaryCopy: {
    flex: 1,
    gap: 3
  },
  pathSummaryTitle: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: "900"
  },
  pathSummaryMeta: {
    color: "#756D64",
    fontSize: 11,
    fontWeight: "700"
  },
  pathSummaryBadge: {
    minWidth: 56,
    borderRadius: 999,
    backgroundColor: "#EEE8DC",
    color: "#756D64",
    paddingHorizontal: 9,
    paddingVertical: 5,
    overflow: "hidden",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "900"
  },
  pathSummaryBadgePassed: {
    backgroundColor: "#E6F4EA",
    color: successGreen
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.amber,
    borderRadius: 8,
    paddingHorizontal: 16
  },
  primaryInlineButton: {
    minHeight: 48,
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.amber,
    paddingHorizontal: 12
  },
  primaryButtonText: {
    color: "#1F2522",
    fontWeight: "800"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink
  },
  sectionDetail: {
    marginTop: 4,
    color: "#756D64"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricCard: {
    width: "48%",
    minHeight: 80,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: "center",
    padding: 14
  },
  metricCardLabel: {
    color: "#756D64"
  },
  metricCardValue: {
    marginTop: 6,
    color: colors.forest,
    fontSize: 20,
    fontWeight: "900"
  },
  list: {
    gap: 10
  },
  infoRow: {
    minHeight: 64,
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  infoTitle: {
    color: colors.forest,
    fontWeight: "900"
  },
  infoDetail: {
    color: "#756D64",
    textAlign: "right",
    flexShrink: 1
  },
  tunerTopRow: {
    minHeight: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900"
  },
  screenSubtitle: {
    marginTop: 2,
    color: "#756D64",
    fontWeight: "700"
  },
  tuningBadge: {
    minWidth: 62,
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDF8"
  },
  tuningBadgeText: {
    color: colors.forest,
    fontWeight: "900"
  },
  tunerPermissionPanel: {
    minHeight: 68,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  tunerAuthButton: {
    minHeight: 44,
    minWidth: 66,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.amber,
    paddingHorizontal: 12
  },
  tunerAuthButtonReady: {
    backgroundColor: "#DDF3E7"
  },
  tunerAuthButtonText: {
    color: colors.ink,
    fontWeight: "900"
  },
  micPanel: {
    minHeight: 76,
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  micCopy: {
    flex: 1,
    gap: 4
  },
  micButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forest,
    paddingHorizontal: 12
  },
  micButtonReady: {
    backgroundColor: colors.amber
  },
  micButtonText: {
    color: "#FFF8EC",
    fontWeight: "900"
  },
  disabledButton: {
    opacity: 0.72
  },
  tunerStatusGrid: {
    flexDirection: "row",
    gap: 8
  },
  tunerStatusCard: {
    flex: 1,
    minHeight: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6
  },
  tunerStatusCardDone: {
    borderColor: successGreen,
    backgroundColor: "#F0FDF4"
  },
  tunerStatusLabel: {
    color: colors.ink,
    fontWeight: "900"
  },
  tunerStatusLabelDone: {
    color: successGreen
  },
  tunerStatusDetail: {
    marginTop: 3,
    color: "#756D64",
    fontSize: 11,
    fontWeight: "800"
  },
  pipelinePanel: {
    flexDirection: "row",
    gap: 8
  },
  pipelineItem: {
    flex: 1,
    minHeight: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6
  },
  pipelineItemDone: {
    borderColor: successGreen,
    backgroundColor: "#F0FDF4"
  },
  pipelineLabel: {
    color: colors.ink,
    fontWeight: "900"
  },
  pipelineLabelDone: {
    color: successGreen
  },
  pipelineDetail: {
    marginTop: 3,
    color: "#756D64",
    fontSize: 11,
    fontWeight: "800"
  },
  inputPanel: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  levelValue: {
    color: colors.forest,
    fontSize: 24,
    fontWeight: "900"
  },
  levelTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#EEE8DC",
    overflow: "hidden"
  },
  levelFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.amber
  },
  inputMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  tunerNoiseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  tunerNoiseValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  inputMeta: {
    color: "#756D64",
    fontSize: 12
  },
  realtimeDebugGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  realtimeDebugCard: {
    width: "48.5%",
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5DED4",
    backgroundColor: "#FFFDF8",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2
  },
  realtimeDebugCardActive: {
    borderColor: "#B8E3DA",
    backgroundColor: "#F0FDFA"
  },
  realtimeDebugLabel: {
    color: "#756D64",
    fontSize: 10,
    fontWeight: "800"
  },
  realtimeDebugValue: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  realtimeDebugDetail: {
    color: "#8A8176",
    fontSize: 10,
    fontWeight: "700"
  },
  errorText: {
    color: colors.coral,
    fontWeight: "800"
  },
  recorderButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forest,
    paddingHorizontal: 12
  },
  recorderButtonStop: {
    backgroundColor: colors.coral
  },
  realtimeButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2F7A9A",
    paddingHorizontal: 12
  },
  recorderButtonText: {
    color: "#FFF8EC",
    fontWeight: "900"
  },
  tunerActionRow: {
    flexDirection: "row",
    gap: 8
  },
  tunerActionButton: {
    flex: 1,
    minHeight: 44
  },
  listItem: {
    color: "#4C4944",
    lineHeight: 22
  },
  tunerDial: {
    minHeight: 254,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12
  },
  tunerGauge: {
    position: "relative",
    width: 216,
    height: 216,
    borderRadius: 108,
    borderWidth: 12,
    borderColor: "#DDF3E7",
    backgroundColor: "#F8FBF8",
    alignItems: "center",
    justifyContent: "center"
  },
  tunerGaugeCenter: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8
  },
  tunerGaugeNeedle: {
    position: "absolute",
    left: 100,
    top: 18,
    width: 4,
    height: 88,
    borderRadius: 999,
    backgroundColor: colors.coral,
    transformOrigin: "50% 100%"
  },
  noteText: {
    fontSize: 54,
    fontWeight: "900",
    color: colors.forest
  },
  centsText: {
    fontSize: 14,
    fontWeight: "800"
  },
  statusText: {
    color: "#5E6D62",
    fontWeight: "800",
    textAlign: "center",
    fontSize: 12
  },
  needleMarkOk: {
    backgroundColor: successGreen
  },
  tunerHint: {
    color: "#756D64",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "700"
  },
  stringRow: {
    flexDirection: "row",
    gap: 8
  },
  stringButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9D1C4",
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  stringButtonActive: {
    borderColor: colors.forest,
    backgroundColor: "#E7F1EA"
  },
  stringButtonTuned: {
    borderColor: successGreen,
    backgroundColor: "#ECFDF5"
  },
  stringNote: {
    fontWeight: "900",
    color: "#3B3935"
  },
  stringNoteActive: {
    color: colors.forest
  },
  frequencyText: {
    marginTop: 4,
    fontSize: 11,
    color: "#82786C"
  },
  metricPanel: {
    minHeight: 178,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18
  },
  metricValue: {
    fontSize: 64,
    fontWeight: "900",
    color: colors.forest
  },
  metricLabel: {
    color: "#756D64"
  },
  controlRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  secondaryButton: {
    minHeight: 48,
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC",
    paddingHorizontal: 12
  },
  secondaryButtonText: {
    color: colors.forest,
    fontWeight: "900"
  },
  metronomeHeader: {
    minHeight: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  metronomeTempoPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 14,
    alignItems: "center",
    gap: 4
  },
  metronomeTempoLabel: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "900"
  },
  metronomeBpmValue: {
    color: colors.forest,
    fontSize: 64,
    lineHeight: 68,
    fontWeight: "900"
  },
  metronomePresetRow: {
    width: "100%",
    marginTop: 8,
    flexDirection: "row",
    gap: 8
  },
  metronomePresetButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC",
    paddingHorizontal: 6
  },
  metronomePresetButtonActive: {
    backgroundColor: colors.forest
  },
  metronomePresetText: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  metronomePresetTextActive: {
    color: "#FFF8EC"
  },
  metronomeBeatPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 10
  },
  metronomePanelHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  metronomePanelTitle: {
    color: colors.ink,
    fontWeight: "900"
  },
  metronomePanelMeta: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "800"
  },
  metronomeBeatRow: {
    flexDirection: "row",
    gap: 8
  },
  metronomeBeatCell: {
    flex: 1,
    minHeight: 76,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F1E7",
    gap: 4
  },
  metronomeBeatCellActive: {
    borderWidth: 2,
    borderColor: colors.amber,
    backgroundColor: "#FFF8EC"
  },
  metronomeBeatDot: {
    width: 22,
    height: 22,
    borderRadius: 999
  },
  metronomeBeatDotAccent: {
    backgroundColor: accentBeatRed
  },
  metronomeBeatDotLight: {
    backgroundColor: lightBeatBlue
  },
  metronomeBeatDotActive: {
    width: 32,
    height: 32,
    borderWidth: 4,
    borderColor: "#FFF8EC"
  },
  metronomeBeatNumber: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  metronomeBeatNumberActive: {
    color: colors.forest
  },
  metronomeBeatKind: {
    color: "#756D64",
    fontSize: 10,
    fontWeight: "900"
  },
  metronomeHint: {
    color: "#756D64",
    fontSize: 12,
    lineHeight: 17
  },
  metronomeStatusPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 8
  },
  metronomeStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  metronomeRhythmButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forest
  },
  beatGrid: {
    flexDirection: "row",
    gap: 8
  },
  beatCell: {
    flex: 1,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line
  },
  beatAccent: {
    backgroundColor: colors.forest,
    borderColor: colors.forest
  },
  beatText: {
    fontWeight: "900",
    color: colors.ink
  },
  beatTextActive: {
    color: "#FFF8EC"
  },
  chordCard: {
    minHeight: 84,
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  chordCardCopy: {
    flex: 1,
    minWidth: 0
  },
  chordName: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.forest
  },
  chordMeta: {
    marginTop: 3,
    color: "#756D64"
  },
  fretRow: {
    flexDirection: "row",
    gap: 5
  },
  fretCell: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: 6,
    backgroundColor: "#EEE8DC",
    alignItems: "center",
    justifyContent: "center"
  },
  fretText: {
    color: colors.forest,
    fontWeight: "900"
  },
  practiceSession: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8
  },
  sessionEyebrow: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "800"
  },
  sessionTitle: {
    marginTop: 3,
    color: colors.forest,
    fontSize: 17,
    fontWeight: "900"
  },
  sessionPill: {
    color: colors.forest,
    backgroundColor: "#DCECE2",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "900"
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#EEE8DC",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: successGreen
  },
  sessionMeta: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "700"
  },
  practiceCueText: {
    borderRadius: 8,
    backgroundColor: "#F8F3EA",
    color: colors.forest,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  practiceTargetInsight: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DED6CA",
    backgroundColor: "#FFFDF8",
    gap: 8
  },
  practiceTargetInsightHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  practiceTargetInsightLabel: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: "900"
  },
  practiceTargetInsightMeta: {
    flex: 1,
    color: "#756D64",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
    textAlign: "right"
  },
  practiceTargetInsightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  practiceTargetMiniCard: {
    flexGrow: 1,
    flexBasis: "48%",
    minHeight: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E6DED1",
    backgroundColor: "#F7F1E7",
    padding: 8
  },
  practiceTargetMiniCardActive: {
    borderColor: colors.forest,
    backgroundColor: "#E7F1EA"
  },
  practiceTargetMiniCardDone: {
    borderColor: successGreen,
    backgroundColor: "#F0FDF4"
  },
  practiceTargetMiniIndex: {
    alignSelf: "flex-start",
    minWidth: 20,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#EEE8DC",
    color: "#756D64",
    fontSize: 11,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "900"
  },
  practiceTargetMiniIndexActive: {
    backgroundColor: colors.forest,
    color: "#FFF8EC"
  },
  practiceTargetMiniTitle: {
    marginTop: 5,
    color: colors.forest,
    fontSize: 12,
    fontWeight: "900"
  },
  practiceTargetMiniTitleActive: {
    color: colors.forest
  },
  practiceTargetMiniDetail: {
    marginTop: 2,
    color: "#756D64",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700"
  },
  practiceTargetMiniDetailActive: {
    color: colors.ink,
    fontWeight: "800"
  },
  practiceMainGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10
  },
  practiceChordColumn: {
    flex: 1.08
  },
  practiceCoachColumn: {
    flex: 0.92,
    gap: 8
  },
  practiceOptionPanel: {
    gap: 6
  },
  templatePicker: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  pathHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2
  },
  pathTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  pathMeta: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "800"
  },
  templateChip: {
    minWidth: "48%",
    flexGrow: 1,
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFDF8",
    justifyContent: "center",
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  templateChipActive: {
    borderColor: colors.forest,
    backgroundColor: "#DCECE2"
  },
  templateChipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  templateStepBadge: {
    minWidth: 18,
    minHeight: 18,
    borderRadius: 999,
    overflow: "hidden",
    color: "#756D64",
    backgroundColor: "#EEE8DC",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 18,
    fontWeight: "900"
  },
  templateStepBadgeActive: {
    color: "#FFF8EC",
    backgroundColor: colors.forest
  },
  templateChipType: {
    color: "#756D64",
    fontSize: 11,
    fontWeight: "900"
  },
  templateChipTitle: {
    marginTop: 2,
    color: colors.forest,
    fontSize: 12,
    fontWeight: "900"
  },
  templateChipSubtitle: {
    marginTop: 3,
    color: "#756D64",
    fontSize: 10,
    lineHeight: 13
  },
  templateChipTextActive: {
    color: colors.forest
  },
  segmentRow: {
    flexDirection: "row",
    gap: 6
  },
  segmentButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC",
    paddingHorizontal: 6
  },
  segmentButtonActive: {
    backgroundColor: colors.forest
  },
  segmentButtonText: {
    color: "#756D64",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  segmentButtonTextActive: {
    color: "#FFF8EC"
  },
  practiceBeatPanel: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F7F1E7",
    borderWidth: 1,
    borderColor: "#DED6CA",
    gap: 7
  },
  practiceBeatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  practiceBeatTitle: {
    color: colors.forest,
    fontWeight: "900"
  },
  practiceBeatMeta: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "800"
  },
  practiceBeatGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6
  },
  practiceBeatDotWrap: {
    minWidth: 28,
    alignItems: "center",
    gap: 4
  },
  practiceBeatDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    opacity: 0.48
  },
  practiceBeatDotAccent: {
    backgroundColor: accentBeatRed
  },
  practiceBeatDotLight: {
    backgroundColor: lightBeatBlue
  },
  practiceBeatDotActive: {
    width: 24,
    height: 24,
    opacity: 1,
    borderWidth: 3,
    borderColor: "#FFF8EC"
  },
  practiceBeatText: {
    color: "#756D64",
    fontSize: 11,
    fontWeight: "900"
  },
  practiceBeatTextActive: {
    color: colors.forest
  },
  bpmAdjustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  bpmStepButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC"
  },
  bpmStepText: {
    color: colors.forest,
    fontWeight: "900"
  },
  practiceBeatHint: {
    color: "#756D64",
    fontSize: 11,
    lineHeight: 15
  },
  soundToggleButton: {
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC"
  },
  soundToggleButtonActive: {
    backgroundColor: "#DCECE2"
  },
  soundToggleText: {
    color: "#756D64",
    fontWeight: "900"
  },
  soundToggleTextActive: {
    color: colors.forest
  },
  practiceSoundStatus: {
    color: "#756D64",
    fontSize: 10,
    lineHeight: 13
  },
  rhythmRunner: {
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8
  },
  rhythmHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  rhythmRunnerTitle: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: "900"
  },
  rhythmTemplateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  rhythmTemplateButton: {
    flexGrow: 1,
    flexBasis: "31%",
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#F7F1E7",
    justifyContent: "center",
    paddingHorizontal: 6
  },
  rhythmTemplateButtonActive: {
    borderColor: colors.forest,
    backgroundColor: "#DCECE2"
  },
  rhythmTemplateText: {
    color: colors.forest,
    fontSize: 11,
    fontWeight: "900"
  },
  rhythmTemplateMeta: {
    marginTop: 1,
    color: "#756D64",
    fontSize: 9,
    fontWeight: "800"
  },
  rhythmTemplateTextActive: {
    color: colors.forest
  },
  rhythmActionPanel: {
    borderRadius: 8,
    backgroundColor: "#F8F3EA",
    padding: 10,
    gap: 4,
    alignItems: "center"
  },
  rhythmActionLabel: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "900"
  },
  rhythmActionText: {
    color: colors.forest,
    fontSize: 56,
    fontWeight: "900",
    lineHeight: 60,
    textAlign: "center"
  },
  rhythmActionDetail: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    textAlign: "center"
  },
  rhythmDotGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexWrap: "wrap"
  },
  rhythmDotWrap: {
    minWidth: 38,
    alignItems: "center",
    gap: 3
  },
  rhythmDot: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.55
  },
  rhythmDotAccent: {
    backgroundColor: accentBeatRed
  },
  rhythmDotLight: {
    backgroundColor: lightBeatBlue
  },
  rhythmDotActive: {
    width: 42,
    height: 42,
    opacity: 1,
    borderWidth: 4,
    borderColor: "#FFF8EC"
  },
  rhythmDotText: {
    color: "#FFF8EC",
    fontSize: 18,
    fontWeight: "900"
  },
  rhythmControlGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  rhythmBpmBadge: {
    width: 86,
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center"
  },
  rhythmBpmValue: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24
  },
  rhythmBpmUnit: {
    color: "#756D64",
    fontSize: 10,
    fontWeight: "900"
  },
  rhythmStatsGrid: {
    flexDirection: "row",
    gap: 6
  },
  rhythmScorePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 6
  },
  rhythmTapButton: {
    minWidth: 94,
    minHeight: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.amber
  },
  rhythmAutoCaptureActive: {
    backgroundColor: "#DDF5E9",
    borderWidth: 1,
    borderColor: "#16A34A"
  },
  rhythmTapButtonText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  rhythmFeedbackText: {
    flex: 1,
    color: colors.forest,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16
  },
  songFragmentPanel: {
    marginTop: 2,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DED6CA",
    backgroundColor: "#FFFDF8",
    gap: 6
  },
  songFragmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  songFragmentTitle: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  songFragmentMeta: {
    color: "#756D64",
    fontSize: 11,
    fontWeight: "800"
  },
  songLineRow: {
    minHeight: 30,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    backgroundColor: "#F7F1E7"
  },
  songLineRowActive: {
    backgroundColor: "#FFF3E0"
  },
  songLineChord: {
    minWidth: 34,
    borderRadius: 6,
    overflow: "hidden",
    color: "#FFF8EC",
    backgroundColor: colors.amber,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 20,
    fontWeight: "900"
  },
  songLineChordActive: {
    backgroundColor: colors.forest
  },
  songLineText: {
    flex: 1,
    color: "#756D64",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
  },
  songLineTextActive: {
    color: colors.ink,
    fontWeight: "900"
  },
  practiceMicPanel: {
    minHeight: 58,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  practiceMicCopy: {
    flex: 1
  },
  practiceMicTitle: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  practiceMicDetail: {
    marginTop: 3,
    color: "#756D64",
    fontSize: 12,
    lineHeight: 16
  },
  practiceMicButton: {
    minWidth: 104,
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC"
  },
  practiceMicButtonReady: {
    borderWidth: 1,
    borderColor: successGreen,
    backgroundColor: "#F0FDF4"
  },
  practiceMicButtonText: {
    color: colors.forest,
    fontWeight: "900"
  },
  practiceMicButtonTextReady: {
    color: successGreen
  },
  chordTransitionFocusPanel: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DED6CA",
    backgroundColor: "#FFFDF8",
    gap: 8
  },
  chordTransitionFocusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  chordTransitionFocusTitle: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "900"
  },
  chordTransitionFocusMeta: {
    flex: 1,
    color: "#756D64",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right"
  },
  chordTransitionDiagramRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8
  },
  chordTransitionDiagramCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#F7F1E7",
    padding: 8,
    alignItems: "center",
    gap: 6
  },
  chordTransitionDiagramCardActive: {
    borderColor: colors.amber,
    backgroundColor: "#FFF4D9"
  },
  chordTransitionDiagramLabel: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "900"
  },
  chordTransitionDiagramLabelActive: {
    color: colors.forest
  },
  fingeringGuide: {
    marginTop: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F7F1E7",
    borderWidth: 1,
    borderColor: "#DED6CA",
    gap: 8
  },
  fingeringGuideCompact: {
    marginTop: 0,
    padding: 9,
    gap: 5
  },
  chordDiagram: {
    alignItems: "center"
  },
  chordBadgeLarge: {
    minWidth: 90,
    minHeight: 58,
    marginBottom: -12,
    borderRadius: 24,
    backgroundColor: "#FF8A3D",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1
  },
  chordBadgeLargeText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900"
  },
  chordBadgeCompact: {
    minWidth: 58,
    minHeight: 38,
    marginBottom: -9,
    borderRadius: 16
  },
  chordBadgeCompactText: {
    fontSize: 22
  },
  chordBoard: {
    width: "100%",
    borderRadius: 18,
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5DFD3"
  },
  chordBoardCompact: {
    paddingTop: 17,
    paddingHorizontal: 10,
    paddingBottom: 9,
    borderRadius: 12
  },
  playMarkerRow: {
    marginLeft: 34,
    marginRight: 4,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  playMarkerRowCompact: {
    marginLeft: 24
  },
  playMarker: {
    width: 28,
    textAlign: "center",
    color: colors.ink,
    fontSize: 26,
    fontWeight: "800"
  },
  playMarkerCompact: {
    width: 22,
    fontSize: 17
  },
  boardRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "stretch"
  },
  fretNumberRail: {
    width: 28,
    height: 210,
    justifyContent: "space-around"
  },
  fretNumberRailCompact: {
    width: 20,
    height: 126
  },
  fretNumberLabel: {
    color: "#A19A91",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  fretNumberLabelCompact: {
    fontSize: 10
  },
  fretboard: {
    flex: 1,
    height: 210,
    position: "relative"
  },
  fretboardCompact: {
    height: 126
  },
  stringLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: "#697078"
  },
  fretLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    marginTop: -1.5,
    backgroundColor: "#697078"
  },
  nutLine: {
    height: 7,
    marginTop: -3.5,
    backgroundColor: colors.ink
  },
  fingerDot: {
    position: "absolute",
    width: 38,
    height: 38,
    marginLeft: -19,
    marginTop: -19,
    borderRadius: 999,
    backgroundColor: "#FF8A3D",
    alignItems: "center",
    justifyContent: "center"
  },
  fingerDotCompact: {
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13
  },
  fingerDotText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900"
  },
  fingerDotTextCompact: {
    fontSize: 13
  },
  diagramStringLabels: {
    marginLeft: 34,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  diagramStringLabelsCompact: {
    marginLeft: 24,
    marginTop: 5
  },
  diagramStringLabel: {
    width: 28,
    color: "#A19A91",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800"
  },
  diagramStringLabelCompact: {
    width: 22,
    fontSize: 11
  },
  fingeringHelp: {
    color: "#756D64",
    fontSize: 12,
    lineHeight: 17
  },
  fingeringHelpCompact: {
    fontSize: 10,
    lineHeight: 13
  },
  practiceTimeline: {
    flexDirection: "row",
    gap: 6
  },
  targetBlock: {
    flex: 1,
    minHeight: 86,
    borderRadius: 8,
    padding: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5
  },
  targetBlockActive: {
    backgroundColor: "#FFF4D9",
    borderColor: colors.amber
  },
  targetBlockDone: {
    backgroundColor: "#F0FDF4",
    borderColor: successGreen
  },
  barBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center"
  },
  barBadgeText: {
    color: "#FFF8EC",
    fontWeight: "900"
  },
  targetCopy: {
    alignItems: "center"
  },
  targetAction: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900"
  },
  targetBeat: {
    marginTop: 2,
    color: "#756D64",
    fontSize: 10
  },
  targetChord: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.forest
  },
  targetChordBox: {
    alignItems: "center",
    gap: 4
  },
  chordMiniList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  chordMiniCard: {
    minWidth: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DED6CA",
    backgroundColor: "#FFFDF8",
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignItems: "center",
    gap: 4
  },
  chordMiniCardDense: {
    alignSelf: "flex-start",
    minWidth: 52,
    marginTop: 6,
    paddingHorizontal: 5,
    paddingVertical: 4
  },
  chordMiniName: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: "900"
  },
  chordMiniNameDense: {
    fontSize: 11
  },
  chordMiniFallback: {
    color: colors.forest,
    fontSize: 12,
    fontWeight: "900"
  },
  microChordDiagram: {
    width: 42,
    alignItems: "center"
  },
  microMarkerRow: {
    width: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 1
  },
  microMarker: {
    width: 9,
    color: colors.ink,
    fontSize: 9,
    lineHeight: 10,
    textAlign: "center",
    fontWeight: "900"
  },
  microFretboard: {
    position: "relative",
    width: 36,
    height: 48,
    marginTop: 2
  },
  microStringLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    marginLeft: -0.5,
    backgroundColor: "#697078"
  },
  microFretLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    marginTop: -0.5,
    backgroundColor: "#697078"
  },
  microNutLine: {
    height: 3,
    marginTop: -1.5,
    backgroundColor: colors.ink
  },
  microFingerDot: {
    position: "absolute",
    width: 9,
    height: 9,
    marginLeft: -4.5,
    marginTop: -4.5,
    borderRadius: 999,
    backgroundColor: "#FF8A3D"
  },
  resetButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4DFDB"
  },
  resetButtonText: {
    color: colors.coral,
    fontWeight: "900"
  },
  practiceControlGrid: {
    flexDirection: "row",
    gap: 6
  },
  secondaryMiniButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC"
  },
  primaryMiniButton: {
    flex: 1.2,
    minHeight: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forest
  },
  resetCompactButton: {
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4DFDB"
  },
  reportPanel: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.forest,
    gap: 8
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  reportTitle: {
    color: "#FFF8EC",
    fontSize: 16,
    fontWeight: "900"
  },
  reportPill: {
    color: "#1F2522",
    backgroundColor: colors.amber,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "900"
  },
  reportGrid: {
    flexDirection: "row",
    gap: 6
  },
  recommendationPanel: {
    borderRadius: 8,
    padding: 12,
    gap: 10,
    backgroundColor: "#F7F1E7",
    borderWidth: 1,
    borderColor: colors.line
  },
  recommendationCopy: {
    gap: 4
  },
  recommendationTitle: {
    color: colors.forest,
    fontSize: 17,
    fontWeight: "900"
  },
  recommendationDetail: {
    color: "#756D64",
    lineHeight: 20
  },
  recommendationMetaRow: {
    flexDirection: "row",
    gap: 6
  },
  recommendationButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forest
  },
  recommendationButtonText: {
    color: "#FFF8EC",
    fontWeight: "900"
  },
  milestonePanel: {
    borderRadius: 8,
    padding: 12,
    gap: 9,
    backgroundColor: "#FFF8EC",
    borderWidth: 1,
    borderColor: colors.line
  },
  milestoneTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  milestoneTitle: {
    color: colors.forest,
    fontSize: 16,
    fontWeight: "900"
  },
  milestoneBadge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: "#756D64",
    backgroundColor: "#EEE8DC",
    fontWeight: "900"
  },
  milestoneBadgeReady: {
    color: successGreen,
    backgroundColor: "#DCFCE7"
  },
  milestoneDetail: {
    color: "#756D64",
    lineHeight: 20
  },
  milestoneButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.amber
  },
  milestoneButtonDisabled: {
    opacity: 0.55
  },
  milestoneButtonText: {
    color: "#1F2522",
    fontWeight: "900"
  },
  practiceHistoryHeader: {
    marginTop: 6,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  historyOverview: {
    color: "#756D64",
    fontSize: 12,
    lineHeight: 18
  },
  historyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  clearHistoryButton: {
    minHeight: 44,
    minWidth: 64,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC"
  },
  clearHistoryButtonDisabled: {
    opacity: 0.45
  },
  clearHistoryText: {
    color: colors.coral,
    fontWeight: "900"
  },
  clearHistoryTextDisabled: {
    color: "#756D64"
  },
  historyEmpty: {
    color: "#756D64",
    lineHeight: 20
  },
  historyList: {
    gap: 6
  },
  historyRow: {
    minHeight: 48,
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF8EC",
    borderWidth: 1,
    borderColor: colors.line
  },
  historyIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2EE"
  },
  historyIndexText: {
    color: colors.forest,
    fontWeight: "900"
  },
  historyCopy: {
    flex: 1
  },
  historyRowTitle: {
    color: colors.ink,
    fontWeight: "900"
  },
  historyRowMeta: {
    marginTop: 3,
    color: "#756D64",
    fontSize: 12,
    lineHeight: 16
  },
  scoreBox: {
    flex: 1,
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: "rgba(255, 248, 236, 0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  scoreLabel: {
    color: "#D9E4DB"
  },
  scoreValue: {
    marginTop: 4,
    color: "#FFF8EC",
    fontSize: 18,
    fontWeight: "900"
  },
  reportLine: {
    color: "#D9E4DB",
    lineHeight: 21
  },
  tabBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    gap: 6,
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  tabButtonActive: {
    backgroundColor: colors.forest
  },
  tabLabel: {
    fontWeight: "800",
    color: "#5D574F"
  },
  tabLabelActive: {
    color: "#FFF8EC"
  }
});
