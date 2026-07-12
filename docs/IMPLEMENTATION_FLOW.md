# 页面开发执行流程

版本：v0.1
日期：2026-07-12
适用范围：AI 尤克里里弹唱重设计后的页面级开发

## 1. 工作节奏

后续开发统一采用：

```text
文档 -> 开发 -> 验证 -> 提交 -> 下一页
```

每个页面必须先完成页面专项文档，再进入代码实现。页面完成并通过验收后，才进入下一个页面。

## 2. 页面推进顺序

当前按以下顺序执行：

1. 首页。
2. 练琴入口页。
3. 调音器页。
4. 节拍器页。
5. 和弦库页。
6. 节奏练习页。
7. 和弦转换页。
8. 曲谱库页。
9. 歌曲详情页。
10. 单音跟弹页。
11. 和弦跟弹页。
12. 学习页。
13. 我的页。

顺序原则：

- 先做信息架构和入口页。
- 再做高频工具。
- 再做专项练习。
- 最后做歌曲跟弹、学习和个人数据页。

## 3. 每页开工前必须产出

每个页面必须有一份 `docs/pages/<PAGE>.md`。

页面文档必须包含：

- 页面目标。
- 用户场景。
- 页面结构。
- 数据来源。
- 交互流程。
- Preview 实现要求。
- App 同步要求。
- 验收标准。
- 测试清单。
- 暂不做内容。

没有页面文档，不开始对应页面代码开发。

## 4. 开发规则

### 4.1 Preview 优先

新页面先在 `apps/mobile/dist-web/preview.html` 中完成可交互预览。

原因：

- 用户当前主要通过 `http://localhost:8082/preview.html` 验证。
- Preview 刷新快，适合先确认页面方向。
- 新信息架构需要先把体验跑通，再同步到 Expo App。

Preview 要求：

- 保持自包含。
- 不依赖 React bundle。
- 能通过本地静态服务直接打开。
- 和 App 页面保持同样的数据含义和交互流程。

### 4.2 App 同步

Preview 页面验收后，再同步到 `apps/mobile/App.tsx` 和相关模块。

同步要求：

- 页面模块命名尽量一致。
- 数据字段尽量一致。
- 和弦、节奏、歌曲等内容优先迁移到 `packages/shared`。
- 不在 App 中重新硬编码另一套业务逻辑。

### 4.3 共享内容优先

以下内容应逐步沉淀到 `packages/shared`：

- 首页模块配置。
- 和弦库。
- 节奏型。
- 和弦转换练习。
- 歌曲目录。
- 学习文章。
- 练习模板。

如果当前页面只是 Preview 验证，可先使用页面内常量；进入 App 同步时必须评估是否抽到 shared。

## 5. 验证规则

每页至少完成以下验证：

```powershell
npm.cmd test
npx.cmd tsc -p apps/mobile --noEmit
node -e "const fs=require('fs'); const html=fs.readFileSync('apps/mobile/dist-web/preview.html','utf8'); const re=new RegExp('<script>([\\s\\S]*?)</script>','g'); const scripts=[...html.matchAll(re)]; new Function(scripts[scripts.length-1][1]); console.log('preview script syntax ok')"
Invoke-WebRequest -Uri http://localhost:8082/preview.html -UseBasicParsing -TimeoutSec 5
```

如果某页只改文档，可只跑：

```powershell
git diff --check
```

浏览器人工验证：

- 页面能打开。
- 底部 Tab 可点击。
- 当前页面核心内容首屏可见。
- 主操作可用。
- 文案和组件不遮挡。
- 375px 与 430px 宽度下不明显溢出。

## 6. 提交规则

每个页面完成后单独提交。

提交粒度：

- 文档提交：只包含页面文档。
- Preview 提交：只包含 Preview 和必要静态资源。
- App 同步提交：只包含 App 与 shared 同步。

提交信息建议：

```text
docs: add home implementation plan
feat: redesign preview home page
feat: sync home page to app
```

每次提交前：

- 查看 `git status --short`。
- 确认没有无关文件。
- 不回滚用户未要求回滚的内容。

## 7. 多 Agent 协作规则

当前页面未验收前，不并行开发下一个页面的代码。

允许并行的场景：

- 多个 Agent 分别写后续页面文档。
- 一个 Agent 做页面 UI，另一个 Agent 做 shared 数据模型，但必须由主 Agent 统一合并。
- 一个 Agent 做 Preview，另一个 Agent 做测试清单或视觉验收记录。

不允许并行的场景：

- 多个 Agent 同时改同一个 HTML 或 App 文件。
- 当前页面未定稿时，其他 Agent 抢先开发后续页面。
- 没有统一数据模型时，各自硬编码不同内容结构。

多 Agent 输出必须包含：

- 修改文件列表。
- 验证命令和结果。
- 是否需要人工测试。
- 是否影响当前页面范围外功能。

## 8. 页面完成定义

一个页面只有同时满足以下条件，才算完成：

- 页面专项文档已存在。
- Preview 已完成并验证。
- App 已同步，或文档明确说明本阶段只做 Preview。
- 自动验证通过。
- 用户需要人工测试的项目已明确列出。
- 代码已提交并推送。

## 9. 当前阶段策略

当前阶段从首页开始。

首页完成前，只允许处理：

- 首页文档。
- 首页 Preview。
- 首页 App 同步。
- 首页需要的共享数据。
- 首页相关验证与提交。

不处理：

- 调音器细节重写。
- 节奏练习评分重写。
- 歌曲跟弹实现。
- 我的页统计扩展。

这些内容进入对应页面阶段再处理。
