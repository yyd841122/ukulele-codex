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
  { id: "uke-c", instrumentId: "ukulele", name: "C", fingering: [0, 0, 0, 3], fingers: [0, 0, 0, 3], difficulty: 1, tags: ["open", "beginner", "major", "key-c", "key-f", "key-g"] },
  { id: "uke-dm", instrumentId: "ukulele", name: "Dm", fingering: [2, 2, 1, 0], fingers: [2, 3, 1, 0], difficulty: 2, tags: ["minor", "key-c", "key-f"] },
  { id: "uke-em", instrumentId: "ukulele", name: "Em", fingering: [0, 4, 3, 2], fingers: [0, 3, 2, 1], difficulty: 3, tags: ["minor", "key-c", "key-d", "key-g"] },
  { id: "uke-f", instrumentId: "ukulele", name: "F", fingering: [2, 0, 1, 0], fingers: [2, 0, 1, 0], difficulty: 2, tags: ["beginner", "change-practice", "major", "key-c", "key-f"] },
  { id: "uke-g", instrumentId: "ukulele", name: "G", fingering: [0, 2, 3, 2], fingers: [0, 1, 3, 2], difficulty: 2, tags: ["major", "key-c", "key-d", "key-g"] },
  { id: "uke-am", instrumentId: "ukulele", name: "Am", fingering: [2, 0, 0, 0], fingers: [2, 0, 0, 0], difficulty: 1, tags: ["open", "beginner", "minor", "key-c", "key-f", "key-g"] },
  { id: "uke-g7", instrumentId: "ukulele", name: "G7", fingering: [0, 2, 1, 2], fingers: [0, 2, 1, 3], difficulty: 2, tags: ["beginner", "song-common", "seventh", "key-c"] },
  { id: "uke-d", instrumentId: "ukulele", name: "D", fingering: [2, 2, 2, 0], fingers: [1, 2, 3, 0], difficulty: 2, tags: ["major", "key-d", "key-g", "key-a"] },
  { id: "uke-fsharp-m", instrumentId: "ukulele", name: "F#m", fingering: [2, 1, 2, 0], fingers: [2, 1, 3, 0], difficulty: 3, tags: ["minor", "sharp", "key-d", "key-e", "key-a"] },
  { id: "uke-a", instrumentId: "ukulele", name: "A", fingering: [2, 1, 0, 0], fingers: [2, 1, 0, 0], difficulty: 2, tags: ["major", "key-d", "key-e", "key-a"] },
  { id: "uke-bm", instrumentId: "ukulele", name: "Bm", fingering: [4, 2, 2, 2], fingers: [3, 1, 1, 1], difficulty: 4, tags: ["minor", "barre", "key-d", "key-g", "key-a"] },
  { id: "uke-a7", instrumentId: "ukulele", name: "A7", fingering: [0, 1, 0, 0], fingers: [0, 1, 0, 0], difficulty: 1, tags: ["seventh", "key-d"] },
  { id: "uke-e", instrumentId: "ukulele", name: "E", fingering: [4, 4, 4, 2], fingers: [2, 3, 4, 1], difficulty: 4, tags: ["major", "key-e", "key-a", "key-b"] },
  { id: "uke-gsharp-m", instrumentId: "ukulele", name: "G#m", fingering: [1, 3, 4, 2], fingers: [1, 3, 4, 2], difficulty: 4, tags: ["minor", "sharp", "key-e", "key-b"] },
  { id: "uke-b", instrumentId: "ukulele", name: "B", fingering: [4, 3, 2, 2], fingers: [4, 3, 1, 1], difficulty: 4, tags: ["major", "barre", "key-e", "key-b"] },
  { id: "uke-csharp-m", instrumentId: "ukulele", name: "C#m", fingering: [1, 1, 0, 4], fingers: [1, 1, 0, 4], difficulty: 4, tags: ["minor", "sharp", "barre", "key-e", "key-a", "key-b"] },
  { id: "uke-b7", instrumentId: "ukulele", name: "B7", fingering: [2, 3, 2, 2], fingers: [1, 3, 1, 1], difficulty: 4, tags: ["seventh", "barre", "key-e"] },
  { id: "uke-gm", instrumentId: "ukulele", name: "Gm", fingering: [0, 2, 3, 1], fingers: [0, 2, 3, 1], difficulty: 3, tags: ["minor", "key-f"] },
  { id: "uke-bb", instrumentId: "ukulele", name: "Bb", fingering: [3, 2, 1, 1], fingers: [3, 2, 1, 1], difficulty: 3, tags: ["major", "flat", "barre", "key-f"] },
  { id: "uke-c7", instrumentId: "ukulele", name: "C7", fingering: [0, 0, 0, 1], fingers: [0, 0, 0, 1], difficulty: 1, tags: ["seventh", "key-f"] },
  { id: "uke-d7", instrumentId: "ukulele", name: "D7", fingering: [2, 2, 2, 3], fingers: [1, 1, 1, 2], difficulty: 3, tags: ["seventh", "barre", "key-g"] },
  { id: "uke-e7", instrumentId: "ukulele", name: "E7", fingering: [1, 2, 0, 2], fingers: [1, 2, 0, 3], difficulty: 2, tags: ["seventh", "key-a"] },
  { id: "uke-dsharp-m", instrumentId: "ukulele", name: "D#m", fingering: [3, 3, 2, 1], fingers: [3, 3, 2, 1], difficulty: 4, tags: ["minor", "sharp", "barre", "key-b"] },
  { id: "uke-fsharp", instrumentId: "ukulele", name: "F#", fingering: [3, 1, 2, 1], fingers: [3, 1, 2, 1], difficulty: 4, tags: ["major", "sharp", "barre", "key-b"] },
  { id: "uke-fsharp7", instrumentId: "ukulele", name: "F#7", fingering: [3, 4, 2, 4], fingers: [2, 3, 1, 4], difficulty: 4, tags: ["seventh", "sharp", "key-b"] }
];

export const chordLibraryCategories = [
  { id: "all", label: "所有", detail: "完整常用表" },
  { id: "beginner", label: "入门", detail: "C Am F G7" },
  { id: "major", label: "大三", detail: "明亮稳定" },
  { id: "minor", label: "小三", detail: "柔和暗色" },
  { id: "seventh", label: "属七", detail: "常见收束" },
  { id: "accidental", label: "升降", detail: "进阶调性" },
  { id: "barre", label: "横按", detail: "手型进阶" }
];

export const favoriteChordNames = ["C", "Am", "F", "G7"];

export const tunerDisplayConfig = {
  title: "智能调音器",
  tuningBadge: "GCEA",
  modeLabels: {
    highG: "High-G",
    lowG: "Low-G"
  },
  statusStages: [
    {
      id: "permission",
      label: "权限",
      previewDetail: "预览模拟",
      readyDetail: "已开通",
      idleDetail: "待授权"
    },
    {
      id: "level",
      label: "电平",
      activeDetail: "读取中",
      streamingDetail: "PCM 流",
      idleDetail: "待输入"
    },
    {
      id: "pitchFrame",
      label: "PitchFrame",
      readyDetail: "真实",
      idleDetail: "模拟",
      previewDetail: "模拟帧"
    }
  ],
  noiseGate: {
    idleLabel: "门限 2.6x",
    activeLabel: "门限 3.2x"
  },
  copy: {
    permissionGrantedTitle: "麦克风已授权",
    permissionPendingTitle: "麦克风未授权",
    permissionGrantedDetail: "真实 App 会在这里接 AudioEngine；当前保留模拟帧兜底。",
    readyHint: "绿色范围内已经足够准，可以进入节奏练习。",
    adjustHint: "先把当前弦调进绿色区，再切到下一根弦。",
    idleHint: "先拨单根弦；当前预览复用模拟 PitchFrame，真实 App 后续接 AudioEngine。",
    recordingInputDetail: "正在读取真实麦克风电平，PitchFrame 管线已就绪。",
    fallbackInputDetail: "拨弦触发检测；真实 PCM 后续接 Native/JSI AudioEngine。",
    inputLevelTitle: "输入电平",
    pluckTriggerLabel: "拨弦触发检测",
    calibrateHint: "环境噪声已校准。现在拨弦触发检测，减少风扇和说话误判。",
    calibrateToast: "环境噪声已校准",
    startButtonLabel: "开始调音",
    stopButtonLabel: "停止调音",
    calibrateButtonLabel: "校准环境噪声"
  }
};

