# AI 尤克里里弹唱 TDD

版本：v0.2
日期：2026-07-12
文档类型：Technical Design Document

## 1. 技术目标

本阶段技术目标不是重写全部代码，而是在现有 monorepo、音频算法和静态预览基础上，按新的产品信息架构重组页面、数据模型和练习运行时。

核心原则：

- 现有 `audio-core` 继续作为音频算法底座。
- 现有静态预览页继续作为快速验证入口。
- App 与 preview 尽量消费同一套结构化内容。
- 页面不再硬编码单一 C-Am-F-G7 流程，而是加载可扩展练习模板。
- 所有和弦相关场景必须能拿到指法图数据。

## 2. 当前技术资产

已存在并继续保留：

- `apps/mobile`：Expo / React Native App。
- `apps/mobile/dist-web/preview.html`：自包含静态预览页。
- `MVP_PREVIEW.html`：根预览入口。
- `packages/audio-core`：音名、频率、MIDI、cents、MPM/YIN、调音匹配、评分。
- `packages/shared`：标准调弦、基础和弦、课程模板、设计 token、Agent backlog。

音频能力现状：

- 浏览器 preview 已有麦克风 PoC，可做权限、电平、噪声门限、拨弦触发检测。
- Expo App 当前真实麦克风主要是权限和录音电平，真实 PCM 后续接 Native/JSI。
- 调音判定逻辑已经稳定，不重写算法，只重做页面消费方式。

## 3. 总体架构

```text
apps/mobile
  ├─ App UI
  ├─ Static Preview
  ├─ Practice Runtime
  ├─ Local Practice Store
  └─ Audio Adapter

packages/shared
  ├─ Navigation Content
  ├─ Chord Library
  ├─ Rhythm Patterns
  ├─ Chord Transition Exercises
  ├─ Song Catalog
  ├─ Learning Articles
  └─ Practice Templates

packages/audio-core
  ├─ Pitch Detection
  ├─ Tuner Matching
  ├─ Signal Helpers
  ├─ Practice Scoring
  └─ Feature Frame Utilities
```

## 4. 核心数据模型

### 4.1 导航与首页

```ts
type AppTab = "home" | "practice" | "songs" | "learn" | "profile";

type HomeModule = {
  id: "tuner" | "chords" | "songs" | "practice";
  title: string;
  subtitle: string;
  targetTab: AppTab;
  targetRoute?: string;
};

type CheckInDay = {
  date: string;
  minutes: number;
  completed: boolean;
};
```

### 4.2 和弦库

```ts
type ChordCategory = "all" | "major" | "minor" | "dominant7" | "suspended" | "favorite";

type ChordShape = {
  id: string;
  name: string;
  category: Exclude<ChordCategory, "all" | "favorite">;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tuning: "GCEA";
  frets: [number, number, number, number];
  fingers: [number, number, number, number];
  muted?: boolean[];
  favorite?: boolean;
  audioPreview?: {
    type: "synth" | "sample";
    assetId?: string;
  };
};
```

约定：

- 弦顺序统一为 G、C、E、A。
- `frets` 中 `0` 表示空弦，`-1` 表示不弹。
- `fingers` 中 `0` 表示不按，1/2/3/4 表示手指编号。

### 4.3 节奏型

```ts
type StrumAction = "down" | "up" | "rest" | "mute";

type RhythmStep = {
  beat: number;
  subdivision: number;
  action: StrumAction;
  accent?: boolean;
  label?: string;
};

type RhythmPattern = {
  id: string;
  title: string;
  timeSignature: "4/4" | "3/4" | "6/8";
  defaultBpm: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  steps: RhythmStep[];
  passRule: {
    minScore: number;
    minLoops: number;
  };
};
```

### 4.4 和弦转换练习

```ts
type ChordTransitionExercise = {
  id: string;
  title: string;
  chordIds: string[];
  defaultBpm: number;
  barsPerChord: number;
  loop: boolean;
  rhythmPatternId: string;
  passRule: {
    minScore: number;
    minCompletedSwitches: number;
  };
};
```

### 4.5 曲谱与歌曲练习

