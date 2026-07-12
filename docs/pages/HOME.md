# 首页开发文档

版本：v0.1
日期：2026-07-12
页面：Home / 首页
阶段：先完成 Preview，再同步 App

## 1. 页面目标

首页要从旧版“课程进度页”调整为新 App 的主入口。

用户打开 App 后，应在一个屏幕内看到：

- App 名称：AI 尤克里里弹唱。
- 最近连续练习状态。
- 四个主要入口：调音器、和弦、曲谱库、练习。
- 今日推荐或热门弹唱。
- 底部五 Tab：首页、练琴、曲谱、学习、我的。

首页不承载完整练习流程，只负责告诉用户“今天可以从哪里开始”。

## 2. 用户场景

### 2.1 新用户第一次打开

用户目标：

- 知道这是尤克里里弹唱练习 App。
- 能快速进入调音器或练习。
- 不被复杂数据吓到。

页面响应：

- 展示清晰 App 名称。
- 四个入口突出。
- 今日推荐给出入门练习。

### 2.2 老用户继续练习

用户目标：

- 看见连续打卡和最近练习。
- 直接进入上次相关练习。
- 看到热门或推荐歌曲。

页面响应：

- 打卡区域显示连续状态。
- 今日推荐可使用最近记录生成。
- 热门弹唱展示 2-3 条。

## 3. 页面结构

首屏从上到下：

```text
顶部区域
  App 名称
  今日状态/连续天数

打卡区域
  紧凑 contribution grid
  连续天数、累计分钟

四个主入口
  调音器
  和弦
  曲谱库
  练习

今日推荐 / 热门弹唱
  推荐卡或歌曲列表

底部 Tab
  首页 | 练琴 | 曲谱 | 学习 | 我的
```

布局要求：

- 375px 宽度下核心内容尽量一屏可见。
- 热门弹唱只展示 2-3 条，更多进入曲谱页。
- 文案短，不堆说明。

## 4. 模块规格

### 4.1 顶部区域

内容：

- 标题：AI 尤克里里弹唱。
- 副标题：今日练习 / 新手弹唱入门 / 继续练习。
- 右侧状态：连续 N 天或本地练习。

验收：

- 标题是首屏最明确的品牌信号。
- 不再显示旧项目名或旧课程标题作为首页主标题。

### 4.2 打卡区域

内容：

- 7 天或 14 天紧凑格子。
- 不同深浅表示练习分钟数。
- 显示连续天数和本周分钟。

数据：

```ts
type HomeCheckInSummary = {
  streakDays: number;
  weekMinutes: number;
  days: Array<{
    date: string;
    minutes: number;
    completed: boolean;
  }>;
};
```

验收：

- 打卡区域紧凑，不占据过多高度。
- 空数据也能显示默认状态。

### 4.3 四个主入口

入口：

| 标题 | 说明 | 目标 |
| --- | --- | --- |
| 调音器 | 开始前先校准 GCEA | 练琴 / 调音器 |
| 和弦 | 查看指法和试听 | 练琴 / 和弦库 |
| 曲谱库 | 找一首歌练 | 曲谱 |
| 练习 | 节奏与和弦转换 | 练琴 |

数据：

```ts
type HomeModule = {
  id: "tuner" | "chords" | "songs" | "practice";
  title: string;
  subtitle: string;
  targetTab: "practice" | "songs";
  targetRoute?: string;
};
```

交互：

- 点击调音器：进入练琴页并定位调音器，Preview 阶段可切到练琴 Tab 或显示调音器占位。
- 点击和弦：进入和弦库。
- 点击曲谱库：进入曲谱 Tab。
- 点击练习：进入练琴 Tab。

验收：

- 四个入口视觉权重一致。
- 每个入口都能点击。
- 不出现只有文字没有反馈的入口。

### 4.4 今日推荐

内容：

- 一张主推荐卡。
- 推荐标题。
- 推荐说明。
- 推荐参数：BPM、模式、目标、预计时间。
- 主按钮：按建议开始。

建议默认：

- 标题：稳定 C。
- 说明：用 60 BPM 只练 C，先把按指和完成时机练稳。
- 参数：BPM 60、模式单练、目标 C、预计 8 分钟。

验收：

- 推荐内容短而具体。
- 按钮醒目，但不遮挡底部 Tab。

### 4.5 热门弹唱

内容：

- 2-3 条歌曲或练习型片段。
- 每条展示标题、难度、BPM、和弦。
- 点击进入曲谱详情，Preview 阶段可切到曲谱 Tab。

版权要求：

- 不展示受版权保护歌词。
- 可以使用原创练习标题或无版权内容。

