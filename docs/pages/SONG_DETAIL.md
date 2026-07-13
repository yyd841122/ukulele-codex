# 歌曲详情页开发文档

页面：Song Detail / 歌曲详情页
状态：开发中

## 1. 页面目标

歌曲详情页负责承接曲谱库，让用户在正式跟弹前看清这首歌要练什么。

本页不是完整播放器，也不是完整版权曲谱展示。MVP 阶段只展示歌曲片段、练习所需和弦、Key/BPM、推荐练习路径，并提供进入歌曲片段跟弹的入口。

用户进入页面后，应能完成：
- 看清歌曲标题、歌手、难度、Key、BPM。
- 看清本片段用到的和弦指法图。
- 知道练这首歌前建议先完成哪些基础练习。
- 查看片段小节和当前和弦。
- 点击进入歌曲片段跟弹。

## 2. 用户场景

### 2.1 从曲谱库点进免费歌曲

用户想确认这首歌自己能不能练。

页面响应：
- 显示 Key / BPM / 难度。
- 显示全部和弦指法图。
- 显示“先节奏、再换和弦、最后跟弹”的路径。

### 2.2 用户不会某个和弦

用户看到歌里有 G7 或 D。

页面响应：
- 在详情页直接显示该和弦指法图。
- 不要求用户跳去和弦库才能看懂。

### 2.3 用户准备开始跟弹

用户确认和弦和节奏都能接受。

页面响应：
- 主按钮进入歌曲片段跟弹。
- 如果当前歌曲没有片段模板，进入相关基础练习。

## 3. 页面结构

```text
顶部
  返回
  歌名
  歌手 / 难度
  Key / BPM / 星级

歌曲概览卡
  封面
  练习目标
  建议时长

和弦准备
  C / Am / F / G7 指法图

练习路径
  1 节奏型
  2 和弦转换
  3 歌曲片段

片段预览
  小节
  和弦
  练习歌词 / 口令

底部操作
  开始歌曲片段跟弹
```

## 4. 功能规格

### 4.1 信息展示

详情页必须展示：
- title
- artist
- diff / stars
- key
- bpm
- chords
- lyrics 或练习片段

### 4.2 和弦图

所有和弦必须以指法图展示，不允许只显示英文代码。

和弦图复用曲谱库 / 和弦库当前组件。

### 4.3 练习路径

MVP 固定显示三步：
1. 节奏型：先稳住右手。
2. 和弦转换：先练本歌用到的前两个或四个和弦。
3. 歌曲片段：进入跟弹。

后续可以根据用户历史记录动态调整。

### 4.4 操作

主按钮：
- 有 `templateId`：进入对应歌曲片段或基础练习。
- 没有 `templateId`：进入默认四和弦练习。

Pro 曲谱不进入详情，仍由曲谱库打开锁定提示。

## 5. Preview 实现要求

`apps/mobile/dist-web/preview.html` 需要：
- 重做 `songDetail` sheet 的主体结构。
- 增加歌曲概览卡。
- 增加和弦准备区。
- 增加三步练习路径。
- 改造片段预览行。
- 保留 `detailPlay` 入口。

## 6. App 同步要求

后续 `apps/mobile/App.tsx` 需要：
- 从曲谱库进入详情页，而不是直接只显示列表。
- 详情页复用 ChordMiniList / ChordDiagram。
- 主按钮进入 PracticeScreen 的 song fragment template。

本轮优先完成 Preview。

## 7. 验收标准

- 曲谱库点击免费歌曲能打开详情页。
- 详情页显示封面、Key、BPM、难度。
- 详情页显示所有和弦指法图。
- 详情页显示练习路径。
- 详情页显示片段小节。
- 点击主按钮能进入歌曲片段跟弹或相关练习。
- Pro 曲谱仍打开锁定提示。

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
- 点击底部“曲谱”。
- 点击免费歌曲。
- 确认详情页显示和弦图。
- 确认练习路径可见。
- 点击“开始歌曲片段跟弹”。
- 确认进入歌曲片段跟弹页。

## 10. 暂不做内容

本阶段暂不做：
- 完整曲谱滚动播放。
- 原曲音频。
- 伴奏音轨。
- 收藏与下载。
- 逐字歌词高亮。

## 11. 完成后的下一步

歌曲详情页验收并提交后，进入“单音跟弹页”。

开工前新增：

```text
docs/pages/MELODY_PRACTICE.md
```
