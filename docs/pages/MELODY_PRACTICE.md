# 单音跟弹页开发文档

页面：Melody Practice / 单音跟弹页
状态：开发中

## 1. 页面目标

单音跟弹页负责让用户在进入完整弹唱前，先练会“按节拍弹出目标单音”。

本页不是完整旋律教学，也不是歌曲伴奏页。MVP 阶段先提供目标音、弦/品位置、节拍推进和本地模拟评分，帮助新手熟悉左手找品、右手拨弦和节拍同步。

用户进入页面后，应能完成：
- 从歌曲详情进入单音练习。
- 看到当前目标音。
- 看到应该弹哪根弦、几品。
- 跟随节拍自动推进。
- 获得本地模拟的音准 / 节奏反馈。
- 完成后写入本地练习记录。

## 2. 用户场景

### 2.1 用户不会直接弹唱

用户看到歌曲片段后，担心边唱边换和弦太难。

页面响应：
- 提供“先练单音旋律”的入口。
- 用 4 到 8 个目标音组成短句。
- 每拍只弹一个音，降低难度。

### 2.2 用户想熟悉指板位置

用户知道 C、Am 等和弦，但不熟悉单音在哪。

页面响应：
- 显示 G / C / E / A 弦名。
- 显示目标弦和品位。
- 当前音高亮。

### 2.3 用户完成单音练习后

用户已经能跟节拍弹单音。

页面响应：
- 给出本地模拟评分。
- 建议回到歌曲片段跟弹。
- 记录本次练习。

## 3. 页面结构

```text
顶部
  返回
  单音跟弹
  当前歌曲 / BPM

当前目标
  音名
  弦名
  品位
  当前拍

音符序列
  1 C
  2 E
  3 G
  4 C

控制区
  -5 BPM
  +5 BPM
  开始 / 暂停
  重置
  完成本组

反馈区
  命中
  分数
  建议
```

## 4. 功能规格

### 4.1 目标音

MVP 使用页面内本地数据生成短句：
- C 调默认：C / E / G / C / A / G / E / C。
- G 调默认：G / B / D / G / E / D / B / G。
- Am 调默认：A / C / E / A / G / E / C / A。

每个音需要包含：
- note
- string
- fret
- beat

### 4.2 节拍推进

- 默认使用当前歌曲 BPM。
- 支持 -5 / +5。
- 点击开始后按 BPM 自动推进。
- 每次推进记录一次本地模拟事件。

### 4.3 评分

MVP 本地模拟评分：
- 使用固定偏移样本模拟命中。
- 显示命中次数、平均分和建议。
- 完成本组后写入本地练习记录。

后续真实音频阶段：
- 用 PitchFrame 判断目标音是否命中。
- 用 onset 与目标拍点偏移计算节奏。
- 不在本阶段接真实麦克风评分。

## 5. Preview 实现要求

`apps/mobile/dist-web/preview.html` 需要：
- 新增 `melody` sheet。
- 歌曲详情页增加“先练单音”入口。
- 单音页显示目标音、弦/品、音符序列。
- 支持开始 / 暂停、BPM 调整、重置、完成。
- 完成后写入最近练习。

## 6. App 同步要求

后续 `apps/mobile/App.tsx` 需要：
- 从歌曲详情进入单音练习。
- 使用 shared 的 melody exercise 数据。
- 后续接 PitchFrame 评分。

本轮优先完成 Preview。

## 7. 验收标准

- 免费歌曲详情页可点击“先练单音”。
- 单音页显示当前歌曲名和 BPM。
- 页面显示当前目标音、弦名、品位。
- 点击开始后目标音自动推进。
- 分数和命中次数随推进更新。
- 点击完成后最近练习更新。

## 8. 自动验证

```powershell
npm.cmd test
npx.cmd tsc -p apps/mobile --noEmit
node -e "const fs=require('fs'); const html=fs.readFileSync('apps/mobile/dist-web/preview.html','utf8'); const re=new RegExp('<script>([\\s\\S]*?)</script>','g'); const scripts=[...html.matchAll(re)]; new Function(scripts[scripts.length-1][1]); console.log('preview script syntax ok')"
git diff --check
Invoke-WebRequest -Uri http://localhost:8082/preview.html -UseBasicParsing -TimeoutSec 5
```

## 9. 人工测试清单

- 打开 Preview。
- 进入曲谱库。
- 点击免费歌曲。
- 点击“先练单音”。
- 点击开始，确认音符自动推进。
- 点击完成，确认最近练习更新。

## 10. 暂不做内容

本阶段暂不做：
- 完整旋律谱。
- 五线谱 / 简谱编辑器。
- 真实麦克风音准评分。
- 歌词逐字对齐。

## 11. 完成后的下一步

单音跟弹页验收并提交后，进入“和弦跟弹页”。

开工前新增：

```text
docs/pages/CHORD_FOLLOW.md
```