export const songDetailDisplayConfig = {
  backLabel: "返回曲谱库",
  metaSuffix: "弹唱",
  sectionLabels: {
    chordPrepTitle: "和弦准备",
    chordPrepDetailSuffix: "看图换指",
    routeTitle: "练习路线",
    routeDetail: "先拆开，再合起来",
    fragmentTitle: "片段预览",
    fragmentUnit: "小节"
  },
  goals: {
    playable: "目标：先看清和弦图，再完成 {bars} 小节歌曲片段。",
    locked: "目标：先完成相关基础练习"
  },
  summaryTemplate: "{key} 调 · {bpm} BPM · 用到 {chords}，先看指法再开始。",
  actions: {
    startSongFragment: "开始歌曲片段跟弹",
    lockedSongFragment: "后续解锁完整曲谱",
    startFallbackPractice: "先练四和弦",
    startMelody: "先练单音",
    lockedMelody: "解锁后练单音"
  },
  fallbackLine: {
    bar: 1,
    text: "先完成相关基础练习，再补充完整片段。"
  },
  routeSteps: [
    {
      step: "1",
      id: "rhythm",
      title: "节奏型",
      detailTemplate: "{bpm} BPM 先稳住右手"
    },
    {
      step: "2",
      id: "transition",
      title: "和弦转换",
      detailTemplate: "{transition} 起步"
    },
    {
      step: "3",
      id: "song-fragment",
      title: "歌曲片段",
      detailTemplate: "跟着小节进入弹唱"
    }
  ]
};

export const practiceHubDisplayConfig = {
  eyebrow: "PRACTICE TOOLS",
  title: "练琴",
  subtitle: "调好琴、找好拍、看好指法再开始。",
  badge: "15 分钟",
  sections: {
    tools: {
      title: "工具",
      meta: "练前准备"
    },
    drills: {
      title: "专项练习",
      meta: "按节拍推进"
    },
    plan: {
      title: "今日建议路径",
      meta: "新手顺序"
    }
  },
  toolCards: [
    {
      id: "tuner",
      icon: "🎛️",
      title: "智能调音器",
      detail: "标准 GCEA · 拨弦检测",
      target: { type: "tool", id: "tuner" },
      featured: true
    },
    {
      id: "metronome",
      icon: "⏱️",
      title: "节拍器",
      detail: "BPM · 重音 · 声音",
      target: { type: "tool", id: "metronome" }
    },
    {
      id: "chords",
      icon: "🎼",
      title: "和弦库",
      detail: "指法图 · 试听",
      target: { type: "library", id: "chords" }
    }
  ],
  drillCards: [
    {
      id: "rhythm",
      icon: "🥁",
      title: "节奏练习",
      detail: "下扫四拍 · 下下上上",
      target: { type: "practice-template", id: "practice-rhythm-down-four" }
    },
    {
      id: "transition",
      icon: "🔁",
      title: "和弦转换",
      detail: "12 组常用换指",
      target: { type: "practice-template", id: "practice-transition-c-am" }
    }
  ],
  planSteps: [
    {
      id: "tune",
      title: "调准四根弦",
      detail: "G-C-E-A 全部进绿色区",
      target: { type: "tool", id: "tuner" }
    },
    {
      id: "rhythm",
      title: "节奏型练习",
      detail: "60 BPM 下扫四拍，稳定 2 轮",
      target: { type: "practice-template", id: "practice-rhythm-down-four" }
    },
    {
      id: "transition",
      title: "C-Am 转换",
      detail: "先练两个和弦，再进四和弦",
      target: { type: "practice-template", id: "practice-transition-c-am" }
    }
  ]
};

export const courseDetailDisplayConfig = {
  title: "课程详情",
  subtitle: "按步骤完成本课练习",
  eyebrowTemplate: "第 {order} 课 · {minutes} 分钟",
  defaultSegments: ["预习", "练习", "复盘", "完成"],
  progressTitle: "学习进度",
  resourceLabels: {
    practice: "练习",
    followup: "跟进",
    song: "歌曲",
    steps: "步骤"
  },
  resourceFallback: "先完成本课步骤，再进入下一节课。",
  segmentStatusLabels: {
    done: "已完成",
    current: "当前步骤",
    locked: "未开始"
  },
  pathStatusLabels: {
    done: "已完成",
    current: "当前",
    locked: "未解锁",
    pending: "待开始"
  },
  actions: {
    openTuner: "打开调音器",
    viewSong: "查看歌曲",
    viewChords: "查看和弦库",
    viewSteps: "查看课程步骤",
    startPracticePrefix: "开始",
    reviewPrefix: "复练本课",
    nextCoursePrefix: "进入下一课",
    nextStep: "完成下一步",
    enterCoursePractice: "进入本课练习",
    followupPrefix: "练跟进",
    previewFollowupPrefix: "进入跟进",
    followupFallback: "进入跟进练习"
  },
  hints: {
    tuner: "下一步：打开调音器，把 G/C/E/A 调到绿色区",
    song: "下一步：查看歌曲和本段用到的和弦",
    steps: "下一步：查看课程步骤",
    rhythm: "下一步：进入节奏型练习，先稳住右手",
    transition: "下一步：进入和弦转换，先练两个和弦",
    songFragment: "下一步：进入歌曲片段，把节奏和和弦合起来",
    practicePrefix: "下一步：开始"
  }
};

export const getSongChordNames = (song) =>
  song?.chordNames ?? song?.chords ?? ["C", "Am", "F", "G7"];

export const buildSongDetailRoute = (song) => {
  const chordNames = getSongChordNames(song);
  const transition = chordNames.slice(0, 2).join(" → ");
  return songDetailDisplayConfig.routeSteps.map((step) => ({
    ...step,
    detail: step.detailTemplate
      .replace("{bpm}", String(song?.bpm ?? 70))
      .replace("{transition}", transition || "C → Am")
  }));
};

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

