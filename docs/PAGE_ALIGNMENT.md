# Preview / Expo App 页面能力对齐表

版本：v0.1  
日期：2026-07-13  
目的：记录 `apps/mobile/dist-web/preview.html` 与 `apps/mobile/App.tsx` 的页面能力是否一致，作为后续继续开发的任务台账。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| 已对齐 | Preview 与 Expo App 都有对应页面结构、核心交互和数据含义 |
| 部分对齐 | 双端都有能力，但视觉、入口或数据细节仍有差距 |
| Preview 优先 | Preview 已完成主要体验，Expo App 尚未完整同步 |
| App 优先 | Expo App 已有能力，Preview 仅用于轻量验证或不需要同步 |

## 页面总览

| 页面 / 模块 | Preview 状态 | Expo App 状态 | Shared 数据 | 当前结论 |
| --- | --- | --- | --- | --- |
| 首页 Home | 已完成 | 已同步 | 部分共享 | 已对齐 |
| 练习入口 Practice Hub | 已完成 | 已同步 | 部分共享 | 已对齐 |
| 智能调音器 Tuner | 已完成浏览器 PoC | 已有权限、电平、模拟/录音监控管线 | 调弦与 tuner frame 已共享 | 部分对齐 |
| 节拍器 Metronome | 已完成 | 已同步基础节拍器 | BPM/节奏模板部分共享 | 已对齐 |
| 和弦库 Chord Library | 已完成常用和弦大全 | 已显示常用和弦与指法图 | 和弦库已共享 | 部分对齐 |
| 节奏型练习 Rhythm Practice | 已完成多节奏型与自动评分模拟 | 已有节奏模板、节拍声、评分记录 | 模板与评分已共享 | 已对齐 |
| 和弦转换 Chord Transition | 已完成多组转换与指法图 | 已有转换练习与指法图 | 模板与和弦已共享 | 已对齐 |
| 曲谱库 Song Library | 已完成筛选、推荐、曲目入口 | 已有搜索、筛选、曲目卡 | 曲目目录已共享 | 部分对齐 |
| 歌曲详情 Song Detail | 已完成详情 sheet、和弦准备、练习路线 | App 目前在曲谱列表内展开展示 | 曲目与练习模板已共享 | Preview 优先 |
| 单音跟弹 Melody Practice | 已完成 Preview 交互 | App 尚未单独同步 | 暂未抽共享模型 | Preview 优先 |
| 和弦跟弹 / 歌曲片段 Follow Practice | 已完成歌曲片段跟弹 | App PracticeScreen 支持 song_fragment | 模板与曲目已共享 | 已对齐 |
| 学习页 Learn | 已完成学习路径页 | 已同步课程路径页 | 课程路径已共享 | 已对齐 |
| 我的 / 记录 Me | 已完成复盘页 | 已同步路径、成绩、建议、记录 | 练习历史模型已共享 | 已对齐 |

## 当前主要差距

### 1. 歌曲详情页尚未在 App 端拆成独立详情

Preview 已有歌曲详情 sheet：和弦准备、练习路线、片段预览、单音/歌曲片段入口。  
Expo App 目前在 `SongsScreen` 里把曲目信息、片段和按钮直接放在列表卡内。

建议下一步：
- 在 App 端增加选中曲目状态。
- 点击曲目先进入详情视图，而不是直接在列表中展示所有片段。
- 详情视图复用 `ChordMiniList`、`ChordMiniCard` 和已有歌曲练习入口。

### 2. 单音跟弹仍是 Preview 优先

Preview 已有 `melody` sheet。  
Expo App 端暂未拆出 `MelodyPracticeScreen`，歌曲练习主要走 `song_fragment`。

建议下一步：
- 先把 melody practice 数据结构沉到 `packages/shared`。
- 再在 App 端增加 `melodyRunner` 内部页面。
- 复用当前 PracticeRunner 的 BPM、开始/暂停、完成记录能力。

### 3. 调音器真实拾音能力仍是长期差距

Preview 浏览器 PoC 已有真实麦克风、噪声门限、拨弦触发、PitchFrame 状态。  
Expo App 当前仍以权限、录音电平、模拟/监控管线为主，真实 PCM pitch detection 需要 Native/JSI 或可用音频流方案。

建议下一步：
- UI 层继续保持现有三段状态：权限 / 电平 / PitchFrame。
- 暂不强行在 Expo JS 里实现真实 PCM。
- 后续单独开 Native AudioEngine 任务。

### 4. 和弦库视觉仍可继续对齐

Preview 已按用户参考图做了更接近“和弦大全”的网格视觉。  
Expo App 已有指法图和共享和弦数据，但视觉密度与分类体验还可以继续靠近 Preview。

建议下一步：
- App 端和弦库增加分类横向筛选。
- 保持每张卡显示指法图，而不是只显示代码。
- 收藏和弦可以后置。

## 推荐继续开发顺序

1. App 端歌曲详情页同步。
2. App 端单音跟弹同步。
3. App 端和弦库分类与视觉密度优化。
4. 调音器 Native AudioEngine 技术预研。
5. 将 Preview 内仍未共享的常量继续沉淀到 `packages/shared`。

## 每轮收尾检查

每次页面同步后必须检查：

- 页面文档是否存在或已更新。
- Preview 与 App 是否使用相同的数据含义。
- 是否新增了只能在一端工作的入口。
- 是否需要用户人工测试。
- 是否已运行：

```powershell
npm.cmd test
npx.cmd tsc -p apps/mobile --noEmit
node -e "const fs=require('fs'); const html=fs.readFileSync('apps/mobile/dist-web/preview.html','utf8'); const re=new RegExp('<script>([\\s\\S]*?)</script>','g'); const scripts=[...html.matchAll(re)]; new Function(scripts[scripts.length-1][1]); console.log('preview script syntax ok')"
git diff --check
```
