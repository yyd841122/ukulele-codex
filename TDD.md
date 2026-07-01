# AI Ukulele Academy TDD

版本：v0.1  
日期：2026-07-01  
文档类型：Technical Design Document

## 0. 本次整合结论

本版 TDD 采用“本地实时 DSP + 可选离线/云端 ML + 可配置课程内容 + 多 Agent 工程协作”的技术路线。当前项目文档中更完整的 PitchEngine、PracticeEngine、算法评测体系继续作为主线；外部文档中更明确的 Expo development builds、monorepo 结构、API 草案、Audio ML 服务和内容后台能力已合并进来。

关键技术决策：

- 移动端推荐 React Native + Expo development builds + TypeScript。
- 低延迟拾音不依赖普通 JS 录音 API，必须通过自定义 Native Module/JSI/TurboModule 承载。
- MVP 默认实现 MPM + YIN/YINFFT 类轻量 DSP，后续评估 CREPE tiny/small、Basic Pitch、SPICE、SwiftF0、RT-SWIPE。
- 和弦/弹唱识别拆成 onset、F0、chroma/CQT、时间轴匹配，不把 F0 当成万能解法。
- 工程上采用 monorepo，保证移动端、API、算法评测、共享类型和 Agent 平台可协作演进。

## 1. 技术目标

本项目的技术目标是建立一个可长期扩展的 AI 音乐教学 App 技术底座，先支持尤克里里弹唱练习，后续扩展到更多乐器和课程形态。

核心挑战有三个：

1. 低延迟、稳定、准确的拾音和音高/节奏检测。
2. 可配置的课程、曲谱、练习和评分系统。
3. 可把大任务拆分、并行开发、自动验收的多智能体协作平台。

## 2. 推荐技术栈

### 2.1 客户端

推荐：React Native + TypeScript + 原生音频/DSP 模块。

原因：

- 跨 iOS/Android，业务 UI 迭代快。
- React Native 新架构支持 TurboModule/JSI，适合把性能敏感音频处理放到 C++/Swift/Kotlin 原生层。
- 课程、曲谱、练习页面可快速组件化。

推荐落地方式：

- Expo development builds，而不是仅依赖 Expo Go。
- 使用 config plugin 管理麦克风权限、后台音频能力、原生模块配置。
- Expo/JS 层录音 API 可用于录音文件和回放，不作为低延迟拾音核心。
- 导航使用 Expo Router 或 React Navigation。
- 轻状态使用 Zustand/Jotai，服务端状态使用 TanStack Query。

备选：

- Flutter：音频实时处理也可行，但后续接入 JS/AI Agent 工具链不如 TypeScript 生态顺手。
- 原生 iOS/Android：性能最佳，但开发成本高。

### 2.2 音频与 DSP

- 音频采集：原生 AudioRecord/AVAudioEngine。
- 实时处理：C++ DSP core，暴露给 React Native。
- 缓冲策略：ring buffer + worker thread。
- 可视化：UI 层只消费低频率特征结果，不直接处理 PCM。

### 2.3 后端

一期可不依赖后端，优先本地化。

二期推荐：

- API：Node.js/NestJS 或 FastAPI。
- 数据库：PostgreSQL。
- 对象存储：录音、课程媒体、曲谱资源。
- 队列：音频离线分析、内容生成、Agent 长任务。

### 2.4 工程结构

推荐 monorepo：

```text
apps/
  mobile/        React Native App
  api/           BFF/API 服务
  admin/         内容后台与 Agent 控制台
services/
  audio-ml/      离线音频分析、模型评测、数据集构建
packages/
  audio-core/    可复用 DSP/算法接口与测试工具
  shared/        类型、schema、工具函数
  design-tokens/ 设计 token 与主题
```

CI 至少包含：

- lint。
- typecheck。
- unit test。
- audio regression test。
- mobile build smoke test。
- schema compatibility test。

### 2.5 多智能体平台

- Agent Orchestrator：负责任务拆分、依赖管理、状态机。
- Agent Runtime：执行具体任务。
- Artifact Store：保存文档、代码、评测报告、验收结果。
- Review Gate：自动检查和人工确认。

## 3. 拾音算法研究结论

### 3.1 场景拆分

拾音不是一个单一问题，必须按场景拆：