```ts
type Song = {
  id: string;
  title: string;
  subtitle?: string;
  source: "original" | "public_domain" | "licensed" | "exercise";
  difficulty: 1 | 2 | 3 | 4 | 5;
  bpm: number;
  key: string;
  chordIds: string[];
  estimatedMinutes: number;
  modes: SongPracticeMode[];
};

type SongPracticeMode = "melody" | "chords";

type MelodyNoteEvent = {
  bar: number;
  beat: number;
  stringName: "G" | "C" | "E" | "A";
  fret: number;
  durationBeats: number;
};

type ChordEvent = {
  bar: number;
  beat: number;
  chordId: string;
  durationBeats: number;
};
```

### 4.6 练习记录

```ts
type PracticeKind = "tuner" | "metronome" | "rhythm" | "chord_transition" | "melody_song" | "chord_song";

type PracticeSessionRecord = {
  id: string;
  kind: PracticeKind;
  targetId: string;
  startedAt: string;
  endedAt?: string;
  bpm?: number;
  loops?: number;
  score?: number;
  rhythmScore?: number;
  pitchScore?: number;
  completed: boolean;
  summary: string;
};
```

## 5. 页面技术设计

### 5.1 首页

数据来源：

- `homeModules`
- `checkInDays`
- `popularSongs`
- `recentPractice`

实现要求：

- 静态预览先用本地常量。
- App 后续从 shared 导入同源数据。
- 首页模块点击只负责导航，不承载复杂业务逻辑。

### 5.2 练琴页

练琴页是入口聚合页。

路由目标：

- `practice/tuner`
- `practice/metronome`
- `practice/chords`
- `practice/rhythm`
- `practice/chord-transition`

每个入口页内部再加载对应数据模型。

### 5.3 调音器

输入：

```ts
type TunerUiState = {
  permission: "unknown" | "granted" | "denied" | "mock";
  levelState: "idle" | "metering" | "plucked";
  frameState: "mock" | "browser_poc" | "native";
  targetString: "G" | "C" | "E" | "A";
  frame?: TunerFrame;
  noiseFloor: number;
  inputLevel: number;
};
```

处理流程：

1. 用户启动调音。
2. 校准或读取环境噪声。
3. 输入电平超过动态门限，并满足拨弦触发条件。
4. 生成 PitchFrame/TunerFrame。
5. 使用 `audio-core` 匹配目标弦与 cents。
6. 稳定达到通过条件后，自动切到下一根弦。

自动切弦规则：

- 连续若干帧目标弦一致。
- cents 在 ±8 内。
- 输入电平超过噪声门限且随后衰减。
- 冷却时间内不重复跳转。

### 5.4 节拍器

核心状态：

```ts
type MetronomeState = {
  bpm: number;
  timeSignature: "4/4" | "3/4" | "6/8";
  beatIndex: number;
  running: boolean;
  soundEnabled: boolean;
  accentEnabled: boolean;
};
```

Web preview：

- 使用 Web Audio API 生成重音和轻音。
- 第一拍使用更高音高或更强包络。

Expo App：

- MVP 可使用短音频资源。
- 后续可使用原生音频调度降低延迟。

### 5.5 和弦库

组件拆分：

- `ChordSearch`
- `ChordCategoryTabs`
- `ChordGrid`
- `ChordDiagram`
- `ChordAudioButton`
- `FavoriteChordSection`

试听实现：

- MVP：使用每根弦频率合成并同时发声。
- P1：增加真实尤克里里采样包。
- 所有试听必须按和弦多音处理。

### 5.6 节奏练习

运行时输入：

- `RhythmPattern`
- BPM。
- 循环次数。
- 声音开关。

事件：

- beat tick。
- expected strum step。
- user onset event。
- manual tap fallback。

评分：

- 计算 onset 与目标节拍点的偏移。
- 漏拍扣分。
- 连续命中奖励。
- 输出提前/滞后趋势。

MVP 没有真实麦克风时：

- 使用手动点击或模拟事件完成流程。
- 页面和数据结构保持与真实音频一致。

### 5.7 和弦转换

