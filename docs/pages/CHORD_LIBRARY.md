# 和弦库页开发文档

版本：v0.2
日期：2026-07-14
页面：Chord Library / 和弦大全
状态：Preview 与 Expo App 已同步

## 1. 页面目标

和弦库页负责让新手快速查找、看懂、练习尤克里里和弦。

本页必须以“指法图”为核心展示，而不是只显示 C、G、Am、F 这样的英文代码。所有与和弦相关的入口，包括歌曲卡、和弦转换、跟练目标，都应逐步复用同一套指法图组件。

## 2. 当前能力

- 支持搜索和弦名。
- 支持分类查看。
- 网格卡片直接展示指法图、和弦名、指法数字。
- 收藏区默认展示第一首歌会用到的 C / Am / F / G7。
- App 端已改为更紧凑的 3 列扫读布局。

## 3. 分类规则

| 分类 | 说明 |
| --- | --- |
| 所有 | 当前共享和弦库全部和弦 |
| 入门 | C / Am / F / G7 |
| 大三 | major 标签 |
| 小三 | minor 标签 |
| 属七 | seventh 标签 |
| 升降 | sharp / flat 标签 |
| 横按 | barre 标签 |

每个分类按钮显示当前分类数量和简短说明。

## 4. 和弦卡片要求

每张卡片必须包含：

- 指法图。
- 和弦名。
- 指法数字，如 `0-0-0-3`。

指法图要求：

- 顶部显示空弦 / 按弦 / 不弹标记。
- 指板内显示圆点。
- 圆点内显示手指编号。
- 底部显示 G / C / E / A。

关键验收：

- C：`0-0-0-3`
- Am：`2-0-0-0`
- F：`2-0-1-0`
- G7：`0-2-1-2`

## 5. App 同步结果

文件：`apps/mobile/App.tsx`

已完成：

- `ChordScreen` 使用搜索 + 分类 + 网格 + 收藏结构。
- 分类横向滚动，避免顶部过高。
- 主网格使用紧凑 3 列卡片。
- 收藏区固定展示 C / Am / F / G7。
- 所有卡片仍展示指法图，不退化为纯英文代码。

暂不做：

- 真实音频试听。
- 收藏持久化。
- 和弦详情 sheet。

## 6. 自动验证

```powershell
npm.cmd test
npx.cmd tsc -p apps/mobile --noEmit
node -e "const fs=require('fs'); const html=fs.readFileSync('apps/mobile/dist-web/preview.html','utf8'); const re=new RegExp('<script>([\\s\\S]*?)</script>','g'); const scripts=[...html.matchAll(re)]; new Function(scripts[scripts.length-1][1]); console.log('preview script syntax ok')"
git diff --check
Invoke-WebRequest -Uri http://localhost:8082/preview.html -UseBasicParsing -TimeoutSec 5
```

## 7. 人工测试清单

- 打开 App 或 Preview。
- 进入“和弦大全”。
- 确认顶部有搜索和分类。
- 切换“大三 / 小三 / 属七 / 横按”。
- 搜索 `Am`，确认只出现匹配和弦。
- 检查 C / Am / F / G7 的指法图和指法数字。

## 8. 下一步

和弦库页验收并提交后，继续：

- 调音器 Native AudioEngine 技术预研。
- 继续把 Preview 内仍未共享的展示常量沉淀到 `packages/shared`。
