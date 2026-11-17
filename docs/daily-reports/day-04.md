# Day 04: 视角收藏

- 计划日期：2026-11-15，Asia/Shanghai。
- 实际开发：2026-11-16；中断后恢复并上线：2026-11-17。
- 状态：`published`。当日仅交付这一项；Day 05 尚未开始。
- 功能提交：`600eae0fe40ce55cd1040df53c620bc090fb7793`。
- Actions：<https://github.com/Snowman1727/planet-studio/actions/runs/43992526795>。
- 站点：<https://snowman1727.github.io/planet-studio/>。

## 交付内容

每个项目最多收藏 8 个具名视角，包含球体朝向和镜头缩放。编辑器可命名、
跳转和删除；独立 HTML 播放器可选择收藏的视角，跳转后暂停旋转，并允许
再次选择同一视角。操作不占用物件笔画的撤销/重做历史。

`bookmarks` 是 schema 2 的可选字段；旧版 schema 1/2 存档缺少该字段时
迁移为空列表。显式无效名称、重复名称、镜头数据和超过 8 项的列表会被拒绝。
JSON、本地草稿和独立 HTML 保留收藏；HTML 中的名称经过安全转义。
PNG 仍捕捉当前镜头，收藏操作不改变画面或物件。

相关文件：`prototype/studio/model.js`、`main.js`、`player.js`、
`export.js`、`i18n.js`、`style.css`、`prototype/index.html`、
两份 README、`tests/studio-bookmarks.test.js` 和当日技术方案。

## 本地验证

使用 Node.js 24 运行 `npm test`、`npm run build` 和 `git diff --check`：
52/52 单元测试通过，生产构建成功，diff 空白检查通过。构建存在既有的
大包体积警告。新增 5 项模型/导出回归在实现前按预期失败，之后通过。

Playwright Chromium 对本地生产构建完成 61 项主流程断言、12 项真实画笔
与撤销/预览断言、4 项 WebGL 上下文丢失断言，并对同一收藏视角的再次
选择做了先失败后通过的回归验证。覆盖桌面 1440×960、手机 390×844、
窄屏 360×640、横屏 844×390、中英文、真实 WebGL 像素、JSON 下载与
导入、旧版 schema 1/2 迁移和本地恢复。实际下载独立 HTML 后，在阻断
全部 HTTP(S) 请求的情况下验证画面、视角菜单、缩放和手机布局。

QA 脚本和截图位于 Git 忽略的 `output/playwright/`：

```text
verify-day04-bookmarks.cjs
verify-day04-history-preview.cjs
verify-day04-context.cjs
verify-day04-live.cjs
day04-dialog-zh-CN-390.png
day04-dialog-zh-CN-360.png
day04-dialog-en-844.png
day04-offline-mobile.png
day04-live-desktop.png
day04-live-mobile.png
```

已查看本地和线上手机截图；视角弹窗没有超出视口或遮挡自身控件。
浏览器验收使用 Chromium，不代表物理 iOS/Android 或 Safari/Firefox 实机验证。

## 上线验收

功能提交推送 `main` 后，`Test and deploy` 的 build、deploy、verify
作业全部成功。线上 `release.json` 的 `commit` 精确等于上述功能提交。
线上 Chromium 另通过 10 项断言：SHA 匹配、桌面和手机真实 WebGL、
视角保存与跳转、JSON 下载、刷新恢复和手机弹窗布局；没有未捕获的 JS
或控制台错误。进度与报告在功能线上验收后提交，作为独立的记录提交。