| 场景 | 输入 | 技术目标 | 推荐策略 |
| --- | --- | --- | --- |
| 调音器 | 单根弦、持续拨弦 | 频率稳定、低延迟 | MPM/YIN 双实现评测后择优 |
| 单音练习 | 单音旋律 | 音名、音准、持续时间 | YIN/MPM + 平滑 |
| 人声音准 | 单声部歌唱 | F0 连续跟踪 | pYIN/CREPE/SPICE 候选 |
| 扫弦节奏 | 复音瞬态 | onset、节拍偏差 | onset detection + 能量包络 |
| 和弦识别 | 多根弦同时发声 | 和弦类别 | chroma/CQT + 模板/ML |
| 弹唱混合 | 尤克里里 + 人声 | 分离、同步、评分 | 先做准实时评分，后期引入 ML |

### 3.2 候选算法

| 算法 | 类型 | 优点 | 风险 | 产品建议 |
| --- | --- | --- | --- | --- |
| YIN | 经典自相关改进 | 成熟、可解释、低延迟 | 噪声和倍频/半频误判需处理 | 一期必须实现 |
| MPM | McLeod Pitch Method | 面向音乐场景，实时，带 clarity | 参数和峰值选择影响稳定性 | 一期必须实现，调音器首选候选 |
| pYIN | 概率 YIN + HMM | 跟踪更平滑，候选概率更可靠 | 实时复杂度更高 | 二期用于歌唱/旋律跟踪 |
| YINFFT/aubio | 成熟音频库/FFT 变体 | 工程成熟，含 onset、tempo、pitch 等能力 | 跨端封装和许可证需确认 | 作为 PoC/基线参考 |
| SWIPE/RT-SWIPE | 谱域/实时变体 | 对音乐音高估计有价值 | 实现复杂，实时变体较新 | 作为实验候选 |
| CREPE | CNN 单音 pitch tracker | 鲁棒性强，深度学习方案成熟 | 端侧算力、延迟、模型体积 | 作为高精度候选，不做一期默认 |
| SPICE | 自监督 pitch model | 可处理混合/噪声线索 | 部署和实时性需实测 | 用于离线/准实时评分候选 |
| Basic Pitch | 自动音乐转录 | 支持复音、音频转 MIDI | 更偏离线转录，不适合低延迟调音 | 用于曲谱生成/离线分析 |
| SwiftF0 | 2025 轻量单音模型 | 论文声称快且准 | 新方案生态成熟度待验证 | 进入实验池，不做一期默认 |

### 3.3 一期算法决策

一期默认路线：

1. 实现 MPM 和 YIN 两个本地实时算法。
2. 用同一批样本做自动基准测试。
3. 调音器默认选择样本表现更稳定者，另一个作为 fallback。
4. 对输出结果增加中值滤波、置信度门限、静音检测和连续帧确认。
5. 深度学习算法先不阻塞 MVP，只进入实验开关。

初始判断：

- 对尤克里里调音器，MPM 很适合作为首选候选，因为它面向音乐音高检测，实时运行，并提供 clarity 这类稳定度信号。
- YIN 更成熟、资料多、实现简单，适合作为并行基线。
- pYIN/CREPE/SPICE 更适合解决后续“连续旋律/人声/噪声”问题。
- 和弦识别不能靠 MPM/YIN 直接完成，需要独立的 chroma/CQT 或模型方案。

### 3.4 音频处理管线

```text
Microphone
  -> Audio Session / Permission
  -> PCM Ring Buffer
  -> Noise Gate / DC Removal
  -> Windowing
  -> Pitch Detector Strategy
  -> Confidence + Smoothing
  -> Note Mapper
  -> Practice Evaluator
  -> UI Feedback / Record
```

建议参数：

- sampleRate：44100 Hz 或 48000 Hz，按设备原生优先。
- internalRate：必要时重采样到 16000 Hz 或 22050 Hz 做部分特征提取。
- frameSize：2048 或 4096 samples，按延迟/精度评测选择。
- hopSize：256/512 samples。
- pitch range：尤克里里常用 100-1000 Hz，一期可扩大到 70-1200 Hz。
- silence gate：基于 RMS + 自适应环境噪声。
- stable frames：连续 3-5 帧达标后再确认。
- tuner threshold：±5 cents 优秀，±15 cents 可接受。
- practice threshold：音准可放宽到 ±35 cents，节奏 ±60 ms 优秀、±120 ms 可接受，并按 BPM 动态缩放。

## 4. 核心模块设计

### 4.1 PitchEngine

职责：

