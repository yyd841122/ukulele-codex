# AI Ukulele Academy SDD

版本：v0.1  
日期：2026-07-01  
文档类型：System Design Document

## 0. 本次整合结论

本版 SDD 以本地优先移动 App 为 MVP 主线，同时保留业务后端、内容后台、音频 ML 服务和多 Agent 协作平台的扩展位置。外部 SDD 中更完整的 BFF/API、内容后台、Audio ML、部署拓扑和第一批开发任务已合并；当前 SDD 中更细的本地 DSP、Practice Engine、数据流、接口和隐私约束继续保留。

系统建设顺序确认：

1. 先做移动端本地闭环：音频采集、调音、节拍、课程模板、单音跟练、练习报告。
2. 再做内容和数据闭环：课程后台、练习模板、曲谱配置、练习记录同步。
3. 再做智能增强：离线 ML 复盘、歌曲定制、AI 练习建议。
4. 多 Agent 平台从开发协作工具起步，后续可演进为内置项目/内容生产工作台。

## 1. 系统概览

本系统由移动客户端、本地音频算法层、本地数据层、可选云服务层、内容后台、音频 ML 服务、多智能体规划平台组成。

一期优先本地运行，减少账号、服务端、网络和隐私复杂度。后续再增加云同步、内容管理、离线分析和订阅系统。

```text
Mobile App
  ├─ Learning UI
  ├─ Tuner / Metronome / Chord Library
  ├─ Practice Engine
  ├─ Local Data Store
  ├─ Native Audio DSP
  └─ Agent Planning Console

Optional Cloud
  ├─ API Gateway / BFF
  ├─ Auth
  ├─ Course CMS
  ├─ Score Sync
  ├─ Audio Analysis Jobs
  └─ Agent Orchestrator
```

## 2. 架构原则

- 本地优先：麦克风实时分析默认在设备端完成。
- 算法可替换：所有 pitch/chord/rhythm 算法都通过 strategy 接口接入。
- 内容结构化：课程、曲谱、练习、评分规则使用数据驱动。
- 异步隔离：音频线程、算法线程、UI 线程互不阻塞。
- 可观测：算法输出、延迟、置信度、错误点都要可记录。
- 可验收：Agent 产出必须绑定测试、文档或人工验收结果。

## 3. 子系统设计

### 3.1 Mobile App

主要页面：

- Home：今日练习、继续课程、快速工具。
- Tuner：尤克里里调音器。
- Metronome：节拍器。
- Chords：和弦库。
- Lessons：课程列表和课程详情。
- Practice：互动跟练。
- Review：练习报告和录音回放。
- Agents：多智能体任务规划和执行状态。
- Settings：麦克风、算法、隐私、数据管理。

关键模块：

- `AudioEngine`：封装原生音频采集、DSP、模型推理接口。
- `PracticeRuntime`：将识别事件与课程目标时间轴匹配。
- `LessonPlayer`：视频播放、曲谱滚动、练习控制。
- `ReportRenderer`：练习报告与改进建议。
- `DesignTokenProvider`：移动端样式 token 映射。

### 3.2 Native Audio DSP

职责：

- 麦克风采集。
- 音频缓冲。
- 降噪/门限/预处理。
- pitch detection。
- onset detection。
- 基础特征输出。

线程模型：

```text
Audio Input Thread
  -> Lock-free Ring Buffer
DSP Worker Thread
  -> Feature Frames
JS/UI Thread
  -> Render Feedback
```

FeatureFrame：

```ts
type FeatureFrame = {
  timestampMs: number;
  rms: number;
  isVoiced: boolean;
  frequencyHz?: number;
  midi?: number;
  cents?: number;
  confidence: number;
  onset?: boolean;
  algorithm: string;
};
```

### 3.3 Learning Content System

内容类型：

