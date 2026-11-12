# Day 01: 界面中英文切换

- 计划日期、实际开发与上线日期：2026-11-12，Asia/Shanghai。
- 状态：`published`。
- 功能提交：`b103dd27a7915bfb35ea2b298ffca244e3f2713d`。
- Actions：<https://github.com/Snowman1727/planet-studio/actions/runs/43134940442>。
- 站点：<https://snowman1727.github.io/planet-studio/>。

## 本日交付

编辑器顶部可切换简体中文与英文，包含工具、环境、提示、弹窗、图标提示、
文档语言、标题和无障碍名称。已显示的错误和状态也会即时翻译。语言偏好在
本地单独保存，刷新后恢复；浏览器禁止存储时仍能切换并下载 JSON。

独立 HTML 的文档语言、播放控件、画布名称、错误信息，以及 iframe 标题
跟随导出时的界面语言。用户填写的作品名称不翻译，JSON 仍为 schema 2，
不增加语言字段。旧 schema 1 草稿继续迁移，精确物件数据保持不变。
切换不改变作品、视角或历史，打开的导出窗口保留用户输入的文件路径。

修改涉及 `prototype/index.html`、`prototype/studio/` 下的主控制器、样式、
导出和播放器；新增共享 `i18n.js`，为模型与渲染错误添加可翻译的错误代码。
两份 README 同步更新实际能力，无新增依赖，没有修改博客仓库。

## 测试与审查

使用 Node.js 24：

```sh
npm test
npm run build
git diff --check
```

- 单元测试：39 项通过，0 失败，包含新增的 9 项翻译、偏好和导出检查。
- RED：先观察英文导出行为测试失败；集成前浏览器检查明确失败为缺少语言选择器。
- 生产构建成功；保留既有的大体积资源警告。
- `git diff --check` 通过。
- 独立最终代码审查未发现需要修复的问题，并单独重跑了全部 39 项测试。
- 本地生产浏览器验收：76 项断言通过，无 JavaScript 异常。
- 线上浏览器验收：11 项断言通过，无 JavaScript 异常。

## 浏览器证据

本地生产构建通过 `npm run preview -- --port 5180` 验收。
使用独立 Playwright 会话运行以下本地 QA 脚本；它们和产物被 Git 忽略：

```text
output/playwright/verify-day01-language.cjs
output/playwright/day01-browser-verification.log
output/playwright/verify-day01-live.cjs
output/playwright/day01-live-verification.log
```

验证内容：

- 中英文完整文案、标题、aria 名称和图标 title，没有遗漏静态中文。
- 实际绘制、切换前后的撤销重做、动态环境提示、预览与暂停状态。
- 自定义名称、草稿原始字节、刷新恢复、旧版本草稿迁移及精确存档往返。
- 错误 JSON、超过 2 MB 文件、存储被拒绝及 WebGL 上下文丢失的本地化。
- 导出弹窗切换时路径保留，中英文 iframe 标题与 HTML 文档语言。
- 1440x960、390x844、360x640、844x390，两种语言都无横向溢出，
  控件文字能放入容器，并通过 WebGL `readPixels` 确认真实非空画面。
- 实际下载两种语言的 HTML，以本地文件打开，阻断所有 HTTP(S)，确认
  零外部请求、精确物件、许可证、真实画面、键盘旋转、暂停和错误提示。

截图证据：

```text
output/playwright/day01-en-{1440,390,360,844}.png
output/playwright/day01-zh-CN-{1440,390,360,844}.png
output/playwright/day01-offline-en.png
output/playwright/day01-offline-zh-CN.png
output/playwright/day01-live-1440.png
output/playwright/day01-live-390.png
```

已人工检查桌面、窄屏、横屏、中文手机、离线播放器和线上手机截图，
星球主体与控件正常显示，无不合理重叠。桌面英文环境选择使用纵排，
避免较长名称拥挤；手机导出按钮使用带本地化名称和提示的下载图标。

## 发布验收

正常推送 `main` 后，`Test and deploy` 工作流成功。真实线上浏览器读取：

```json
{
  "commit": "b103dd27a7915bfb35ea2b298ffca244e3f2713d",
  "builtAt": "2026-11-12T01:30:29.573Z"
}
```

同一线上会话检查了语言切换、刷新记忆、实际绘制、桌面和手机 WebGL 像素。
这项功能在上述线上验收完成后才标记为 `published`。

本文及进度更新的后续文档提交也走相同部署门禁；最终执行阶段另行核对
该提交的 Actions 与线上标记，届时标记应为文档提交，而不是这里记录的功能提交。

Day 02（2026-11-13，PNG 图片导出）保持 `pending`，本日没有提前实现。
