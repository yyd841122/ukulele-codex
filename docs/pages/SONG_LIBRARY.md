# 曲谱库页开发文档

页面：Song Library / 曲谱库页
状态：开发中

## 1. 页面目标

曲谱库页负责把用户从专项练习带入真实弹唱场景。

本页不是完整版权曲谱平台，也不是课程页。MVP 阶段先提供可练的歌曲片段、原创练习曲和 Pro 锁定入口，让用户能按难度、Key、BPM、和弦组成选择下一首练习内容。

用户进入页面后，应能完成：
- 浏览推荐曲谱和练习曲。
- 按入门、进阶、Pro 筛选。
- 搜索歌名、歌手、Key 或和弦。
- 看到每首歌的 Key、BPM、难度、和弦指法图。
- 进入歌曲详情页。
- 从详情页进入歌曲片段跟弹。

## 2. 用户场景

### 2.1 刚完成节奏和和弦转换

用户已经练过下扫四拍和 C-Am-F-G7 转换，准备弹第一段歌。

页面响应：
- 推荐入门歌曲片段。
- 明确显示“用到的和弦”和“建议先练什么”。
- 点击后进入歌曲详情，再进入歌曲片段跟弹。

### 2.2 用户想找适合当前水平的歌

用户不知道自己能弹什么。

页面响应：
- 入门筛选只显示 1 星歌曲和练习曲。
- 每首歌显示和弦图，不只显示英文代码。
- BPM、Key、难度一眼可见。

### 2.3 用户点到 Pro 曲谱

用户看到会员曲谱。

页面响应：
- 打开 Pro 锁定提示。
- 不进入空白或不可用详情。
- 当前 MVP 不接真实支付。

## 3. 页面结构

```text
顶部 Hero
  曲谱库
  从歌曲片段开始弹唱

搜索
  搜索歌名 / 歌手 / Key / 和弦

筛选
  全部
  入门
  进阶
  Pro

推荐曲谱
  封面
  歌名 / 歌手
  Key / BPM / 难度
  和弦指法图
  开始按钮

曲谱列表
  歌曲卡片
  Key / BPM / 星级 / 练习目标
  和弦指法图

歌曲详情
  标题 / 歌手 / Key / BPM
  用到的和弦图
  片段歌词或练习行
  开始歌曲片段跟弹
```

## 4. 功能规格

### 4.1 曲谱数据

MVP 曲谱分三类：

| 类型 | 说明 |
| --- | --- |
| 入门 | 免费，适合完成调音、节奏、和弦转换后的第一批练习 |
| 进阶 | 免费或部分免费，和弦数量更多 |
| Pro | 锁定入口，后续接会员和完整曲谱 |

每首歌至少包含：
- title
- artist
- key
- bpm
- difficulty / stars
- chords
- templateId
- lyrics 或练习片段

### 4.2 和弦展示

所有曲谱卡片必须展示和弦指法图，不允许只显示 C、G、Am、F 等英文代码。

曲谱详情页也必须展示用到的和弦图，帮助新手先看指法再练歌。

### 4.3 搜索与筛选

搜索匹配：
- 歌名
- 歌手
- Key
- 和弦名

筛选：
- 全部
- 入门：stars <= 1
- 进阶：stars == 2
- Pro：会员内容

### 4.4 练习入口

免费曲谱点击后进入详情页。

详情页主按钮：
- 有 `templateId`：进入歌曲片段跟弹。
- 没有 `templateId`：进入四和弦或相关基础练习。

Pro 曲谱点击后打开锁定提示。

## 5. 数据来源

当前 Preview 可继续使用页面内 `songs` 常量。

后续需要逐步沉淀到：
- `packages/shared` 的 song catalog。
- practice template 与 song 的关联。
- 课程与歌曲片段的关联。

## 6. Preview 实现要求

`apps/mobile/dist-web/preview.html` 需要：
- 优化曲谱库首页。
- 增加推荐曲谱卡。
- 增加曲谱统计信息。
- 扩展入门练习曲数量。
- 曲谱卡显示和弦指法图。
- 搜索支持和弦名。
- 点击免费曲谱进入详情。
- 点击 Pro 曲谱进入锁定提示。

## 7. App 同步要求

`apps/mobile/App.tsx` 后续需要：
- 使用 shared song catalog。
- 曲谱列表显示和弦指法图。
- 支持搜索和筛选。
- 点击歌曲进入详情或歌曲片段跟弹。

本轮优先完成 Preview，App 同步在 Preview 验收后推进。

## 8. 验收标准

- 底部 Tab 点击“曲谱”能进入曲谱库。
- 页面显示搜索、筛选、推荐曲谱和曲谱列表。
- 曲谱卡显示 Key、BPM、难度、和弦图。
- 搜索 C、G、Am、歌名、歌手均能匹配。
- 入门 / 进阶 / Pro 筛选可用。
- 免费歌曲可进入详情。
- Pro 歌曲打开锁定提示。
- 详情页可进入歌曲片段跟弹。

## 9. 自动验证

```powershell
npm.cmd test
npx.cmd tsc -p apps/mobile --noEmit
node -e "const fs=require('fs'); const html=fs.readFileSync('apps/mobile/dist-web/preview.html','utf8'); const re=new RegExp('<script>([\\s\\S]*?)</script>','g'); const scripts=[...html.matchAll(re)]; new Function(scripts[scripts.length-1][1]); console.log('preview script syntax ok')"
git diff --check
Invoke-WebRequest -Uri http://localhost:8082/preview.html -UseBasicParsing -TimeoutSec 5
```

## 10. 人工测试清单

- 打开 Preview。
- 点击底部“曲谱”。
- 确认推荐曲谱和列表可见。
- 搜索 `C`，确认包含 C 和弦的歌曲可见。
- 搜索 `G`，确认 G 调或 G 和弦歌曲可见。
- 点击“入门”，确认只显示入门内容。
- 点击“Pro”，确认会员内容可见。
- 点击免费歌曲，确认进入详情。
- 点击 Pro 歌曲，确认出现锁定提示。

## 11. 暂不做内容

本阶段暂不做：
- 完整版权曲谱。
- 云端曲谱库。
- 真实伴奏音频。
- 收藏 / 下载 / 用户上传曲谱。
- 会员支付。

## 12. 完成后的下一步

曲谱库页验收并提交后，进入“歌曲详情页”。

歌曲详情页开工前新增：

```text
docs/pages/SONG_DETAIL.md
```