export const beginnerRhythmPatterns = [
  {
    id: "rhythm-down-four",
    name: "Down Strum Four",
    instrument: "ukulele",
    level: "P0",
    timeSignature: "4/4",
    defaultBpm: 60,
    beats: [
      { beat: 1, subdivision: 1, stroke: "down", accent: true },
      { beat: 2, subdivision: 1, stroke: "down", accent: false },
      { beat: 3, subdivision: 1, stroke: "down", accent: false },
      { beat: 4, subdivision: 1, stroke: "down", accent: false }
    ],
    teachingFocus: "先把第一拍重音和后面三拍轻扫稳定下来，再进入换和弦。"
  },
  {
    id: "rhythm-down-down-up-up",
    name: "Down Down Up Up",
    instrument: "ukulele",
    level: "P1",
    timeSignature: "4/4",
    defaultBpm: 60,
    beats: [
      { beat: 1, subdivision: 1, stroke: "down", accent: true },
      { beat: 2, subdivision: 1, stroke: "down", accent: false },
      { beat: 2, subdivision: 2, stroke: "up", accent: false },
      { beat: 3, subdivision: 2, stroke: "up", accent: false },
      { beat: 4, subdivision: 1, stroke: "down", accent: false },
      { beat: 4, subdivision: 2, stroke: "up", accent: false }
    ],
    teachingFocus: "用慢速熟悉常见弹唱扫弦方向，后续接入歌曲片段。"
  },
  {
    id: "rhythm-down-up-eight",
    name: "Down Up Eighths",
    instrument: "ukulele",
    level: "P1",
    timeSignature: "4/4",
    defaultBpm: 60,
    beats: [
      { beat: 1, subdivision: 1, stroke: "down", accent: true },
      { beat: 1, subdivision: 2, stroke: "up", accent: false },
      { beat: 2, subdivision: 1, stroke: "down", accent: false },
      { beat: 2, subdivision: 2, stroke: "up", accent: false },
      { beat: 3, subdivision: 1, stroke: "down", accent: false },
      { beat: 3, subdivision: 2, stroke: "up", accent: false },
      { beat: 4, subdivision: 1, stroke: "down", accent: false },
      { beat: 4, subdivision: 2, stroke: "up", accent: false }
    ],
    teachingFocus: "连续下上扫，训练手腕稳定摆动。"
  },
  {
    id: "rhythm-chuck-two-four",
    name: "Chuck On Two Four",
    instrument: "ukulele",
    level: "P1",
    timeSignature: "4/4",
    defaultBpm: 60,
    beats: [
      { beat: 1, subdivision: 1, stroke: "down", accent: true },
      { beat: 2, subdivision: 1, stroke: "mute", accent: false },
      { beat: 3, subdivision: 1, stroke: "down", accent: false },
      { beat: 4, subdivision: 1, stroke: "mute", accent: false }
    ],
    teachingFocus: "在第二拍和第四拍加入切音，建立弹唱律动。"
  },
  {
    id: "rhythm-waltz-three",
    name: "Three Four Waltz",
    instrument: "ukulele",
    level: "P1",
    timeSignature: "3/4",
    defaultBpm: 60,
    beats: [
      { beat: 1, subdivision: 1, stroke: "down", accent: true },
      { beat: 2, subdivision: 1, stroke: "down", accent: false },
      { beat: 3, subdivision: 1, stroke: "up", accent: false }
    ],
    teachingFocus: "练习三拍子强弱弱，适合慢歌和民谣。"
  },
  {
    id: "rhythm-ballad-split",
    name: "Ballad Split Strum",
    instrument: "ukulele",
    level: "P2",
    timeSignature: "4/4",
    defaultBpm: 65,
    beats: [
      { beat: 1, subdivision: 1, stroke: "down", accent: true },
      { beat: 2, subdivision: 1, stroke: "rest", accent: false },
      { beat: 2, subdivision: 2, stroke: "up", accent: false },
      { beat: 3, subdivision: 1, stroke: "down", accent: false },
      { beat: 4, subdivision: 2, stroke: "up", accent: false }
    ],
    teachingFocus: "带空拍的民谣节奏，帮助新手熟悉切分感。"
  }
];

export const chordTransitionExercises = [
  {
    id: "transition-c-am",
    instrument: "ukulele",
    level: "P0",
    fromChord: "C",
    toChord: "Am",
    chordIds: ["uke-c", "uke-am"],
    defaultBpm: 60,
    bars: 2,
    rhythmPatternId: "rhythm-down-four",
    teachingFocus: "提前准备二指，在下一小节第一拍落到 Am。"
  },
  {
    id: "transition-am-f",
    instrument: "ukulele",
    level: "P0",
    fromChord: "Am",
    toChord: "F",
    chordIds: ["uke-am", "uke-f"],
    defaultBpm: 60,
    bars: 2,
    rhythmPatternId: "rhythm-down-four",
    teachingFocus: "保留二指不离弦，再加一指到 F，减少左手移动。"
  },
  {
    id: "transition-f-g7",
    instrument: "ukulele",
    level: "P0",
    fromChord: "F",
    toChord: "G7",
    chordIds: ["uke-f", "uke-g7"],
    defaultBpm: 60,
    bars: 2,
    rhythmPatternId: "rhythm-down-four",
    teachingFocus: "提前半拍准备 G7，第一拍前让三根手指落稳。"
  }
];

export const beginnerSongFragments = [
  {
    id: "song-fragment-four-chord-hum",
    title: "四和弦哼唱",
    instrument: "ukulele",
    level: "P0",
    key: "C",
    timeSignature: "4/4",
    defaultBpm: 70,
    rhythmPatternId: "rhythm-down-four",
    bars: [
      { bar: 1, chord: "C", chordId: "uke-c", lyric: "la", cue: "C 和弦稳住第一拍。" },
      { bar: 2, chord: "Am", chordId: "uke-am", lyric: "la", cue: "第一拍前提前准备 Am。" },
      { bar: 3, chord: "F", chordId: "uke-f", lyric: "la", cue: "保持右手扫弦均匀。" },
      { bar: 4, chord: "G7", chordId: "uke-g7", lyric: "la", cue: "最后一拍放轻收尾。" }
    ],
    teachingFocus: "把第一个节奏型和 C-Am-F-G7 放进简单歌曲片段。"
  }
];

export const mvpSkillPath = [
  { id: "tuning", type: "tool", title: "调准 G-C-E-A", required: true },
  { id: "rhythm", type: "rhythm_pattern", templateId: "practice-rhythm-down-four", required: true },
  { id: "transition", type: "chord_transition", templateId: "practice-transition-c-am", required: true },
  { id: "chord-loop", type: "chord_switch", templateId: "practice-c-am-f-g7-loop", required: true },
  { id: "song-fragment", type: "song_fragment", templateId: "practice-song-fragment-four-chord-hum", required: true },
  { id: "review", type: "report", title: "复盘节奏和换和弦", required: true }
];

const rhythmPatternTargets = (pattern, chord = "C", chordId = "uke-c", primaryNote = "C4") =>
  pattern.beats.map((beat) => ({
    id: `${pattern.id}-beat-${beat.beat}-${beat.subdivision}`,
    bar: 1,
    beat: beat.beat,
    subdivision: beat.subdivision,
    stroke: beat.stroke,
    accent: beat.accent,
    chord,
    chordId,
    primaryNote
  }));

const rhythmTargetsByPatternId = Object.fromEntries(
  beginnerRhythmPatterns.map((pattern) => [pattern.id, rhythmPatternTargets(pattern)])
);
const rhythmDownFourTargets = rhythmTargetsByPatternId["rhythm-down-four"];
const rhythmDownDownUpUpTargets = rhythmTargetsByPatternId["rhythm-down-down-up-up"];
const rhythmDownUpEightTargets = rhythmTargetsByPatternId["rhythm-down-up-eight"];
const rhythmChuckTwoFourTargets = rhythmTargetsByPatternId["rhythm-chuck-two-four"];
const rhythmWaltzThreeTargets = rhythmTargetsByPatternId["rhythm-waltz-three"];
const rhythmBalladSplitTargets = rhythmTargetsByPatternId["rhythm-ballad-split"];

const cAmTransitionTargets = [
  { id: "transition-c", bar: 1, beat: 1, chord: "C", chordId: "uke-c", primaryNote: "C4" },
  { id: "transition-am", bar: 2, beat: 1, chord: "Am", chordId: "uke-am", primaryNote: "A4" }
];

const songFragmentTargets = beginnerSongFragments[0].bars.map((bar) => ({
  id: `song-bar-${bar.bar}`,
  bar: bar.bar,
  beat: 1,
  chord: bar.chord,
  chordId: bar.chordId,
  lyric: bar.lyric,
  cue: bar.cue,
  rhythmPatternId: beginnerSongFragments[0].rhythmPatternId,
  primaryNote: bar.chord === "Am" ? "A4" : bar.chord === "F" ? "F4" : bar.chord === "G7" ? "G4" : "C4"
}));

