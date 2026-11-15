# Day 03: 镜头缩放

- 计划日期：2026-11-14，Asia/Shanghai。
- 实际开发：2026-11-14；中断后恢复并上线：2026-11-15。
- 状态：`published`。当日仅交付这一项；Day 04 尚未开始。
- 功能提交：`12571261feb267aaeb90a8258cfe7076c2a6a328`。
- Actions：<https://github.com/Snowman1727/planet-studio/actions/runs/43662007528>。
- 站点：<https://snowman1727.github.io/planet-studio/>。

## 交付内容

编辑器和独立 HTML 播放器均支持画布滚轮、双指捏合、缩小/放大按钮及
`+`、`-`、`0` 键盘快捷键。缩放范围为 65%–180%；百分比按钮可重置，
无障碍名称实时包含缩放比例。中英文标签、提示和工具说明同步更新。

镜头始终在球体外；缩放随 JSON、浏览器草稿和独立 HTML 保留。旧版
schema 1/2 存档没有 `view.zoom` 时按 100% 打开，显式异常值被拒绝。
缩放不占用物件撤销历史。滚轮接管时先保存正在旋转的视角；接管正在
绘制的笔触则取消笔触。双指捏合期间不绘制，第三指离开或第二指重新
加入后可继续捏合，单指残留不会误绘制。PNG 仍自动容纳完整星球。

相关文件：`prototype/studio/view.js`、`navigation.js`、`model.js`、
`scene.js`、`main.js`、`player.js`、`export.js`、`i18n.js`、
`style.css`、`prototype/index.html`、两份 README 以及对应单元测试。

## 本地验证

使用 Node.js 24：

```sh
npm test
npm run build
git diff --check
```

47 项单元测试全部通过，生产构建通过，diff 空白检查通过。实现前
5 项新回归测试按预期失败；旋转中滚轮接管及第三指捏合问题也先在
真实浏览器复现，再修改并复测。独立代码审查未发现关键或重要问题。

Playwright Chromium 对本地生产构建完成 97 项主流程断言、3 项
第三指/重新加入断言、1 项旋转接管回归、8 项高分屏手机与动画断言。
覆盖桌面 1440×960、手机 390×844、窄屏 360×640、横屏 844×390、
两种语言、真实 WebGL 像素变化、绘制/擦除、撤销重做、草稿恢复、
schema 1/2 迁移、JSON 往返、三种环境、PNG 还原。实际下载独立 HTML，
阻断网络后确认 WebGL、缩放、旋转及手机视口仍可用；无未捕获 JS 异常。

QA 脚本及图片在 Git 忽略的 `output/playwright/` 中：

```text
verify-day03-zoom.cjs
verify-day03-touch-rejoin.cjs
verify-day03-rotation.cjs
verify-day03-mobile-motion.cjs
verify-day03-live.cjs
day03-en-390.png
day03-zh-CN-1440.png
day03-offline-mobile.png
day03-mobile-retina-preview.png
day03-live-mobile-zh.png
```

已查看本地手机、独立播放器和线上手机截图；没有发现控件遮挡或文本溢出。
浏览器验证为 Chromium，包含 CDP 触控事件，不代表物理 iOS/Android
设备或 Safari/Firefox 的实机验证。

## 上线验收

功能提交正常推送 main 后，`Test and deploy` 的 build、deploy、verify
作业全部成功。线上 `release.json` 返回：

```json
{"commit":"12571261feb267aaeb90a8258cfe7076c2a6a328","builtAt":"2026-11-15T01:13:05.224Z"}
```

线上 Chromium 另通过 10 项断言：SHA 精确匹配、桌面和手机真实 WebGL
画面、放大后像素轮廓变化、刷新后恢复缩放、中文与英文的可访问比例、
键盘重置，以及没有未捕获 JavaScript 错误。本文及进度记录随后由
`6d9db3555ed821417d3176a2ae2f1e32123c5a38` 提交；其
<https://github.com/Snowman1727/planet-studio/actions/runs/43668626787>
同样成功，线上发布标记精确匹配该文档提交。
