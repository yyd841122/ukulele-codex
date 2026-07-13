# 单音跟弹页开发文档

页面：Melody Practice / 单音跟弹页
状态：Preview 与 Expo App 已同步

## 1. 页面目标

单音跟弹页负责让用户在进入完整弹唱前，先按节拍拨出目标单音。

MVP 阶段提供目标音、弦/品位置、节拍推进和本地模拟评分，帮助新手熟悉左手找品、右手拨弦和节拍同步。真实麦克风 PitchFrame 评分后续单独接入。

## 2. 当前入口

- Preview：歌曲详情 sheet 中点击“先练单音”。
- Expo App：曲谱库 -> 歌曲详情 -> 点击“先练单音”进入 `melodyRunner`。

## 3. 共享数据

单音短句已沉到 `packages/shared`：

- `mvpMelodyPracticePhrases.C`
- `mvpMelodyPracticePhrases.G`
- `mvpMelodyPracticePhrases.Am`

每个音符包含：

- `id`
- `note`
- `primaryNote`
- `string`
- `fret`
- `beat`

## 4. 功能规格

### 4.1 目标音

MVP 使用 8 个音组成短句：

- C 调：C / E / G / C / A / G / E / C
- G 调：G / B / D / G / E / D / B / G
- Am：A / C / E / A / G / E / C / A

页面显示当前音名、弦名、品位和拍点。

### 4.2 节拍推进

- 默认使用歌曲 BPM。
- 支持 -5 / +5 BPM。
- 点击开始后按 BPM 自动推进。
- 每次推进生成一次本地模拟评分事件。

### 4.3 评分与记录

MVP 评分为本地模拟：

- 展示命中数、平均分、轮次。
- 点击完成后写入本地练习记录。
- 记录进入“我的 / 最近练习”和课程路径统计。

后续真实音频阶段：

- 用 PitchFrame 判断目标音是否命中。
- 用 onset 与目标拍点偏移计算节奏分。
- 不在当前阶段强接真实麦克风评分。

## 5. 验收标准

- 免费歌曲详情页可以点击“先练单音”。
- 单音页显示当前歌曲名和 BPM。
- 页面显示当前目标音、弦名、品位。
- 点击开始后目标音自动推进。
- 分数和命中次数随推进更新。
- 点击完成后最近练习更新。
- Expo App 与 Preview 的页面能力一致。

## 6. 自动验证

```powershell
npm.cmd test
npx.cmd tsc -p apps/mobile --noEmit
node -e "const fs=require('fs'); const html=fs.readFileSync('apps/mobile/dist-web/preview.html','utf8'); const re=new RegExp('<script>([\\s\\S]*?)</script>','g'); const scripts=[...html.matchAll(re)]; new Function(scripts[scripts.length-1][1]); console.log('preview script syntax ok')"
git diff --check
```

## 7. 人工测试清单

- 打开 App 或 Preview。
- 进入曲谱库。
- 点击免费歌曲。
- 点击“先练单音”。
- 点击开始，确认音符自动推进。
- 点击完成，确认最近练习新增一条单音跟弹记录。

## 8. 暂不做内容

- 完整旋律谱。
- 五线谱 / 简谱编辑器。
- 真实麦克风音准评分。
- 歌词逐字对齐。

## 9. 下一步

单音跟弹验收并提交后，继续对齐：

- App 和弦库视觉密度与分类体验。
- 调音器 Native AudioEngine 预研。
- 继续把 Preview 内仍未共享的常量沉到 `packages/shared`。