- Course：课程集合。
- Lesson：单节课。
- Exercise：练习节点。
- SongChart：歌曲曲谱。
- ChordDefinition：和弦定义。
- RhythmPattern：节奏型。

Lesson 状态机：

```text
not_started -> in_progress -> practice_required -> completed -> review
```

Exercise 状态机：

```text
ready -> listening -> evaluating -> feedback -> retry_or_next
```

### 3.4 Practice Engine

输入：

- Lesson/Exercise script。
- Metronome clock。
- FeatureFrame。
- 用户操作。

输出：

- 实时提示。
- PracticeEvent。
- PracticeScore。
- ReviewReport。

PracticeEvent：

```ts
type PracticeEvent = {
  timestampMs: number;
  type:
    | "pitch_hit"
    | "pitch_miss"
    | "onset_hit"
    | "onset_miss"
    | "rhythm_early"
    | "rhythm_late"
    | "silence"
    | "section_complete";
  targetId?: string;
  observed?: unknown;
  expected?: unknown;
  confidence?: number;
};
```

### 3.5 Local Data Store

一期可使用 SQLite 或本地 KV + 文件系统。

数据范围：

- 用户设置。
- 练习记录。
- 课程进度。
- 和弦收藏。
- 算法评测报告。
- 本地自定义曲谱。

### 3.6 Cloud Services

二期以后引入：

- API Gateway/BFF：为移动端聚合课程、练习、用户状态。
- Auth Service：账号登录。
- Course CMS：课程和曲谱管理。
- Sync Service：进度和练习记录同步。
- Audio Job Service：录音离线分析。
- Agent Service：长任务编排和多 Agent 协作。

### 3.7 Content Admin

职责：

- 管理课程、章节、视频、图片、曲谱、练习模板。
- 配置练习目标音符、和弦、节奏网格、评分阈值。
- 管理授权状态、上架状态、会员权益。
- 审核 AI 生成或用户导入的歌曲练习内容。

设计建议：

- Web 端采用 shadcn/ui + Tailwind CSS + design tokens。
- 表格、筛选、表单、弹窗、审核流优先保证键盘可用和状态清晰。
- 不使用重营销式视觉，保持后台操作密度和可扫描性。

### 3.8 Audio ML Service

职责：

- 离线转录、复盘、数据集构建和模型评测。
- 运行 Basic Pitch、CREPE、pYIN、SPICE 等较重算法。
- 输出 note events、pitch curve、onset events、错误定位。
- 维护音频金样本和用户授权样本。

约束：

- 不阻塞实时练习反馈。
- 音频上传默认关闭，必须显式授权。
- 模型上线前必须通过固定样本集回归测试。

### 3.9 Design System

设计系统是跨移动端、后台、Agent 控制台共享的视觉与交互规则。

三层 token：

```text
Primitive Tokens -> Semantic Tokens -> Component Tokens
```

核心要求：

- primitive：原始颜色、字号、间距、圆角、阴影、动效时长。
- semantic：primary、success、warning、danger、surface、muted、focus 等语义。
- component：button、tuner、timeline、score-panel、chord-card 等组件专用 token。
- 所有状态必须可设计：default、pressed、focused、disabled、success、warning、error、loading。
- 调音/练习反馈颜色必须通过文字、形状或图标冗余表达，不能只靠颜色。
- 遵守可访问性：触控目标、焦点状态、ARIA/label、对比度、减少动效偏好。

## 4. 多智能体规划平台设计

### 4.1 目标

将“大功能开发”拆成可执行、可并行、可验收的小任务，提高开发效率和整体协作能力。

### 4.2 Agent 角色

