# Preview / Expo App 页面能力对齐表

版本：v0.2
日期：2026-07-14
目的：记录 `apps/mobile/dist-web/preview.html` 与 `apps/mobile/App.tsx` 的页面能力是否一致，作为后续“文档 -> 开发 -> 验证 -> 提交 -> 下一页”的任务台账。

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
| 智能调音器 Tuner | 浏览器 PoC 已完成 | 权限、电平、实时 PCM 调试指标与模拟兜底已完成 | tuner frame 已共享 | 部分对齐 |
| 节拍器 Metronome | 已完成 | 基础节拍器已同步 | BPM/节奏模板部分共享 | 已对齐 |
| 和弦库 Chord Library | 常用和弦大全已完成 | 分类、搜索、紧凑指法图网格已同步 | 和弦库已共享 | 已对齐 |
| 节奏型练习 Rhythm Practice | 多节奏型与自动评分模拟已完成 | 节拍声、评分记录已同步 | 模板与评分已共享 | 已对齐 |
| 和弦转换 Chord Transition | 多组转换与指法图已完成 | 转换练习与指法图已同步 | 模板与和弦已共享 | 已对齐 |
| 曲谱库 Song Library | 筛选、推荐、曲目入口已完成 | 搜索、筛选、曲目卡已同步 | 曲目目录已共享 | 部分对齐 |
| 歌曲详情 Song Detail | sheet、和弦准备、练习路线已完成 | 歌曲详情层已同步 | 曲目与练习模板已共享 | 已对齐 |
| 单音跟弹 Melody Practice | 已完成 Preview 交互 | `melodyRunner` 已同步 | 单音短句已共享 | 已对齐 |
| 和弦跟弹 / 歌曲片段 Follow Practice | 歌曲片段跟弹已完成 | PracticeScreen 支持 song_fragment | 模板与曲目已共享 | 已对齐 |
| 学习页 Learn | 学习路径页已完成 | 课程路径页已同步 | 课程路径已共享 | 已对齐 |
| 我的 / 记录 Me | 复盘页已完成 | 路径、成绩、建议、记录已同步 | 练习历史模型已共享 | 已对齐 |

## 当前主要差距

### 1. 调音器真实拾音仍是长期差距

Preview 浏览器 PoC 已有真实麦克风、噪声门限、拨弦触发、PitchFrame 状态。
Expo App 当前已接入 `expo-audio useAudioStream` 的实时 PCM 尝试，并保留录音电平和模拟兜底。

建议下一步：

- UI 层继续保持三段状态：权限 / 电平 / PitchFrame。
- 先做真机 development build 验证 `useAudioStream` 稳定性。
- 只有当 Expo Audio 流无法满足延迟或兼容性时，再进入 Native/JSI AudioEngine。

### 2. Shared 常量还可继续沉淀

近期已把单音短句、常用和弦与练习模板沉到 `packages/shared`。
后续可以继续把 Preview 内仍未共享的页面常量、展示分组、推荐策略逐步沉淀。

## 推荐继续开发顺序

1. 调音器真机 development build 测试。
2. 继续把 Preview 内仍未共享的常量沉淀到 `packages/shared`。

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
