export const agentRoles = [
  {
    id: "planner",
    name: "Planner Agent",
    responsibility: "拆分 epic、story、task，维护依赖图和验收标准",
    artifact: "TaskPlan"
  },
  {
    id: "research",
    name: "Research Agent",
    responsibility: "检索竞品、算法、平台规范，输出可引用资料",
    artifact: "ResearchBrief"
  },
  {
    id: "audio-dsp",
    name: "Audio DSP Agent",
    responsibility: "实现拾音、调音、节奏检测、音频回归测试",
    artifact: "BenchmarkReport"
  },
  {
    id: "mobile",
    name: "Mobile Agent",
    responsibility: "实现移动端页面、状态流和原生音频桥接",
    artifact: "MobileDiff"
  },
  {
    id: "qa",
    name: "QA Agent",
    responsibility: "生成测试计划、验收清单、回归报告",
    artifact: "TestReport"
  },
  {
    id: "integrator",
    name: "Integrator Agent",
    responsibility: "整合代码、文档、测试和发布说明",
    artifact: "IntegrationReport"
  }
];

export const m0AgentTasks = [
  {
    id: "M0-001",
    title: "建立 monorepo 与基础 CI",
    ownerAgent: "integrator",
    status: "done",
    priority: "P0",
    dependencies: [],
    acceptanceCriteria: ["根目录 package.json 存在", "npm test 可运行"]
  },
  {
    id: "M0-002",
    title: "实现调音器算法基线",
    ownerAgent: "audio-dsp",
    status: "done",
    priority: "P0",
    dependencies: ["M0-001"],
    acceptanceCriteria: ["MPM 可检测 A4", "YIN 可检测 C4", "调音匹配测试通过"]
  },
  {
    id: "M0-003",
    title: "实现移动端 MVP 页面骨架",
    ownerAgent: "mobile",
    status: "done",
    priority: "P0",
    dependencies: ["M0-001"],
    acceptanceCriteria: ["包含首页、调音器、节拍器、和弦库、跟练页"]
  },
  {
    id: "M0-004",
    title: "接入真实麦克风音频流",
    ownerAgent: "mobile",
    status: "pending",
    priority: "P0",
    dependencies: ["M0-002", "M0-003"],
    acceptanceCriteria: ["真机可请求麦克风权限", "PitchFrame 可驱动调音器 UI"]
  }
];
