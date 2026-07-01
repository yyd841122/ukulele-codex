# AI Ukulele Academy

基于 `PRD.md`、`TDD.md`、`SDD.md` 的最小 MVP。

## 当前范围

- `packages/audio-core`：音名/频率转换、MPM/YIN 基线拾音、调音匹配、练习评分。
- `packages/shared`：尤克里里标准调弦、基础和弦、课程模板、练习模板。
- `apps/mobile`：Expo/React Native 移动端 MVP 界面骨架。

## 快速验证

核心算法和共享数据不依赖安装第三方包即可测试：

```bash
npm test
```

移动端需要安装依赖后运行：

```bash
npm install
npm run start:mobile
```

低延迟拾音后续会迁移到自定义 Native Module/JSI/TurboModule；当前移动端先使用模拟输入打通调音器、节拍器、和弦库和跟练页面。

## 预览方式

如果内置浏览器打不开 `localhost` 或 `127.0.0.1`，优先使用离线预览：

```text
file:///E:/codex-projects/ukulele/MVP_PREVIEW.html
```

当前最稳的内置浏览器预览地址是：

```text
http://[::1]:8083/preview.html
```

如果需要看 Expo Web 静态导出：

```text
file:///E:/codex-projects/ukulele/apps/mobile/dist-web/file-preview.html
```

如果使用本地 HTTP 服务，内置浏览器不要用 `127.0.0.1`，改用当前主机局域网地址，例如：

```text
http://192.168.1.11:8082
```