export const mvpMelodyPracticePhrases = {
  C: [
    { id: "melody-c-1", note: "C", primaryNote: "C4", string: "A", fret: 3, beat: 1 },
    { id: "melody-c-2", note: "E", primaryNote: "E4", string: "E", fret: 0, beat: 2 },
    { id: "melody-c-3", note: "G", primaryNote: "G4", string: "E", fret: 3, beat: 3 },
    { id: "melody-c-4", note: "C", primaryNote: "C4", string: "A", fret: 3, beat: 4 },
    { id: "melody-c-5", note: "A", primaryNote: "A4", string: "A", fret: 0, beat: 1 },
    { id: "melody-c-6", note: "G", primaryNote: "G4", string: "E", fret: 3, beat: 2 },
    { id: "melody-c-7", note: "E", primaryNote: "E4", string: "E", fret: 0, beat: 3 },
    { id: "melody-c-8", note: "C", primaryNote: "C4", string: "A", fret: 3, beat: 4 }
  ],
  G: [
    { id: "melody-g-1", note: "G", primaryNote: "G4", string: "E", fret: 3, beat: 1 },
    { id: "melody-g-2", note: "B", primaryNote: "B4", string: "A", fret: 2, beat: 2 },
    { id: "melody-g-3", note: "D", primaryNote: "D4", string: "C", fret: 2, beat: 3 },
    { id: "melody-g-4", note: "G", primaryNote: "G4", string: "E", fret: 3, beat: 4 },
    { id: "melody-g-5", note: "E", primaryNote: "E4", string: "E", fret: 0, beat: 1 },
    { id: "melody-g-6", note: "D", primaryNote: "D4", string: "C", fret: 2, beat: 2 },
    { id: "melody-g-7", note: "B", primaryNote: "B4", string: "A", fret: 2, beat: 3 },
    { id: "melody-g-8", note: "G", primaryNote: "G4", string: "E", fret: 3, beat: 4 }
  ],
  Am: [
    { id: "melody-am-1", note: "A", primaryNote: "A4", string: "A", fret: 0, beat: 1 },
    { id: "melody-am-2", note: "C", primaryNote: "C4", string: "A", fret: 3, beat: 2 },
    { id: "melody-am-3", note: "E", primaryNote: "E4", string: "E", fret: 0, beat: 3 },
    { id: "melody-am-4", note: "A", primaryNote: "A4", string: "A", fret: 0, beat: 4 },
    { id: "melody-am-5", note: "G", primaryNote: "G4", string: "E", fret: 3, beat: 1 },
    { id: "melody-am-6", note: "E", primaryNote: "E4", string: "E", fret: 0, beat: 2 },
    { id: "melody-am-7", note: "C", primaryNote: "C4", string: "A", fret: 3, beat: 3 },
    { id: "melody-am-8", note: "A", primaryNote: "A4", string: "A", fret: 0, beat: 4 }
  ]
};

export const practiceTempoPresets = [
  { id: "slow", label: "Slow", bpm: 60 },
  { id: "standard", label: "Standard", bpm: 70 },
  { id: "advanced", label: "Advanced", bpm: 85 }
];

export const metronomeTempoPresets = [
  { id: "slow", label: "慢速", bpm: 60, description: "新手稳拍" },
  { id: "standard", label: "标准", bpm: 70, description: "常规练习" },
  { id: "advanced", label: "进阶", bpm: 85, description: "歌曲速度" }
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
    id: "practice-rhythm-down-four",
    type: "rhythm_pattern",
    instrument: "ukulele",
    bpm: 60,
    timeSignature: "4/4",
    passingScore: 70,
    rhythmPatternId: "rhythm-down-four",
    targets: rhythmDownFourTargets,
    tempoPresets: practiceTempoPresets,
    loopModes: practiceLoopModes,
    display: {
      title: "下扫四拍",
      subtitle: "先用 C 和弦练稳定四拍，第一拍重音，后三拍轻扫。",
      targetLabel: "扫弦拍点"
    },
    action: {
      primaryLabel: "开始节奏",
      secondaryLabel: "循环一小节",
      completionLabel: "完成节奏练习"
    }
  },
  {
    id: "practice-rhythm-down-down-up-up",
    type: "rhythm_pattern",
    instrument: "ukulele",
    bpm: 60,
    timeSignature: "4/4",
    passingScore: 70,
    rhythmPatternId: "rhythm-down-down-up-up",
    targets: rhythmDownDownUpUpTargets,
    tempoPresets: practiceTempoPresets,
    loopModes: practiceLoopModes,
    display: {
      title: "下下上上",
      subtitle: "在慢速下熟悉下、下上、上、下上的常见弹唱扫弦方向。",
      targetLabel: "扫弦方向"
    },
    action: {
      primaryLabel: "开始扫弦",
      secondaryLabel: "循环一小节",
      completionLabel: "完成进阶节奏"
    }
  },
  {
    id: "practice-rhythm-down-up-eight",
    type: "rhythm_pattern",
    instrument: "ukulele",
    bpm: 60,
    timeSignature: "4/4",
    passingScore: 70,
    rhythmPatternId: "rhythm-down-up-eight",
    targets: rhythmDownUpEightTargets,
    tempoPresets: practiceTempoPresets,
    loopModes: practiceLoopModes,
    display: {
      title: "连续下上",
      subtitle: "用八分音符连续下上扫，训练手腕稳定摆动。",
      targetLabel: "连续扫弦"
    },
    action: {
      primaryLabel: "开始连续扫",
      secondaryLabel: "循环一小节",
      completionLabel: "完成连续下上"
    }
  },
  {
    id: "practice-rhythm-chuck-two-four",
    type: "rhythm_pattern",
    instrument: "ukulele",
    bpm: 60,
    timeSignature: "4/4",
    passingScore: 70,
    rhythmPatternId: "rhythm-chuck-two-four",
    targets: rhythmChuckTwoFourTargets,
    tempoPresets: practiceTempoPresets,
    loopModes: practiceLoopModes,
    display: {
      title: "二四切音",
      subtitle: "第二拍和第四拍加入切音，建立弹唱律动。",
      targetLabel: "切音拍点"
    },
    action: {
      primaryLabel: "开始切音",
      secondaryLabel: "循环一小节",
      completionLabel: "完成切音节奏"
    }
  },
  {
    id: "practice-rhythm-waltz-three",
    type: "rhythm_pattern",
    instrument: "ukulele",
    bpm: 60,
    timeSignature: "3/4",
    passingScore: 70,
    rhythmPatternId: "rhythm-waltz-three",
    targets: rhythmWaltzThreeTargets,
    tempoPresets: practiceTempoPresets,
    loopModes: practiceLoopModes,
    display: {
      title: "三拍子",
      subtitle: "练习强弱弱的三拍子，适合慢歌和民谣。",
      targetLabel: "三拍扫弦"
    },
    action: {
      primaryLabel: "开始三拍子",
      secondaryLabel: "循环一小节",
      completionLabel: "完成三拍子"
    }
  },
  {
    id: "practice-rhythm-ballad-split",
    type: "rhythm_pattern",
    instrument: "ukulele",
    bpm: 65,
    timeSignature: "4/4",
    passingScore: 70,
    rhythmPatternId: "rhythm-ballad-split",
    targets: rhythmBalladSplitTargets,
    tempoPresets: practiceTempoPresets,
    loopModes: practiceLoopModes,
    display: {
      title: "民谣切分",
      subtitle: "带空拍的常用民谣节奏，先慢速熟悉切分感。",
      targetLabel: "切分扫弦"
    },
    action: {
      primaryLabel: "开始切分",
      secondaryLabel: "循环一小节",
      completionLabel: "完成民谣切分"
    }
  },
  {
    id: "practice-transition-c-am",
    type: "chord_transition",
    instrument: "ukulele",
    bpm: 60,
    timeSignature: "4/4",
    passingScore: 70,
    transitionId: "transition-c-am",
    targets: cAmTransitionTargets,
    tempoPresets: practiceTempoPresets,
    loopModes: practiceLoopModes,
    display: {
      title: "C 到 Am 转换",
      subtitle: "从两个和弦开始，在下一小节第一拍前落稳。",
      targetLabel: "和弦转换"
    },
    action: {
      primaryLabel: "开始转换",
      secondaryLabel: "重复转换",
      completionLabel: "完成转换练习"
    }
  },
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
      title: "C-Am-F-G7 四和弦循环",
      subtitle: "把 C、Am、F、G7 连成四小节循环，为歌曲做准备。",
      targetLabel: "和弦目标"
    },
    action: {
      primaryLabel: "开始循环",
      secondaryLabel: "单练一个和弦",
      completionLabel: "完成跟练"
    }
  },
  {
    id: "practice-song-fragment-four-chord-hum",
    type: "song_fragment",
    instrument: "ukulele",
    bpm: 70,
    timeSignature: "4/4",
    passingScore: 70,
    songFragmentId: "song-fragment-four-chord-hum",
    rhythmPatternId: "rhythm-down-four",
    targets: songFragmentTargets,
    tempoPresets: practiceTempoPresets,
    loopModes: practiceLoopModes,
    display: {
      title: "四和弦歌曲片段",
      subtitle: "用 C-Am-F-G7 跟弹 4 小节，进入真实弹唱流程。",
      targetLabel: "歌曲小节"
    },
    action: {
      primaryLabel: "开始歌曲片段",
      secondaryLabel: "循环片段",
      completionLabel: "完成歌曲练习"
    }
  }
];