| Agent | 职责 | 输出 |
| --- | --- | --- |
| Planner Agent | 拆任务、排依赖、定义验收 | TaskPlan |
| Research Agent | 检索竞品、算法、平台规范 | Research brief |
| Product Agent | 细化需求、用户故事、边界 | PRD delta |
| Architecture Agent | 技术方案、接口、数据流 | Design delta |
| Algorithm Agent | 算法选择、样本评测、参数建议 | Benchmark report |
| Audio DSP Agent | 拾音、调音、节奏、chroma/评测实现 | DSP implementation |
| UI/UX Agent | 页面结构、设计系统、可访问性检查 | UX spec / UI implementation |
| Frontend Agent | 页面、交互、状态管理 | UI implementation |
| Backend Agent | API、数据模型、任务队列 | Service implementation |
| Test Agent | 测试用例、自动化验证 | Test report |
| Review Agent | 代码审查、风险检查 | Review report |
| Integrator Agent | 合并结果、处理冲突、发版说明 | Integrated artifact |

### 4.3 Task 数据模型

```ts
type AgentTask = {
  id: string;
  title: string;
  description: string;
  ownerAgent: string;
  status: "pending" | "running" | "blocked" | "review" | "done";
  priority: "P0" | "P1" | "P2";
  dependencies: string[];
  inputs: string[];
  outputs: string[];
  acceptanceCriteria: string[];
  artifacts: string[];
  createdAt: string;
  updatedAt: string;
};
```

### 4.4 Orchestrator 流程

```text
User Goal
  -> Planner Agent creates TaskPlan
  -> Review Gate confirms scope
  -> Agents execute independent tasks
  -> Test Agent validates artifacts
  -> Review Agent checks risks
  -> Integrator Agent merges outputs
  -> Final Report
```

### 4.5 验收机制

每个任务必须具备：

- 明确输入。
- 明确输出。
- 自动测试或人工检查标准。
- 失败处理策略。
- 产物路径。

Agent 不允许只输出“建议”，必须输出可落地 artifact，例如文档、代码、测试、报告、数据文件。

### 4.6 推荐使用的 Skills

当前可用结论：

- `ui-ux-pro-max`：本地目前只有 catalog entry，完整上游模板、数据和搜索 workflow 未安装；可作为未来安装候选，不作为当前可直接依赖的设计库。
- `ckm:ui-styling`：适合 Web 管理后台、Agent 控制台、可访问组件、Tailwind/shadcn 风格落地。
- `ckm:design-system`：适合建立 design tokens、组件状态规范和设计到代码交接。
- `ckm:brand`：后期做产品命名、品牌语气、视觉识别时使用。
- `documents:documents`、`presentations:Presentations`：后期需要输出正式方案文档或路演材料时使用。

## 5. 数据流

### 5.1 调音器数据流

```text
Mic PCM
  -> PitchEngine
  -> PitchFrame
  -> TuningMatcher
  -> TunerState
  -> UI Needle + Status
  -> Optional Session Log
```

### 5.2 互动练习数据流

```text
Lesson Script + Beat Clock + FeatureFrame
  -> PracticeEngine
  -> PracticeEvent
  -> Realtime Feedback
  -> PracticeScore
  -> ReviewReport
  -> Local Store
```

### 5.3 算法评测数据流

```text
WAV Dataset + Ground Truth
  -> Algorithm Runner
  -> Prediction CSV
  -> Metrics Calculator
  -> Benchmark Report
  -> Algorithm Decision
```

## 6. 关键接口

### 6.1 AlgorithmStrategy

```ts
interface AlgorithmStrategy {
  name: string;
  configure(config: Record<string, unknown>): void;
  process(frame: Float32Array, sampleRate: number, timestampMs: number): FeatureFrame;
  reset(): void;
}
```

### 6.2 LessonRepository

```ts
interface LessonRepository {
  listCourses(): Promise<Course[]>;
  getLesson(id: string): Promise<Lesson>;
  saveProgress(progress: LessonProgress): Promise<void>;
}
```

### 6.3 AgentOrchestrator

```ts
interface AgentOrchestrator {
  createPlan(goal: string): Promise<TaskPlan>;
  runTask(taskId: string): Promise<AgentTaskResult>;
  reviewTask(taskId: string): Promise<ReviewResult>;
  integrate(planId: string): Promise<IntegrationResult>;
}
```

