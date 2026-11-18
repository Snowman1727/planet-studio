# Day 05: 示例模板库

- 计划日期：2026-11-16，Asia/Shanghai。
- 实际开发并上线：2026-11-18。Day 04 延后发布后，本项顺延；当天仅交付这一项。
- 状态：`published`。Day 06 尚未开始。
- 功能提交：`c157158a44c64bd55d62d0d8e50d9e333cb3e140`。
- Actions：<https://github.com/Snowman1727/planet-studio/actions/runs/44224558864>。
- 站点：<https://snowman1727.github.io/planet-studio/>。

## 交付内容

顶部工具栏新增示例模板入口，提供林间花园、山坡村落、沙丘驿站三份真正
可编辑的星球，分别包含 69、46、32 个物件。每份模板用固定种子与现有
球面画笔规则构图，重复打开结果一致，物件占地不重叠。列表缩略图截自
实际 WebGL 画面，而非占位图；中英文名称和说明随界面语言切换。

选择模板复用现有替换确认：未保存的当前作品可取消、先下载 JSON，再
确认替换。确认后从预览返回编辑模式；用户可继续绘制、擦除、撤销重做、
保存与导出。模板是普通 schema 2 项目，无新增存档字段或后端，旧 JSON
仍可导入。本地草稿、JSON、PNG 和独立 HTML 均使用现有路径保存完整作品。

相关文件：`prototype/studio/templates.js`、`main.js`、`i18n.js`、
`style.css`、`prototype/index.html`、`prototype/assets/templates/`、
两份 README、`tests/studio-templates.test.js` 和当日技术方案。

## 本地验证

Node.js 24 完整 `npm test`：55/55 通过；`npm run build` 成功；
`git diff --check` 通过。新增 3 项模板测试先因缺少模块而失败，随后
验证确定性、独立项目副本、各类真实物件数量、占地、上限及 JSON/HTML
往返。构建只有既有的大包体积警告。

Playwright Chromium 对本地生产构建完成 44 项检查：桌面 1440×960、
手机 390×844、窄屏 360×640、横屏 844×390；中英文、三份真实 WebGL
星球、缩略图加载、取消/先保存/确认替换、模板编辑与撤销重做、预览模式、
旧版 schema 1 JSON、模板 JSON 再导入及本地恢复。实际下载并打开 PNG，
确认 1024×1024 且有非透明星球像素；实际下载独立 HTML，阻断全部
HTTP(S) 后确认场景数据、真实 WebGL、缩放像素变化及零网络请求。

QA 脚本与截图位于 Git 忽略的 `output/playwright/`：

```text
verify-day05-templates.cjs
verify-day05-live.cjs
day05-picker-desktop.png
day05-picker-390.png
day05-picker-360.png
day05-forest-desktop.png
day05-village-desktop.png
day05-desert-desktop.png
day05-desert-export.png
day05-offline-desert.png
day05-live-picker-desktop.png
day05-live-picker-mobile.png
```

已查看三份星球画面及本地/线上手机弹窗截图，没有发现遮挡或溢出。
浏览器验收使用 Chromium，不代表 Safari/Firefox 或手机实机验证。

## 上线验收

功能提交推送 `main` 后，`Test and deploy` 的 build、deploy、verify
作业全部成功。线上 `release.json` 的 `commit` 与功能提交精确一致。
线上 Chromium 另通过 15 项检查：SHA、三个缩略图、三份星球的真实
WebGL、编辑、JSON、刷新恢复和手机弹窗；无未捕获 JS 或控制台错误。
进度与日报在功能线上验收之后作为独立记录提交。