export const chordLoopExercise = mvpPracticeTemplates.find((template) => template.id === "practice-c-am-f-g7-loop");

export const getMvpPracticeTemplate = (id) =>
  mvpPracticeTemplates.find((template) => template.id === id) ?? null;

export const getPracticeTemplateById = getMvpPracticeTemplate;

export const getPracticeTemplatesByType = (type) =>
  mvpPracticeTemplates.filter((template) => template.type === type);

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

export const beginnerSongCatalog = [
  {
    id: "song-four-chord-hum",
    title: "童年",
    artist: "罗大佑",
    instrument: "ukulele",
    level: "P0",
    key: "C",
    bpm: 70,
    timeSignature: "4/4",
    difficulty: 1,
    access: "free",
    display: {
      emoji: "🌈",
      color: "#FCD34D",
      light: "#FEF3C7",
      stars: 1,
      difficultyLabel: "入门"
    },
    chordIds: ["uke-c", "uke-am", "uke-f", "uke-g7"],
    chordNames: ["C", "Am", "F", "G7"],
    rhythmPatternIds: ["rhythm-down-four"],
    songFragmentIds: ["song-fragment-four-chord-hum"],
    practiceTemplateIds: ["practice-song-fragment-four-chord-hum"],
    practiceLines: [
      { bar: 1, chord: "C", text: "啦啦啦啦 稳住第一拍" },
      { bar: 2, chord: "Am", text: "啦啦啦啦 提前换和弦" },
      { bar: 3, chord: "F", text: "啦啦啦啦 右手保持匀速" },
      { bar: 4, chord: "G7", text: "啦啦啦啦 轻轻收尾" }
    ],
    tags: ["beginner", "four-chord", "song-fragment"]
  },
  {
    id: "song-four-chord-breeze",
    title: "四和弦海风",
    artist: "入门练习曲",
    instrument: "ukulele",
    level: "P0",
    key: "C",
    bpm: 70,
    timeSignature: "4/4",
    difficulty: 1,
    access: "free",
    display: {
      emoji: "🏝️",
      color: "#5EEAD4",
      light: "#CCFBF1",
      stars: 1,
      difficultyLabel: "入门"
    },
    chordIds: ["uke-c", "uke-am", "uke-f", "uke-g7"],
    chordNames: ["C", "Am", "F", "G7"],
    rhythmPatternIds: ["rhythm-down-four"],
    songFragmentIds: ["song-fragment-four-chord-hum"],
    practiceTemplateIds: ["practice-song-fragment-four-chord-hum"],
    practiceLines: [
      { bar: 1, chord: "C", text: "海风轻轻吹 稳住第一拍" },
      { bar: 2, chord: "Am", text: "左手提前换 右手不停摆" },
      { bar: 3, chord: "F", text: "扫弦别着急 声音要打开" },
      { bar: 4, chord: "G7", text: "回到下一轮 放松再重来" }
    ],
    tags: ["beginner", "four-chord", "song-fragment"]
  },
  {
    id: "song-bedtime-arpeggio",
    title: "晚安分解练习",
    artist: "入门练习曲",
    instrument: "ukulele",
    level: "P0",
    key: "C",
    bpm: 60,
    timeSignature: "4/4",
    difficulty: 1,
    access: "free",
    display: {
      emoji: "🌙",
      color: "#93C5FD",
      light: "#DBEAFE",
      stars: 1,
      difficultyLabel: "入门"
    },
    chordIds: ["uke-c", "uke-g", "uke-am", "uke-f"],
    chordNames: ["C", "G", "Am", "F"],
    rhythmPatternIds: ["rhythm-down-four"],
    songFragmentIds: [],
    practiceTemplateIds: ["practice-c-am-f-g7-loop"],
    practiceLines: [
      { bar: 1, chord: "C", text: "先用 C-G-Am-F 练习慢速换和弦" }
    ],
    tags: ["beginner", "arpeggio", "chord-loop"]
  },
  {
    id: "song-g-transition",
    title: "G调换指练习",
    artist: "进阶练习曲",
    instrument: "ukulele",
    level: "P1",
    key: "G",
    bpm: 72,
    timeSignature: "4/4",
    difficulty: 2,
    access: "free",
    display: {
      emoji: "🛤️",
      color: "#C4B5FD",
      light: "#EDE9FE",
      stars: 2,
      difficultyLabel: "进阶"
    },
    chordIds: ["uke-g", "uke-d", "uke-em", "uke-c"],
    chordNames: ["G", "D", "Em", "C"],
    rhythmPatternIds: ["rhythm-down-four"],
    songFragmentIds: [],
    practiceTemplateIds: ["practice-c-am-f-g7-loop"],
    practiceLines: [
      { bar: 1, chord: "G", text: "练 G-D-Em-C 的常用弹唱走向" }
    ],
    tags: ["intermediate", "key-g", "chord-loop"]
  },
  {
    id: "song-waltz-slow",
    title: "三拍子慢歌",
    artist: "节奏练习曲",
    instrument: "ukulele",
    level: "P1",
    key: "C",
    bpm: 60,
    timeSignature: "3/4",
    difficulty: 2,
    access: "free",
    display: {
      emoji: "💧",
      color: "#A7F3D0",
      light: "#ECFDF5",
      stars: 2,
      difficultyLabel: "进阶"
    },
    chordIds: ["uke-c", "uke-f", "uke-g7"],
    chordNames: ["C", "F", "G7"],
    rhythmPatternIds: ["rhythm-waltz-three"],
    songFragmentIds: [],
    practiceTemplateIds: ["practice-rhythm-waltz-three"],
    practiceLines: [
      { bar: 1, chord: "C", text: "用 3/4 强弱弱节奏练慢歌进入" }
    ],
    tags: ["intermediate", "waltz", "rhythm-pattern"]
  },
  {
    id: "song-little-luck",
    title: "小幸运",
    artist: "田馥甄",
    instrument: "ukulele",
    level: "P1",
    key: "C",
    bpm: 78,
    timeSignature: "4/4",
    difficulty: 2,
    access: "free",
    display: {
      emoji: "🍀",
      color: "#86EFAC",
      light: "#BBF7D0",
      stars: 2,
      difficultyLabel: "进阶"
    },
    chordIds: ["uke-c", "uke-g", "uke-am", "uke-f"],
    chordNames: ["C", "G", "Am", "F"],
    rhythmPatternIds: ["rhythm-down-four"],
    songFragmentIds: [],
    practiceTemplateIds: ["practice-c-am-f-g7-loop"],
    practiceLines: [
      { bar: 1, chord: "C", text: "先用四和弦练习代替完整曲谱" }
    ],
    tags: ["intermediate", "song-practice", "chord-loop"]
  },
  {
    id: "song-sunny-day",
    title: "晴天",
    artist: "周杰伦",
    instrument: "ukulele",
    level: "P1",
    key: "G",
    bpm: 76,
    timeSignature: "4/4",
    difficulty: 2,
    access: "free",
    display: {
      emoji: "☀️",
      color: "#FDBA74",
      light: "#FED7AA",
      stars: 2,
      difficultyLabel: "进阶"
    },
    chordIds: ["uke-g", "uke-d", "uke-em", "uke-c"],
    chordNames: ["G", "D", "Em", "C"],
    rhythmPatternIds: ["rhythm-down-four"],
    songFragmentIds: [],
    practiceTemplateIds: ["practice-c-am-f-g7-loop"],
    practiceLines: [
      { bar: 1, chord: "G", text: "进阶歌曲后续接完整曲谱" }
    ],
    tags: ["intermediate", "key-g", "song-practice"]
  },
  {
    id: "song-lemon-locked",
    title: "Lemon",
    artist: "米津玄师",
    instrument: "ukulele",
    level: "P2",
    key: "C",
    bpm: 88,
    timeSignature: "4/4",
    difficulty: 3,
    access: "pro",
    display: {
      emoji: "🍋",
      color: "#FDE68A",
      light: "#FEF3C7",
      stars: 3,
      difficultyLabel: "会员"
    },
    chordIds: ["uke-c", "uke-g", "uke-am", "uke-f"],
    chordNames: ["C", "G", "Am", "F"],
    rhythmPatternIds: ["rhythm-down-four"],
    songFragmentIds: [],
    practiceTemplateIds: [],
    practiceLines: [],
    tags: ["pro", "song-practice", "locked"]
  },
  {
    id: "song-island-strum-demo",
    title: "小岛下扫歌",
    artist: "节奏练习曲",
    instrument: "ukulele",
    level: "P1",
    key: "C",
    bpm: 85,
    timeSignature: "4/4",
    difficulty: 2,
    access: "free",
    display: {
      emoji: "🎵",
      color: "#2DD4BF",
      light: "#CCFBF1",
      stars: 2,
      difficultyLabel: "进阶"
    },
    chordIds: ["uke-f", "uke-g7", "uke-c"],
    chordNames: ["F", "G7", "C"],
    rhythmPatternIds: ["rhythm-down-down-up-up"],
    songFragmentIds: [],
    practiceTemplateIds: ["practice-c-am-f-g7-loop"],
    practiceLines: [
      { bar: 1, chord: "C", text: "先用四和弦循环代替完整曲谱" }
    ],
    tags: ["beginner", "rhythm-pattern", "strumming"]
  },
  {
    id: "song-riptide-style-progression",
    title: "Riptide",
    artist: "Vance Joy",
    instrument: "ukulele",
    level: "P2",
    key: "Am",
    bpm: 102,
    timeSignature: "4/4",
    difficulty: 3,
    access: "pro",
    display: {
      emoji: "🌊",
      color: "#67E8F9",
      light: "#CFFAFE",
      stars: 3,
      difficultyLabel: "会员"
    },
    chordIds: ["uke-am", "uke-g", "uke-c"],
    chordNames: ["Am", "G", "C"],
    rhythmPatternIds: ["rhythm-down-down-up-up"],
    songFragmentIds: [],
    practiceTemplateIds: [],
    practiceLines: [
      { bar: 1, chord: "Am", text: "会员歌曲后续接完整曲谱" }
    ],
    tags: ["pro", "song-practice", "progression"]
  }
];

