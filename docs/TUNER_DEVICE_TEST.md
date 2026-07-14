# 调音器真机 Development Build 测试清单

版本：v0.1
日期：2026-07-14
范围：Expo App 调音器真实麦克风、`useAudioStream` 实时 PCM、PitchFrame 稳定性

## 1. 测试目标

本轮不重写 Native/JSI AudioEngine，先用真机验证 Expo Audio 实时 PCM 方案是否足够稳定。

需要确认：

- 麦克风权限能正常申请。
- `useAudioStream` 能持续产生 PCM buffer。
- 调音器能从真实 PCM 生成 PitchFrame。
- 新增调试指标能帮助判断是否需要进入 Native/JSI 分支。

## 2. 测试前准备

环境要求：

- 一台 Android 真机，或一台已开启开发者模式的 iPhone。
- 手机允许 USB 调试或本机开发调试。
- 电脑和手机网络可连接 Metro dev server。
- 项目依赖已安装。

项目已具备：

- `apps/mobile/app.json` 已配置 `expo-audio` 插件。
- Android 已配置 `RECORD_AUDIO`。
- iOS 已配置麦克风权限文案。
- `apps/mobile/package.json` 已提供 `android`、`ios`、`start` 脚本。

## 3. 启动命令

先在项目根目录运行自动检查：

```powershell
npm.cmd test
npx.cmd tsc -p apps/mobile --noEmit
```

Android 真机：

```powershell
npm.cmd --workspace @ukulele/mobile run android -- --device
```

iOS 真机：

```powershell
npm.cmd --workspace @ukulele/mobile run ios -- --device
```

如果 development build 已经安装在手机上，只需要启动 Metro：

```powershell
npm.cmd --workspace @ukulele/mobile run start
```

## 4. 页面入口

进入 App 后按以下路径测试：

```text
练琴入口 / 首页入口 -> 智能调音器 -> 开始调音
```

调音器页需要重点看这些区域：

- 权限状态。
- 输入电平。
- PitchFrame 状态。
- 实时 PCM 调试指标。
- 中间圆环调音反馈。
- G / C / E / A 四根弦切换。

## 5. 必测用例

### 5.1 权限

步骤：

1. 首次点击“开始调音”。
2. 允许麦克风权限。
3. 停止调音。
4. 再次开始调音。

通过标准：

- 首次点击才请求麦克风权限。
- 授权后权限状态显示已开通。
- 停止后电平归零。
- 再次开始不重复弹权限框。

失败记录：

```text
平台：
机型：
系统版本：
现象：
是否能恢复：
```

### 5.2 输入电平

步骤：

1. 开始调音后保持安静。
2. 轻拍手机附近。
3. 拨任意一根弦。
4. 停止调音。

通过标准：

- 安静时电平较低。
- 轻拍或拨弦时电平明显升高。
- 停止后电平回到 0。

重点记录：

```text
安静电平：
拨弦电平：
停止后是否归零：
```

### 5.3 PitchFrame

步骤：

1. 选择 A 弦。
2. 拨 A 弦。
3. 依次切换 G / C / E / A 并拨对应弦。

通过标准：

- PitchFrame 数量持续增加。
- 最近频率能随拨弦更新。
- A 弦应接近 A4 440 Hz。
- G / C / E / A 四根弦的目标音和 cents 反馈能对应切换。

重点记录：

```text
sampleRate：
channels：
encoding：
PitchFrame 数量是否增加：
A 弦最近频率：
```

### 5.4 延迟与稳定性

步骤：

1. 连续拨弦 10 次。
2. 连续开始 / 停止调音 10 次。
3. 调音页保持运行 2 分钟。

通过标准：

- buffer 间隔整体稳定。
- Pitch 延迟大多数时间低于 80ms。
- 拨弦后 200ms 内能看到调音反馈变化。
- 页面不卡顿，不崩溃。
- 切走页面后麦克风不会残留占用。

重点记录：

```text
buffer 间隔范围：
Pitch 延迟范围：
2 分钟后是否卡顿：
开始/停止 10 次是否异常：
```

### 5.5 噪声门限

步骤：

1. 在当前工作环境开始调音。
2. 不拨弦，观察风扇或环境噪声是否触发 PitchFrame。
3. 点击“校准环境噪声”。
4. 再次观察不拨弦状态。

通过标准：

- 普通环境噪声不应持续误判为拨弦。
- 校准后提示更稳定。
- 拨弦仍能触发 PitchFrame。

重点记录：

```text
校准前是否误触发：
校准后是否改善：
拨弦是否仍能识别：
```

## 6. 决策标准

继续使用 Expo Audio 的条件：

- Android 或 iOS 至少一个主测试平台稳定获得 PCM。
- Pitch 延迟大多数时间低于 80ms。
- 拨弦反馈能在 200ms 内出现。
- 连续开始 / 停止不崩溃。
- 环境噪声不会持续误触发。

进入 Native/JSI AudioEngine 预研的条件：

- 真机无法稳定获得 PCM。
- buffer 间隔明显抖动，导致调音反馈断续。
- Pitch 延迟长期超过 120ms。
- JS 线程处理导致页面明显卡顿。
- 停止或切页后麦克风占用无法可靠释放。

## 7. 反馈模板

人工测试后按这个格式回传即可：

```text
平台：
机型：
系统版本：
是否授权成功：
sampleRate / channels / encoding：
buffer 间隔：
Pitch 延迟：
A 弦最近频率：
PitchFrame 是否持续增加：
开始/停止 10 次是否正常：
2 分钟稳定性：
噪声误触发情况：
结论：通过 / 需修复 / 需要 Native 预研
```

## 8. 本轮不做

- 不保存原始音频。
- 不上传 PCM。
- 不做和弦识别。
- 不把普通跟练页改成自动请求麦克风。
- 不在没有真机数据前重写 Native/JSI。
