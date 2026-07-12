# 调音器页开发文档

版本：v0.1
日期：2026-07-12
页面：Tuner / 智能调音器
阶段：先完成 Preview，再同步 App

## 1. 页面目标

调音器页负责让新手在练习前快速把尤克里里调到标准 GCEA。

本页不重写音频算法。已有的 `audio-core` 调音匹配、cents 判定、PitchFrame 管线继续保留，本阶段只做页面结构、交互和状态展示优化。

用户进入页面后，应能一屏内看清：

- 当前调弦模式：High-G / 标准 GCEA。
- 权限、电平、PitchFrame 三段状态。
- 中间圆环式调音核心区。
- 输入电平与噪声门限。
- G / C / E / A 四根弦选择。
- 开始/停止调音、校准环境噪声。

## 2. 用户场景

### 2.1 练习前调音

用户目标：

- 先选中要调的弦。
- 拨单根弦。
- 看到当前音名、偏差和该松弦还是拧紧。
- 偏差进入绿色区后知道可以进入练习。

页面响应：

- 大号音名和圆环仪表放在视觉中心。
- ±8 cents 内显示绿色“已准 · 不用调”。
- 正数偏高提示“请松弦”。
- 负数偏低提示“请拧紧”。
- 8-12 cents 显示接近目标，超过 12 cents 才强提示松/紧。

### 2.2 噪声环境下调音

用户目标：

- 知道麦克风是否已授权。
- 知道当前输入电平是否来自环境噪声。
- 能校准环境噪声，减少误判。

页面响应：

- 保留“权限 / 电平 / PitchFrame”三段状态。
- 显示输入电平百分比和噪声门限倍数。
- 提示“拨弦触发检测”，避免让用户以为风扇声也应被识别。

## 3. 页面结构

首屏从上到下：

```text
顶部
  返回
  智能调音器
  High-G / 标准 GCEA 状态

三段状态
  权限
  电平
  PitchFrame

核心圆环
  当前音名
  调音结论
  频率与来源
  指针 / cents 偏移

输入电平
  电平百分比
  进度条
  噪声门限

四根弦
  G / C / E / A

主操作
  开始/停止调音
  校准环境噪声
```

布局要求：

- 375px 宽度下核心内容尽量一屏可见。
- 圆环核心区必须比电平、按钮更突出。
- 状态卡片不占过多高度。
- 四根弦按钮必须足够大，便于触控。

## 4. 模块规格

### 4.1 顶部区域

内容：

- 标题：智能调音器。
- 右侧模式：High-G 或标准 GCEA。
- 返回按钮：回到练琴入口页。

验收：

- 用户知道当前是调音器，不是普通练习页。
- 返回后回到练琴入口页。

### 4.2 三段状态

三段：

| 状态 | 说明 |
| --- | --- |
| 权限 | 预览模拟、已授权、未授权 |
| 电平 | 待读取、读取中、拨弦触发 |
| PitchFrame | 模拟帧、真实帧、处理中 |

验收：

- Preview 阶段也必须显示三段状态。
- App 阶段复用已有 `ensureMicrophoneAccess`、录音电平和 `useRealtimeTunerStream`。

### 4.3 圆环调音核心区

内容：

- 大号当前音名。
- 状态文案。
- 频率和数据来源。
- 指针或偏移量可视化。

状态规则：

| cents | 文案 | 颜色 |
| --- | --- | --- |
| `abs(cents) <= 8` | 已准 · 不用调 | 绿色 |
| `8 < abs(cents) <= 12` | 接近目标 | 青绿色 |
| `cents > 12` | 偏高 · 请松弦 | 红/橙 |
| `cents < -12` | 偏低 · 请拧紧 | 蓝 |

验收：

- 不能只显示英文代码。
- 不能让用户自己理解 cents 的含义，必须给明确动作建议。
- 圆环样式保留，替换掉旧的长条式核心显示。

### 4.4 输入电平与噪声门限

内容：

- 输入电平百分比。
- 电平条。
- 噪声门限倍数。
- 简短提示。

验收：

- 能说明当前是模拟、浏览器 PoC，还是 App 真实电平。
- 校准环境噪声按钮可点击，并更新提示。

### 4.5 四根弦选择

四根弦：