/**
 * @param {{
 *   access?: "free" | "pro" | string,
 *   maxDifficulty?: number,
 *   minDifficulty?: number,
 *   query?: string
 * }} [options]
 */
export const filterBeginnerSongs = ({
  access,
  maxDifficulty,
  minDifficulty,
  query = ""
} = {}) => {
  const normalizedQuery = String(query).trim().toLowerCase();
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return beginnerSongCatalog.filter((song) => {
    const accessMatch = !access || song.access === access;
    const maxDifficultyMatch = maxDifficulty == null || song.difficulty <= maxDifficulty;
    const minDifficultyMatch = minDifficulty == null || song.difficulty >= minDifficulty;
    const searchText = [
      song.title,
      song.artist,
      song.key,
      song.level,
      ...(song.chordNames ?? []),
      ...(song.tags ?? [])
    ].join(" ").toLowerCase();
    const queryMatch = queryTokens.length === 0 || queryTokens.every((token) => searchText.includes(token));

    return accessMatch && maxDifficultyMatch && minDifficultyMatch && queryMatch;
  });
};

export const mvpCourseCatalog = [
  {
    id: "course-uke-intro",
    order: 1,
    type: "required",
    title: "认识你的尤克里里",
    subtitle: "持琴姿势 · 四根弦 · 基本发声",
    estimatedMinutes: 8,
    access: "free",
    defaultProgress: 100,
    display: { emoji: "🎸" },
    skillPathId: "tuning",
    segments: ["认识四根弦", "正确持琴", "第一次拨弦", "完成课后小测"],
    tags: ["orientation", "beginner"]
  },
  {
    id: "course-tune-gcea",
    order: 2,
    type: "required",
    title: "学会给琴调音",
    subtitle: "使用调音器把 G-C-E-A 调准",
    estimatedMinutes: 10,
    access: "free",
    defaultProgress: 100,
    display: { emoji: "🎛️" },
    skillPathId: "tuning",
    toolId: "tuner",
    segments: ["打开调音器", "识别 G-C-E-A", "调准四根弦", "完成调音记录"],
    tags: ["tuning", "beginner"]
  },
  {
    id: "course-rhythm-down-four",
    order: 3,
    type: "required",
    title: "第一个节奏型",
    subtitle: "下扫四拍，建立稳定节拍感",
    estimatedMinutes: 12,
    access: "free",
    defaultProgress: 60,
    display: { emoji: "🥁" },
    skillPathId: "rhythm",
    primaryPracticeTemplateId: "practice-rhythm-down-four",
    segments: ["听 60 BPM", "下扫四拍", "连续 2 轮", "节奏分达到 70"],
    tags: ["rhythm", "beginner"]
  },
  {
    id: "course-c-am-transition",
    order: 4,
    type: "required",
    title: "C 与 Am 的切换",
    subtitle: "从双和弦转换进入四和弦循环",
    estimatedMinutes: 12,
    access: "free",
    defaultProgress: 20,
    display: { emoji: "🔁" },
    skillPathId: "transition",
    primaryPracticeTemplateId: "practice-transition-c-am",
    followupPracticeTemplateId: "practice-c-am-f-g7-loop",
    segments: ["C 到 Am", "Am 到 F", "F 到 G7", "四和弦循环"],
    tags: ["transition", "chord-loop", "beginner"]
  },
  {
    id: "course-first-song-fragment",
    order: 5,
    type: "required",
    title: "第一首弹唱《童年》",
    subtitle: "C-Am-F-G7 歌曲片段跟弹",
    estimatedMinutes: 15,
    access: "free",
    defaultProgress: 0,
    display: { emoji: "🎤" },
    skillPathId: "song-fragment",
    primaryPracticeTemplateId: "practice-song-fragment-four-chord-hum",
    linkedSongId: "song-four-chord-hum",
    segments: ["读谱和和弦", "前 4 小节", "慢速跟弹", "提交评分"],
    tags: ["song-fragment", "follow-practice", "beginner"]
  },
  {
    id: "course-island-strum",
    order: 6,
    type: "optional",
    title: "切分节奏和扫弦方向",
    subtitle: "下下上上、弱起和切音的入门练习",
    estimatedMinutes: 14,
    access: "free",
    defaultProgress: 0,
    display: { emoji: "🎵" },
    primaryRhythmPatternId: "rhythm-down-down-up-up",
    primaryPracticeTemplateId: "practice-rhythm-down-down-up-up",
    segments: ["节奏方向", "空拍练习", "切分扫弦", "应用到歌曲"],
    tags: ["optional", "rhythm"]
  },
  {
    id: "course-riptide-pro",
    order: 7,
    type: "pro",
    title: "完整弹唱：Riptide",
    subtitle: "从前奏节奏进入完整歌曲跟弹",
    estimatedMinutes: 18,
    access: "pro",
    defaultProgress: 0,
    display: { emoji: "🏝️" },
    linkedSongId: "song-riptide-style-progression",
    segments: ["歌曲结构", "主歌跟弹", "副歌跟弹", "完整录制"],
    tags: ["pro", "song-practice"]
  }
];