## 7. 部署视图

### 7.1 一期

```text
iOS/Android App
  - UI Bundle
  - Native Audio DSP
  - Local SQLite
  - Local Content JSON
```

### 7.2 二期

```text
Mobile App
  -> API Gateway
  -> Auth Service
  -> Course Service
  -> Practice Sync Service
  -> Audio Analysis Worker
  -> Agent Orchestrator
  -> PostgreSQL + Object Storage
```

## 8. 安全与隐私

- 麦克风权限按需申请。
- 首次开启练习前解释音频用途。
- 默认不上传原始录音。
- 上传录音用于云分析时必须单次明确授权。
- 支持删除本地练习记录和录音。
- Agent 平台不得把用户私密录音自动发送给外部模型。

## 9. 可观测性

客户端记录：

- 算法名称和版本。
- 音频采样率、frameSize、hopSize。
- 每帧 latency、confidence、frequency。
- 练习事件和评分。
- 崩溃、权限失败、音频设备异常。

注意：日志默认不包含原始音频。

## 10. 里程碑

### M1：技术验证

- 麦克风实时采集。
- MPM/YIN 实现。
- 调音器原型。
- 样本评测脚本。

### M2：MVP 骨架

- App 导航。
- 调音器、节拍器、和弦库。
- 本地存储。
- 练习脚本解析。

### M3：互动练习

- 单音练习。
- 和弦切换练习。
- 节奏跟练。
- 评分和练习报告。

### M4：弹唱样例

- 歌曲跟练页面。
- 歌词/和弦/小节同步。
- 录音回放。
- 错误时间轴。

### M5：Agent 平台

- TaskPlan 创建。
- 子任务状态管理。
- 验收清单。
- 集成报告。

### M0 当前第一批开发任务

1. 建立 monorepo 与基础 CI。
2. 实现移动端音频采集 PoC。
3. 实现尤克里里调音器算法与 UI。
4. 建立 30-50 条尤克里里音频金样本和算法评测脚本。
5. 实现课程模板 JSON schema。
6. 实现单音跟练的时间轴匹配与评分。
7. 搭建多智能体任务表与 artifact 记录模型。

## 11. 开放问题

- 首期是否只做移动端，还是同时做 Web 调试台。
- 是否需要账号系统进入 v0.3。
- 曲谱导入格式优先 ChordPro、MusicXML 还是自定义 JSON。
- 深度学习算法是端侧部署、云端分析，还是两者并存。
- 多智能体平台是内置到产品里，还是作为开发者后台工具。

## 12. 参考来源

- AI 音乐学园官网：https://s.immusician.com/
- 小米应用商店：https://app.xiaomi.com/details?id=com.immusician.music
- 应用宝：https://sj.qq.com/appdetail/com.immusician.music
- React Native 新架构文档：https://reactnative.dev/docs/the-new-architecture/landing-page
- YIN：https://pubmed.ncbi.nlm.nih.gov/12002874/
- MPM：https://www.cs.otago.ac.nz/graphics/Geoff/tartini/papers/A_Smarter_Way_to_Find_Pitch.pdf
- pYIN：https://webspace.eecs.qmul.ac.uk/s.e.dixon/pub/2014/MauchDixon-PYIN-ICASSP2014.pdf
- CREPE：https://github.com/marl/crepe
- SPICE：https://blog.tensorflow.org/2020/06/estimating-pitch-with-spice-and-tensorflow-hub.html
- Basic Pitch：https://github.com/spotify/basic-pitch
- SwiftF0：https://arxiv.org/html/2508.18440v1
- RT-SWIPE：https://www.audiolabs-erlangen.de/content/05_fau/professor/00_mueller/03_publications/2025_MeierSSMB_RealTimeSWIPE_CMMR_ePrint.pdf