- 管理实时 PCM 输入。
- 执行 pitch detection。
- 输出 frequency、note、cents、confidence、clarity、timestamp。

接口草案：

```ts
export type PitchFrame = {
  timestampMs: number;
  frequencyHz: number | null;
  noteName: string | null;
  midi: number | null;
  cents: number | null;
  confidence: number;
  algorithm: "mpm" | "yin" | "crepe" | "spice" | "swiftf0";
};

export interface PitchEngine {
  start(config: PitchConfig): Promise<void>;
  stop(): Promise<void>;
  setAlgorithm(name: PitchAlgorithmName): void;
  onFrame(callback: (frame: PitchFrame) => void): () => void;
}
```

### 4.2 Tuner

- 使用 PitchEngine。
- 根据乐器调弦配置生成目标音。
- 自动选弦逻辑：选择距离当前频率最近且 confidence 足够的弦。
- 稳定状态机：idle -> detecting -> close -> inTune -> confirmed。

### 4.3 Metronome

- 使用高精度原生 timer 或音频时钟。
- 与练习时间轴共享 beat clock。
- 输出 beat index、bar index、accent。

### 4.4 PracticeEngine

职责：

- 加载练习脚本。
- 订阅 PitchEngine 和 Metronome。
- 计算用户输入与目标时间轴的偏差。
- 输出实时提示和练后报告。

练习脚本示例：

```json
{
  "id": "uke_basic_c_am_f_g",
  "type": "chord_switch",
  "instrument": "ukulele",
  "bpm": 70,
  "timeSignature": "4/4",
  "targets": [
    { "bar": 1, "beat": 1, "chord": "C" },
    { "bar": 2, "beat": 1, "chord": "Am" },
    { "bar": 3, "beat": 1, "chord": "F" },
    { "bar": 4, "beat": 1, "chord": "G" }
  ]
}
```

### 4.5 ChordRecognizer

一期不要承诺完整实时复音识别。建议分阶段：

1. v0.2：通过用户选择目标和弦，结合扫弦 onset 和练习时间点判断是否跟上节奏。
2. v0.3：加入 chroma/CQT 特征，做基础和弦模板匹配。
3. v0.4：积累样本后训练轻量模型。

### 4.6 ScoringEngine

评分维度：

- pitchAccuracy：音准。
- rhythmAccuracy：节奏。
- continuity：连续性。
- targetCompletion：目标完成度。
- stability：稳定度。

评分原则：

- 评分要可解释。
- 每个低分项必须给出原因。
- 分数只作为反馈，不替代具体建议。

### 4.7 Backend API

一期可先本地化，但接口契约要提前设计，方便后续云同步和内容后台接入。

初始 API 草案：

```text
GET  /courses?instrument=ukulele
GET  /lessons/:id
GET  /practice-templates/:id
POST /practice-sessions
POST /practice-sessions/:id/events
POST /practice-sessions/:id/finish
GET  /practice-sessions/:id/report
POST /audio-analysis/jobs
GET  /audio-analysis/jobs/:id
POST /agent/tasks
GET  /agent/tasks/:id
```

实时识别事件示例：

```json
{
  "sessionId": "ps_123",
  "timestampMs": 12420,
  "eventType": "note",
  "target": "C4",
  "detectedHz": 262.1,
  "detectedNote": "C4",
  "cents": 3.2,
  "confidence": 0.91,
  "timingOffsetMs": -42,
  "result": "hit"
}
```

### 4.8 Audio ML Service

职责：

- Offline Transcription：用 Basic Pitch 生成 note events/MIDI。
- Pitch Analysis：用 CREPE/pYIN/SPICE 对录音做复核。
- Dataset Builder：整理用户授权样本、设备信息、噪声条件、标签。
- Model Eval：按机型、噪声、BPM、和弦类型生成指标。

约束：

- 不参与 MVP 实时反馈链路。
- 只处理用户授权录音。
- 输出结构化分析结果，不把原始音频暴露给业务层。

### 4.9 UI 技术规范

移动端：

- 使用共享 design tokens 映射到 React Native 样式。
- 优先构建稳定组件：TunerDial、BeatGrid、ChordDiagram、PracticeTimeline、ScorePanel。
- 动效用于表达状态变化，不用于干扰音准/节奏判断。
- 所有 icon-only 控件要有 accessibilityLabel。

Web 管理后台/Agent 控制台：