运行时输入：

- `ChordTransitionExercise`
- `ChordShape[]`
- `RhythmPattern`

页面必须能同时得到：

- 当前和弦指法图。
- 下一和弦指法图。
- 整体序列。
- 当前 beat/bar。

切换逻辑：

- 根据 `barsPerChord` 和 beat clock 自动推进当前和弦。
- 支持循环。
- 支持手动重置与暂停。

评分：

- MVP：根据完成轮次、节拍命中、手动确认记录。
- P1：加入麦克风 onset。
- P2：加入和弦识别。

### 5.8 曲谱库与跟弹

歌曲详情：

- 展示歌曲基本信息。
- 展示和弦列表，每个和弦用小指法图。
- 提供“单音跟弹”和“和弦跟弹”入口。

单音跟弹：

- 加载 `MelodyNoteEvent[]`。
- 根据 beat clock 推进当前音。
- 显示 string/fret 和接下来几个音。

和弦跟弹：

- 加载 `ChordEvent[]`。
- 根据 beat clock 推进当前和弦。
- 当前和弦展示大指法图，后续和弦展示小卡。

## 6. 音频与评分接入顺序

阶段 1：无麦克风也可练。

- 节拍器发声。
- 页面按时间轴推进。
- 手动完成或点击模拟练习事件。

阶段 2：接 onset。

- 用输入电平和短时能量检测扫弦触发。
- 用于节奏练习和和弦转换的节奏评分。

阶段 3：接 pitch。

- 单音跟弹可判断音高。
- 调音器继续使用现有 PitchFrame。

阶段 4：接和弦识别。

- 使用 chroma/CQT 或轻量模型判断和弦大类。
- 和弦转换和歌曲和弦跟弹进入真实评分。

## 7. 静态预览策略

`apps/mobile/dist-web/preview.html` 继续承担快速体验验证：

- 保持自包含。
- 不依赖 React bundle。
- 新页面先在 preview 中完成视觉和交互闭环。
- 关键数据结构要接近 shared，后续迁移到 App 时减少重写。

Preview 必须覆盖：

- 五 Tab 导航。
- 首页。
- 练琴入口页。
- 调音器。
- 节拍器。
- 和弦库。
- 节奏练习。
- 和弦转换。
- 曲谱库。
- 单音/和弦跟弹的基本流程。

## 8. 测试策略

单元测试：

- `audio-core` 音高、cents、调音匹配、评分函数。
- `shared` 内容模型 helper。
- 节奏型时间轴计算。
- 和弦转换推进逻辑。

类型检查：

- `npx.cmd tsc -p apps/mobile --noEmit`

Preview 检查：

- HTML 脚本语法检查。
- 本地服务返回 200。
- 浏览器手测核心流程。

人工验收：

- 首页核心内容一屏可读。
- 和弦相关页面均有指法图。
- 节拍器有声且重音明显。
- 调音器保留权限、电平、PitchFrame 状态。
- 节奏练习与和弦转换可按节拍循环。

## 9. 风险与处理

| 风险 | 处理 |
| --- | --- |
| 页面重做导致已有算法废弃 | 算法层保持不动，只替换 UI 消费结构 |
| Preview 与 App 分叉 | 先统一 shared 数据字段，再迁移页面 |
| 真实麦克风评分不稳定 | MVP 先保证时间轴练习可用，音频评分分阶段接入 |
| 歌曲版权风险 | 只使用自有、无版权、授权或练习型原创内容 |
| 页面再次变长 | 练习页采用一屏优先，报告进入折叠或结果页 |

## 10. 开发顺序

1. 文档确认：PRD/TDD/SDD。
2. shared 内容模型补齐。
3. Preview 五 Tab 新骨架。
4. 首页与练琴入口重做。
5. 和弦库新样式与试听。
6. 调音器新样式接回已有调音状态。
7. 节拍器独立页。
8. 节奏练习独立页。
9. 和弦转换独立页。
10. 曲谱库与歌曲详情。
11. 单音跟弹与和弦跟弹。
12. App.tsx 与 preview 对齐。
13. 真实音频评分增强。
