# 调音器 AudioEngine 技术预研

版本：v0.1
日期：2026-07-14
范围：Expo App 真实麦克风 PCM、PitchFrame、后续 Native/JSI AudioEngine

## 1. 当前结论

短期优先继续走 `expo-audio` 的 `useAudioStream` 实时 PCM 路线，不马上重写自定义 Native/JSI。

原因：

- 项目已经接入 `apps/mobile/src/audio/useRealtimeTunerStream.ts`。
- 官方 Expo Audio 文档说明 `useAudioStream(options)` 用于实时 PCM 麦克风捕获，buffer 包含 sample rate、channel count、timestamp 和原始 PCM data。
- 当前调音 UI 已经有“权限 / 电平 / PitchFrame”三段状态，可以无缝消费 PitchFrame。
- `packages/audio-core` 已经实现 pitch detection、cents、tuner matching，不需要重写算法。

Native/JSI 作为第二阶段备选：当真机测试发现 `expo-audio` 在延迟、稳定性或平台兼容性上达不到调音要求时，再进入自定义原生实现。

参考：

- Expo Audio docs: `https://docs.expo.dev/versions/latest/sdk/audio/`

## 2. 分阶段路线

### Phase 0：已完成

已有能力：

- 麦克风权限：`expoAudioEngine.ts`
- 录音电平：`useMicrophoneRecorderMonitor.ts`
- 实时 PCM 尝试：`useRealtimeTunerStream.ts`
- PitchFrame 适配：`tunerFrame.ts`
- 模拟兜底：`mockAudioEngine.ts`
- 调音算法：`packages/audio-core`

### Phase 1：Expo Audio 实时流真机验证

目标：

- 在 development build 真机上启动 `useAudioStream`。
- 将 PCM buffer 转为 mono `Float32Array`。
- 调用 `detectPitch(samples, sampleRate)`。
- 生成 `TunerFrame` 驱动调音器 UI。

必须验证：

- iOS 真机启动 / 停止是否稳定。
- Android 真机启动 / 停止是否稳定。
- `buffer.timestamp` 是否单调递增。
- `buffer.sampleRate` 是否符合预期。
- 单根弦拨弦后 200ms 内是否能稳定生成 pitch。
- 环境噪声下 silence gate 是否能避免误判。

当前代码加固：

- `useRealtimeTunerStream.ts` 已兼容 `float32` 与潜在 `int16` PCM buffer。
- 多声道输入会取第一声道转 mono。
- 调音器页面已显示实时 PCM 调试指标：sampleRate、buffer 间隔、Pitch 延迟、PitchFrame 数量。

### Phase 2：Native Module / JSI 备选

进入条件：

- `useAudioStream` 在任一主平台无法稳定获得 PCM。
- 延迟无法满足调音反馈。
- JS 线程处理 buffer 出现明显卡顿。
- 需要更严格的实时 onset / pitch / chord detection。

目标结构：

```text
Native AudioEngine
  microphone input
  ring buffer
  short frame window
  RMS / onset
  pitch detection input frame

JS / UI
  AudioEngineFrame
  PitchFrame
  TunerFrame
  practice scoring
```

Native 层只负责低延迟采样、缓冲和必要预处理。音高、cents、调音匹配仍优先复用 `audio-core`，除非性能验证证明必须迁移。

## 3. 统一帧模型

建议后续统一一个轻量中间帧：

```ts
type AudioInputFrame = {
  timestampMs: number;
  sampleRate: number;
  channels: number;
  rms: number;
  samples?: Float32Array;
};

type PitchFrame = {
  timestampMs: number;
  frequencyHz: number | null;
  confidence: number;
  rms: number;
  source: "expo-audio" | "native-jsi" | "browser-poc" | "mock";
};
```

UI 不直接依赖底层音频实现，只消费 `PitchFrame / TunerFrame`。

## 4. 调音器接入原则

- 调音器 UI 永远保留模拟兜底。
- 真实拾音入口集中在调音器和后续练习评分页，不在普通跟练页偷偷请求麦克风。
- 用户必须看得到：权限、输入电平、PitchFrame 状态。
- 不保存原始音频，不把 PCM 写入练习记录。
- 练习记录只保存评分、事件、时间戳、目标和建议。

## 5. 真机验收清单

完整执行步骤见：

- `docs/TUNER_DEVICE_TEST.md`

### 基础

- 点击“开始调音”后请求麦克风权限。
- 授权后电平条会随环境声变化。
- 停止后麦克风流关闭，电平归零。

### PitchFrame

- 拨 A 弦能识别接近 A4。
- 拨 G / C / E / A 后目标弦和 cents 能正确更新。
- ±8 cents 内显示“已准 · 不用调”。
- 正数偏高提示松弦，负数偏低提示拧紧。

### 噪声

- 普通风扇声不应持续触发 PitchFrame。
- 校准环境噪声后，门限提示应变得更稳定。

### 稳定性

- 连续启动 / 停止 10 次不崩溃。
- 切换页面后不会残留麦克风占用。
- 长时间调音 2 分钟内 UI 不明显卡顿。

## 6. 当前不做

- 不在本轮写自定义 Native/JSI。
- 不迁移 `audio-core` 算法到原生。
- 不保存或上传原始音频。
- 不接和弦识别模型。

## 7. 下一步任务

1. 按 `docs/TUNER_DEVICE_TEST.md` 做真机 development build 测试。
2. 记录 `useAudioStream` 的 buffer 间隔、Pitch 延迟、PitchFrame 数量和最近频率。
3. 真机验证后再决定是否开启 Native/JSI AudioEngine 分支。