- 可采用 shadcn/ui + Tailwind CSS。
- 使用三层 token：primitive -> semantic -> component。
- 表单、弹窗、菜单、命令面板优先使用可访问组件。
- 支持键盘导航、焦点可见、ARIA 标签、深色模式。

## 5. 数据模型

### 5.1 Instrument

```ts
type Instrument = {
  id: string;
  name: string;
  tunings: Tuning[];
  pitchRangeHz: [number, number];
};
```

### 5.2 Tuning

```ts
type Tuning = {
  id: string;
  name: string;
  strings: Array<{
    index: number;
    name: string;
    note: string;
    frequencyHz: number;
    midi: number;
  }>;
};
```

### 5.3 Chord

```ts
type Chord = {
  id: string;
  instrumentId: string;
  name: string;
  fingering: number[];
  fingers?: number[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
};
```

### 5.4 PracticeSession

```ts
type PracticeSession = {
  id: string;
  userId?: string;
  startedAt: string;
  endedAt: string;
  lessonId?: string;
  exerciseId: string;
  durationSec: number;
  score: PracticeScore;
  events: PracticeEvent[];
};
```

### 5.5 服务端数据表草案

- `users`：用户基础信息。
- `devices`：设备、系统、音频能力。
- `instruments`：乐器类型、调弦、音域。
- `courses`：课程、品类、难度、权益。
- `lessons`：章节、视频、讲义、练习列表。
- `practice_templates`：目标音符、节奏、和弦、评分规则。
- `songs`：歌曲元信息、版权状态、难度。
- `practice_sessions`：练习会话、得分、报告摘要。
- `practice_events`：识别事件与时间轴结果。
- `audio_samples`：授权音频样本、设备、噪声、标签。
- `memberships`：会员权益。
- `agent_tasks`：多智能体任务、状态、依赖、产物。

## 6. 算法评测设计

### 6.1 样本集

需要建立本地样本集：

- 单根弦标准音。
- 偏高/偏低不同 cents。
- 不同力度拨弦。
- 不同手机距离。
- 室内噪声。
- 扫弦、切音、人声干扰。

### 6.2 指标

- note accuracy。
- cents median absolute error。
- octave error rate。
- voiced/unvoiced accuracy。
- latency。
- jitter。
- CPU usage。
- battery impact。

### 6.3 验收门槛

- 调音器 note accuracy >= 98%。
- cents median absolute error <= 5 cents。
- octave error rate <= 1%。
- P95 latency <= 150 ms。
- 练习页面无明显 UI 卡顿。

## 7. 测试策略

### 7.1 单元测试

- note/frequency/midi/cents 转换。
- 调弦匹配。
- 评分规则。
- lesson script parser。

### 7.2 算法测试

- 固定 WAV 样本跑所有算法。
- 输出 CSV/JSON 报告。
- 每次算法参数调整必须对比基线。

### 7.3 集成测试

- 麦克风权限。
- 启停音频流。
- 后台/前台切换。
- 练习中断恢复。

### 7.4 体验测试

- iOS/Android 真机。
- 安静房间、普通房间、轻微噪声。
- 新手和有基础用户各至少 3 人试用。

## 8. 开发原则

- 算法先基准，后优化。
- 调音器和练习模块共享 PitchEngine，不重复实现。
- UI 不直接依赖具体算法，只依赖统一特征输出。
- 所有课程内容结构化，避免把课程写死在页面里。
- 所有 AI/Agent 输出必须经过验收清单。

## 9. 参考来源

- React Native 新架构文档：https://reactnative.dev/docs/the-new-architecture/landing-page
- YIN：https://pubmed.ncbi.nlm.nih.gov/12002874/
- MPM：https://www.cs.otago.ac.nz/graphics/Geoff/tartini/papers/A_Smarter_Way_to_Find_Pitch.pdf
- pYIN：https://webspace.eecs.qmul.ac.uk/s.e.dixon/pub/2014/MauchDixon-PYIN-ICASSP2014.pdf
- CREPE：https://github.com/marl/crepe
- SPICE：https://blog.tensorflow.org/2020/06/estimating-pitch-with-spice-and-tensorflow-hub.html
- Basic Pitch：https://github.com/spotify/basic-pitch
- SwiftF0：https://arxiv.org/html/2508.18440v1
- RT-SWIPE：https://www.audiolabs-erlangen.de/content/05_fau/professor/00_mueller/03_publications/2025_MeierSSMB_RealTimeSWIPE_CMMR_ePrint.pdf