- G：4弦。
- C：3弦。
- E：2弦。
- A：1弦。

验收：

- 当前弦高亮。
- 已准的弦显示绿色状态。
- 点击弦后调音核心区更新目标音。

### 4.6 主操作

操作：

- 开始调音。
- 停止调音。
- 校准环境噪声。

验收：

- 点击开始后，Preview 模拟帧循环更新。
- 点击停止后，状态回到可再次开始。
- 不在跟练页偷偷请求麦克风；麦克风入口集中在调音器和后续练习评分页。

## 5. 数据来源

Preview 阶段：

- 保留 `preview.html` 内的模拟 PitchFrame。
- 保留浏览器麦克风 PoC 能力，如果当前环境支持 localhost + getUserMedia。
- 状态与交互先在静态页跑通。

App 阶段：

- 继续使用：
  - `apps/mobile/src/audio/expoAudioEngine.ts`
  - `apps/mobile/src/audio/useMicrophoneRecorderMonitor.ts`
  - `apps/mobile/src/audio/useRealtimeTunerStream.ts`
  - `apps/mobile/src/audio/tunerFrame.ts`
  - `apps/mobile/src/audio/mockAudioEngine.ts`
- 继续使用 `@ukulele/shared` 的标准调弦。
- 继续使用 `@ukulele/audio-core` 的调音匹配逻辑。

## 6. Preview 实现要求

文件：

- `apps/mobile/dist-web/preview.html`

必须完成：

- 调音器 sheet 使用新结构。
- 中间核心区使用圆环式仪表。
- 三段状态可见。
- 输入电平、噪声门限、四根弦和主按钮可见。
- 点击四根弦会切换目标弦。
- 点击开始会进入调音模拟/PoC 状态。
- 点击校准环境噪声会更新提示。

暂不要求：

- 浏览器 PoC 在所有环境都能真实拿到麦克风。
- 用 WebAudio 完整替代 App 的后续 Native/JSI AudioEngine。

## 7. App 同步要求

文件：

- `apps/mobile/App.tsx`

必须完成：

- `TunerScreen` 视觉结构与 Preview 对齐。
- 保留真实麦克风授权按钮。
- 保留实时 PitchFrame 启动按钮。
- 保留模拟帧兜底。
- 四根弦选择状态与核心圆环联动。

暂不要求：

- 真机 Native PCM 低延迟接入。
- 长期调音记录统计。
- 多种调弦库。

## 8. 验收标准

调音器页完成必须满足：

- 从练琴入口页点击“智能调音器”能进入调音器。
- 页面顶部、三段状态、圆环核心区、电平、四根弦、按钮都可见。
- 点击 G / C / E / A 会切换目标弦。
- 点击开始后，Preview 能看到模拟调音状态变化。
- 点击校准环境噪声有反馈。
- App 侧 TypeScript 通过。
- 不破坏练琴入口页、首页和底部 Tab。

## 9. 测试清单

自动验证：

```powershell
npm.cmd test
npx.cmd tsc -p apps/mobile --noEmit
node -e "const fs=require('fs'); const html=fs.readFileSync('apps/mobile/dist-web/preview.html','utf8'); const re=new RegExp('<script>([\\s\\S]*?)</script>','g'); const scripts=[...html.matchAll(re)]; new Function(scripts[scripts.length-1][1]); console.log('preview script syntax ok')"
Invoke-WebRequest -Uri http://localhost:8082/preview.html -UseBasicParsing -TimeoutSec 5
```

人工验证：

- 打开 `preview.html`。
- 进入“练琴”。
- 点击“智能调音器”。
- 确认页面中间是圆环调音核心区。
- 点击 G / C / E / A，确认目标弦切换。
- 点击“开始调音”，确认状态变化。
- 点击“校准环境噪声”，确认提示变化。
- 点击返回，确认回到练琴入口页。

## 10. 暂不做

本页阶段暂不做：

- 真机 Native/JSI AudioEngine 完整接入。
- 非 GCEA 调弦模式库。
- 云端调音记录。
- 调音教程文章。
- 调音通过后自动跳转练习。

这些进入后续音频工程和学习页阶段处理。

## 11. 完成后的下一步

调音器页验收并提交后，进入“节拍器页”。

节拍器页开工前新增：

- `docs/pages/METRONOME.md`
