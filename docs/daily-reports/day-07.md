# Day 07: 按类型擦除

- 计划日期：2026-11-18，Asia/Shanghai。
- 实际开发并上线：2026-11-20。按最早未完成项顺延，当天仅交付本功能。
- 状态：`published`。Day 08 和 Day 09 未开始。
- 功能提交：`7639196eba79c3eeb255aa28c9643ee3c47fb29d`。
- Actions：<https://github.com/Snowman1727/planet-studio/actions/runs/44652646971>。
- 站点：<https://snowman1727.github.io/planet-studio/>。

## 交付内容

橡皮新增「擦除对象」原生下拉框：默认全部物件，也可仅擦除松林、木屋、
阔叶树、花丛、岩石或蘑菇。筛选只影响球面笔触范围内的指定类型，
其他类型、范围外物件的位置、大小、朝向和顺序均保持原样。
选择橡皮时筛选替代无用的密度控件，绘制时恢复密度；支持中英文、
可访问名称、键盘选择、鼠标拖动、Enter 盖章及触屏操作。

每一整笔仍只有一步历史；撤销、重做恢复精确物件数据，空区域或没有目标
类型的笔触不会占用历史或清空重做。切换目标、工具、Escape、指针取消、
丢失指针捕获或窗口失焦都会取消尚未完成的整笔操作。
非法类型在开始新笔画前拒绝，不改动已有合法笔画。

筛选是临时编辑器设置，刷新恢复默认全部，不写入作品。
不改变 schema 2、草稿和作品库格式，无需迁移新字段。
schema 1、JSON 往返、视角收藏、缩放与独立离线 HTML 均保留既有行为。
渲染失败时禁用筛选，仍可保存 JSON。
本功能不包含 Day 08 单个物件编辑或 Day 09 物件锁定。

改动文件：`prototype/studio/model.js`、`main.js`、`i18n.js`、
`style.css`、`prototype/index.html`、两份 README、
`tests/studio-erase.test.js` 及当日技术方案。博客仓库未修改。

## 本地验证

使用 Node.js 24：

```sh
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm test
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run build
git diff --check
```

完整单元测试 **83/83** 通过；构建成功，只有既有的大包体积警告；
diff 检查通过。新增 13 项测试覆盖六种筛选、默认全部、半径外保护、
整笔历史与取消、空匹配保留重做、非法参数、采样频率、离球间断、
擦除后重新绘制的空间索引。先观察到 11 项预期失败，再实现通过；
另外 2 项原有行为兼容检查在改动前已通过。
新增界面控件测试先观察缺少可访问选择器的失败，再通过 4 项检查。

真实 Chromium 生产构建验收 **128 项**全部通过：

- 六种物件混合场景逐类拖动擦除，逐个精确比较其他物件数据。
- 整笔撤销重做、无匹配笔触、Enter、触屏、键盘原生选择器；
  筛选/工具切换、Escape、pointercancel、lostpointercapture、blur 取消。
- 中英文，1440×960、390×844、360×640、844×390；
  控件可滚动到达且无水平溢出，绘制密度恢复可用。
- 草稿刷新、作品库保存、实际下载 JSON 并重新导入；
  schema 1 导入后迁移并仅擦除木屋，不影响松林。
- 实际下载独立 HTML，阻断 HTTP(S) 后从本地文件打开，
  校验精确物件、真实 WebGL 像素及缩放后画面变化，零网络请求。
- 渲染失败后禁用筛选，实际 JSON 备份仍可下载。
- 没有未捕获 JavaScript、控制台错误或警告。

已人工查看桌面、中英文手机、360 窄屏及横屏截图，无控件遮挡。
验收仅代表 Chromium，不代表 Safari、Firefox 或手机实机验证。

验收脚本中途修正了宽泛 data-mode 选择器同时匹配按钮与舞台、
异步导入需等待处理完毕、刷新后范围重置需重新设置三处测试问题；
macOS 原生下拉选择改用已验证的键盘文字匹配 `p` 加 Enter。
这些均不需要修改生产逻辑，最终完整脚本通过。

## 审查与决策

独立只读审查检查完整改动，并用 Node.js 24 独立运行 83 项测试。
无 Critical、Important、Minor 问题，没有搁置未判断的行为。

沿用已批准的原目录 main 发布流程，不额外建立工作树或重复询问范围；
代价是通过发布前 fetch 和正常推送保护并发变更。筛选采用每笔固定的
临时参数和原生选择器，避免作品格式变化；代价是刷新后需要重新选择目标。
无遗留本功能审查问题；Day 06 英文单数文案不在本次范围内。

## 上线证据

功能已正常推送，Actions 的 build、deploy、verify 全部成功。
线上 `release.json.commit` 精确等于
`7639196eba79c3eeb255aa28c9643ee3c47fb29d`，
标记的 `builtAt` 为 `2026-11-20T01:18:44.824Z`。

独立线上浏览器完成 **20 项**检查：精确版本、真实混合森林模板、
英文可访问筛选及七种选项、鼠标只擦除松林、其他类型精确保持、
整笔撤销重做、Enter 筛选、实际下载 JSON、刷新恢复、
中文手机筛选及触屏只擦除花丛、无横向溢出、真实 WebGL 像素。
没有 JavaScript 或控制台错误、警告。已查看线上桌面和手机截图。

本进度和报告在功能线上验收后单独提交，仅记录上述功能提交；
记录提交的 Actions 和最新线上版本由执行者在提交后继续核验。

发布时 SSH 连接中断，改用临时 HTTPS 凭据助手和 HTTP/1.1 后成功推送，
没有更改仓库 remote、Git 配置或提交历史，没有暴露凭据。

## QA 产物

均位于被 Git 忽略的 `output/playwright/`，不提交公开：

```text
verify-day07-control.cjs
verify-day07-erase.cjs
verify-day07-live.cjs
day07-unit-result.log
day07-build-result.log
day07-browser-result.log
day07-live-result.log
day07-erase-{en,zh-CN}-{1440,390,360,844}.png
day07-live-desktop.png
day07-live-mobile.png
day07-project.planet.json
day07-live.planet.json
day07-render-failure.planet.json
day07-offline.html
day07-offline.png
```

本次开发服务器、生产预览和隔离浏览器会话均在验收后关闭。
