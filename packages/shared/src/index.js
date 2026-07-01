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

export const designPrinciples = [
  "练习入口优先，不做营销式首页",
  "调音和跟练反馈必须大、清楚、低干扰",
  "颜色、文字、形状共同表达状态",
  "移动端触控目标不小于 44x44px",
  "后台和 Agent 控制台采用可访问组件与设计 tokens"
];