export const mvpContentModules = [
  {
    id: "today",
    tab: "home",
    title: "今日",
    purpose: "推荐一条明确的当日练习路径。",
    primaryTemplateId: "practice-rhythm-down-four",
    linkedSongId: "song-four-chord-hum"
  },
  {
    id: "tuner",
    tab: "tuner",
    title: "调音器",
    purpose: "进入智能调音和拾音状态检查。",
    toolId: "tuner",
    courseIds: mvpCourseCatalog
      .filter((course) => course.skillPathId === "tuning")
      .map((course) => course.id)
  },
  {
    id: "practice",
    tab: "practice",
    title: "练琴工具",
    purpose: "打开调音、节拍器、节奏型、和弦转换和歌曲片段练习。",
    practiceTemplateIds: mvpPracticeTemplates.map((template) => template.id)
  },
  {
    id: "songs",
    tab: "songs",
    title: "曲谱库",
    purpose: "浏览入门歌曲片段和锁定的 Pro 示例。",
    songIds: beginnerSongCatalog.map((song) => song.id)
  },
  {
    id: "profile",
    tab: "me",
    title: "练习档案",
    purpose: "查看本地统计、成就和最近练习记录。"
  }
];

export const mvpHomeCheckinMinutes = [8, 12, 0, 15, 10, 18, 21, 0, 6, 12, 14, 0, 20, 16];

export const mvpHomeQuickActions = [
  {
    id: "tuner",
    icon: "🎛️",
    title: "调音器",
    detail: "开始前校准 GCEA",
    target: { type: "tool", id: "tuner" }
  },
  {
    id: "chords",
    icon: "🎼",
    title: "和弦",
    detail: "看指法图和试听",
    target: { type: "library", id: "chords" }
  },
  {
    id: "songs",
    icon: "🎵",
    title: "曲谱库",
    detail: "找一首歌练",
    target: { type: "tab", id: "songs" }
  },
  {
    id: "practice",
    icon: "🎸",
    title: "练习",
    detail: "节奏与和弦转换",
    target: { type: "tab", id: "practice" }
  }
];

export const mvpHomeHotSongRecommendations = [
  { id: "hot-four-chord", songId: "song-four-chord-hum", minutes: 8 },
  { id: "hot-island-strum", songId: "song-island-strum-demo", minutes: 10 },
  { id: "hot-riptide-style", songId: "song-riptide-style-progression", minutes: 12 }
];

export const mvpLearnTopicEntrances = [
  {
    id: "tuning",
    icon: "🎙️",
    title: "调音基础",
    detail: "先把 G-C-E-A 调准",
    target: { type: "tool", id: "tuner" }
  },
  {
    id: "rhythm",
    icon: "🥁",
    title: "节奏型",
    detail: "从下扫四拍开始",
    target: { type: "practice-template", id: "practice-rhythm-down-four" }
  },
  {
    id: "transition",
    icon: "🔁",
    title: "和弦转换",
    detail: "先练 C 到 Am，再进入四和弦",
    target: { type: "practice-template", id: "practice-transition-c-am" }
  },
  {
    id: "song-fragment",
    icon: "🎵",
    title: "歌曲片段",
    detail: "从曲谱库进入第一首歌",
    target: { type: "tab", id: "songs" }
  }
];

export const mvpPracticeSimulationFixtures = {
  rhythmAutoOffsetsMs: [-28, 42, 18, -64, 75, 8, -35, 55],
  transitionAutoOffsetsMs: [-44, 32, 18, 86, -72, 12, 48, -26],
  followScorePattern: [86, 74, 92, 68, 88, 95, 79, 91],
  melodyHitPattern: [92, 86, 78, 95, 72, 88, 81, 96]
};

export const rhythmAutoOffsetsMs = mvpPracticeSimulationFixtures.rhythmAutoOffsetsMs;
export const transitionAutoOffsetsMs = mvpPracticeSimulationFixtures.transitionAutoOffsetsMs;
export const followScorePattern = mvpPracticeSimulationFixtures.followScorePattern;
export const melodyHitPattern = mvpPracticeSimulationFixtures.melodyHitPattern;

export const mvpPracticeContent = {
  version: "mvp-content-v1",
  instrumentId: ukuleleInstrument.id,
  skillPath: mvpSkillPath,
  modules: mvpContentModules,
  home: {
    checkinMinutes: mvpHomeCheckinMinutes,
    quickActions: mvpHomeQuickActions,
    hotSongRecommendations: mvpHomeHotSongRecommendations
  },
  learnTopics: mvpLearnTopicEntrances,
  chordLibrary: {
    categories: chordLibraryCategories,
    favoriteChordNames
  },
  tuner: tunerDisplayConfig,
  metronome: {
    tempoPresets: metronomeTempoPresets
  },
  practiceHub: practiceHubDisplayConfig,
  courseDetail: courseDetailDisplayConfig,
  courses: mvpCourseCatalog,
  rhythmPatterns: beginnerRhythmPatterns,
  chordTransitions: chordTransitionExercises,
  songFragments: beginnerSongFragments,
  practiceTemplates: mvpPracticeTemplates,
  simulationFixtures: mvpPracticeSimulationFixtures,
  songDetail: songDetailDisplayConfig,
  songs: beginnerSongCatalog
};

export const getRhythmPatternById = (id) =>
  beginnerRhythmPatterns.find((pattern) => pattern.id === id) ?? null;

export const getChordTransitionExerciseById = (id) =>
  chordTransitionExercises.find((exercise) => exercise.id === id) ?? null;

export const getSongFragmentById = (id) =>
  beginnerSongFragments.find((fragment) => fragment.id === id) ?? null;

export const getBeginnerSongById = (id) =>
  beginnerSongCatalog.find((song) => song.id === id) ?? null;

export const getContentModuleById = (id) =>
  mvpContentModules.find((module) => module.id === id) ?? null;

export const getMvpCourseById = (id) =>
  mvpCourseCatalog.find((course) => course.id === id) ?? null;

export const getMvpCoursesForPracticeTemplate = (templateId) =>
  mvpCourseCatalog.filter((course) =>
    [course.primaryPracticeTemplateId, course.followupPracticeTemplateId].includes(templateId)
  );

export const getMvpCourseForPracticeTemplate = (templateId) =>
  getMvpCoursesForPracticeTemplate(templateId)[0] ?? null;

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
  courseId,
  exerciseId,
  lessonId,
  songId,
  startedAt,
  endedAt,
  templateId,
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
    courseId,
    exerciseId,
    lessonId,
    songId,
    templateId: templateId ?? exerciseId,
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

const practiceRecordMatchesTemplateId = (record, templateId) =>
  record?.exerciseId === templateId ||
  record?.templateId === templateId ||
  record?.template?.id === templateId;

const practiceRecordHasPassedStatus = (record) => {
  if (record?.passed === true || record?.result?.passed === true) {
    return true;
  }
  return [record?.status, record?.result, record?.result?.status]
    .filter((value) => typeof value === "string")
    .some((value) => ["passed", "complete", "completed", "done"].includes(value.toLowerCase()));
};