验收：

- 用户能理解这里是“找歌练”的入口。
- 内容不挤压四个主入口。

### 4.6 底部 Tab

Tab：

- 首页。
- 练琴。
- 曲谱。
- 学习。
- 我的。

验收：

- 当前首页高亮。
- 点击其他 Tab 后页面有对应占位或目标页面。
- 底部 Tab 不遮挡首页主按钮。

## 5. 数据来源

Preview 阶段：

- 可在 `preview.html` 内使用常量。
- 常量命名要接近后续 shared 数据模型。

App 同步阶段：

- 首页模块、推荐、热门歌曲应迁移到 `packages/shared`。
- App 只负责渲染和导航。

建议数据对象：

```ts
type HomeContent = {
  checkIn: HomeCheckInSummary;
  modules: HomeModule[];
  recommendation: HomeRecommendation;
  popularSongs: HomeSongCard[];
};

type HomeRecommendation = {
  title: string;
  description: string;
  bpm: number;
  mode: string;
  target: string;
  estimatedMinutes: number;
};

type HomeSongCard = {
  id: string;
  title: string;
  difficulty: string;
  bpm: number;
  chordIds: string[];
  estimatedMinutes: number;
};
```

## 6. 视觉要求

整体：

- 明亮、清爽、手机 App 感。
- 避免旧版课程卡堆叠感。
- 信息密度适中，首屏能扫完。

颜色：

- 主色可使用蓝/青绿。
- 开始按钮用橙/黄强调。
- 打卡深浅使用同色系分级。

组件：

- 主入口可以使用 2x2 网格。
- 卡片不要过高。
- 热门弹唱使用紧凑列表。

## 7. Preview 实现要求

文件：

- `apps/mobile/dist-web/preview.html`

必须完成：

- 首页新结构。
- 底部五 Tab。
- 首页四个入口可点击。
- 点击曲谱库进入曲谱 Tab 占位。
- 点击练习进入练琴 Tab 占位。
- 点击调音器、和弦时至少能进入练琴页对应占位或显示目标模块。

不要求本阶段完成：

- 调音器真实逻辑重写。
- 曲谱详情。
- 练习页完整实现。
- 登录和云端数据。

## 8. App 同步要求

文件：

- `apps/mobile/App.tsx`
- 必要时更新 `packages/shared`

必须完成：

- 首页视觉结构与 Preview 一致。
- 五 Tab 命名与 Preview 一致。
- 首页模块点击行为一致。

如果本阶段只完成 Preview：

- 必须在提交说明中明确 App 同步未做。
- 下一步必须安排 App 同步，不进入下一个页面。

## 9. 验收标准

首页完成必须满足：

- 首屏显示 `AI 尤克里里弹唱`。
- 有连续打卡区域。
- 有调音器、和弦、曲谱库、练习四个主入口。
- 有今日推荐或热门弹唱。
- 底部是：首页、练琴、曲谱、学习、我的。
- 当前首页高亮。
- 主要内容在 375px 宽度下不明显溢出。
- 点击主入口有反馈或跳转。
- 不展示旧版“AI 尤克里里学园 MVP 互动预览”作为主标题。

## 10. 测试清单

自动验证：

```powershell
npm.cmd test
npx.cmd tsc -p apps/mobile --noEmit
node -e "const fs=require('fs'); const html=fs.readFileSync('apps/mobile/dist-web/preview.html','utf8'); const re=new RegExp('<script>([\\s\\S]*?)</script>','g'); const scripts=[...html.matchAll(re)]; new Function(scripts[scripts.length-1][1]); console.log('preview script syntax ok')"
Invoke-WebRequest -Uri http://localhost:8082/preview.html -UseBasicParsing -TimeoutSec 5
```

人工验证：

- 打开 `http://localhost:8082/preview.html`。
- 确认首页标题正确。
- 确认四个主入口可见。
- 点击“曲谱库”，确认进入曲谱相关页面或占位。
- 点击“练习”，确认进入练琴相关页面或占位。
- 切换底部五个 Tab，确认高亮变化。
- 手机宽度下检查底部 Tab 没有遮挡主按钮。

## 11. 暂不做

首页阶段暂不做：

- 真实登录。
- 云端打卡同步。
- 热门歌曲远程接口。
- 曲谱详情。
- 完整练习评分。
- 调音器真实逻辑重构。

这些功能进入对应页面阶段处理。

## 12. 首页完成后的下一步

首页验收并提交后，进入“练琴入口页”。

练琴入口页开工前需要新增：

- `docs/pages/PRACTICE_HUB.md`

该页面文档完成后，再进入练琴入口页开发。