const practiceRecordPassesTemplate = (record, template) => {
  const targetCount = practiceRecordTargetCount(record, template);
  const completedCount = practiceRecordCompletedCount(record);
  const rhythmScore = practiceRecordRhythmScore(record);
  const passingScore = numberOrNull(template?.passingScore) ?? chordLoopPractice.passingScore;
  return practiceRecordHasPassedStatus(record) ||
    (targetCount > 0 && completedCount >= targetCount && rhythmScore !== null && rhythmScore >= passingScore);
};

export const mvpPracticeRecommendationPath = [
  { courseId: "course-rhythm-down-four", templateId: "practice-rhythm-down-four" },
  { courseId: "course-c-am-transition", templateId: "practice-transition-c-am" },
  { courseId: "course-first-song-fragment", templateId: "practice-song-fragment-four-chord-hum" }
];

const makePracticeRecommendation = ({
  title,
  detail,
  bpm,
  tempoId,
  loopMode,
  focusChord,
  reason,
  templateId,
  courseId,
  songId
}) => {
  const recommendation = {
    title,
    detail,
    bpm,
    tempoId,
    loopMode,
    focusChord,
    reason
  };
  if (templateId) recommendation.templateId = templateId;
  if (courseId) recommendation.courseId = courseId;
  if (songId) recommendation.songId = songId;
  return recommendation;
};

const createNextContentPathRecommendation = (history = []) => {
  const rawHistory = Array.isArray(history) ? history.filter((record) => record && typeof record === "object") : [];
  const records = normalizePracticeHistory(rawHistory, rawHistory.length);

  for (const step of mvpPracticeRecommendationPath) {
    const template = getMvpPracticeTemplate(step.templateId);
    if (!template) continue;

    const course = mvpCourseCatalog.find((item) => item.id === step.courseId) ?? null;
    const stepRecords = records.filter((record) => practiceRecordMatchesTemplateId(record, template.id));
    const passed = stepRecords.some((record) => practiceRecordPassesTemplate(record, template));
    if (passed) continue;

    const recommendation = createNextPracticeRecommendation(stepRecords, { template });
    return makePracticeRecommendation({
      ...recommendation,
      templateId: template.id,
      courseId: step.courseId,
      songId: course?.linkedSongId,
      reason:
        stepRecords.length === 0
          ? `Next MVP path step: ${course?.title ?? template.title}.`
          : recommendation.reason
    });
  }

  const finalStep = mvpPracticeRecommendationPath[mvpPracticeRecommendationPath.length - 1];
  const finalTemplate = getMvpPracticeTemplate(finalStep.templateId) ?? chordLoopPractice;
  const finalRecords = records.filter((record) => practiceRecordMatchesTemplateId(record, finalTemplate.id));
  const recommendation = createNextPracticeRecommendation(finalRecords, { template: finalTemplate });
  return makePracticeRecommendation({
    ...recommendation,
    templateId: finalTemplate.id,
    courseId: finalStep.courseId,
    songId: mvpCourseCatalog.find((item) => item.id === finalStep.courseId)?.linkedSongId,
    reason: "The MVP path is complete; keep the song fragment fresh or raise the tempo."
  });
};

export const createNextPracticeRecommendation = (history = [], options = {}) => {
  if (options.contentPath === true || options.contentPath === "mvp") {
    return createNextContentPathRecommendation(history);
  }

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

export const summarizeMvpPracticePath = (history = []) => {
  const rawHistory = Array.isArray(history) ? history.filter((record) => record && typeof record === "object") : [];
  const records = normalizePracticeHistory(rawHistory, rawHistory.length);

  return mvpPracticeRecommendationPath.map((step) => {
    const template = getMvpPracticeTemplate(step.templateId);
    const course = mvpCourseCatalog.find((item) => item.id === step.courseId) ?? null;
    const stepRecords = template
      ? records.filter((record) => practiceRecordMatchesTemplateId(record, template.id))
      : [];
    const latestRecord = stepRecords[0] ?? null;
    const rhythmScores = stepRecords
      .map((record) => practiceRecordRhythmScore(record))
      .filter((score) => score !== null);
    const targetCount = template
      ? (latestRecord ? practiceRecordTargetCount(latestRecord, template) : practiceTargetsForTemplate(template).length)
      : 0;
    const completedCount = latestRecord ? practiceRecordCompletedCount(latestRecord) : 0;
    const passed = template
      ? stepRecords.some((record) => practiceRecordPassesTemplate(record, template))
      : false;

    return {
      courseId: step.courseId,
      templateId: step.templateId,
      songId: course?.linkedSongId ?? null,
      type: template?.type ?? "unknown",
      title: course?.title ?? template?.display?.title ?? step.templateId,
      attempts: stepRecords.length,
      status: passed ? "passed" : stepRecords.length > 0 ? "in_progress" : "not_started",
      completedCount,
      targetCount,
      bestRhythmScore: rhythmScores.length > 0 ? Math.max(...rhythmScores) : null,
      latestRhythmScore: latestRecord ? practiceRecordRhythmScore(latestRecord) : null,
      weakPoint: latestRecord && template ? practiceRecordWeakPoint(latestRecord, template) : null
    };
  });
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

const coursePracticeTemplateIds = (course = {}) =>
  [course.primaryPracticeTemplateId, course.followupPracticeTemplateId].filter(
    (id) => typeof id === "string" && id.length > 0
  );

/**
 * @param {object} course
 * @param {Array<object>} history
 */
export const estimateMvpCourseProgress = (course = {}, history = []) => {
  const baseline = Math.max(0, Math.min(100, numberOrNull(course.defaultProgress) ?? 0));
  const practiceIds = coursePracticeTemplateIds(course);
  if (practiceIds.length === 0) return baseline;

  const records = Array.isArray(history) ? history.filter((record) => record && typeof record === "object") : [];
  const bestRecordProgress = records.reduce((best, record) => {
    const templateId = practiceIds.find((id) => practiceRecordMatchesTemplateId(record, id));
    if (!templateId) return best;

    const template = getMvpPracticeTemplate(templateId);
    const targetCount = Math.max(1, practiceRecordTargetCount(record, template));
    const completedRatio = Math.max(0, Math.min(1, practiceRecordCompletedCount(record) / targetCount));
    const rhythmScore = practiceRecordRhythmScore(record) ?? 0;
    const completedAll = completedRatio >= 1;
    const passed = practiceRecordHasPassedStatus(record);
    const recordProgress = passed || (completedAll && rhythmScore >= (template?.passingScore ?? 70))
      ? 100
      : completedAll
        ? 80
        : Math.max(25, Math.round(completedRatio * 80), Math.min(90, rhythmScore));

    return Math.max(best, recordProgress);
  }, 0);

  return Math.max(baseline, bestRecordProgress);
};

/**
 * @param {Array<object>} history
 * @param {{ type?: string }} [options]
 */
export const buildMvpCourseProgressPath = (history = [], options = {}) => {
  const type = options.type ?? "required";
  const items = mvpCourseCatalog
    .filter((course) => !type || course.type === type)
    .sort((a, b) => a.order - b.order)
    .map((course) => {
      const progress = estimateMvpCourseProgress(course, history);
      const status = progress >= 100 ? "done" : progress > 0 ? "current" : "locked";
      const minutes = course.estimatedMinutes ? `${course.estimatedMinutes} 分钟` : "MVP";
      const accessLabel = course.access === "pro" ? "Pro" : "免费";

      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        status,
        detail: `${minutes} · ${accessLabel}`,
        progress
      };
    });

  return items.map((item, index) => {
    const previousDone = index === 0 || items[index - 1].status === "done";
    return item.status === "locked" && previousDone
      ? { ...item, status: "current" }
      : item;
  });
};

export const designPrinciples = [
  "练习入口优先，不做营销式首页",
  "调音和跟练反馈必须大、清楚、低干扰",
  "颜色、文字、形状共同表达状态",
  "移动端触控目标不小于 44x44px",
  "后台和 Agent 控制台采用可访问组件与设计 tokens"
];
