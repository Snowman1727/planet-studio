# Day 08: 单个物件编辑

- 计划日期：2026-11-19，Asia/Shanghai。
- 实际开发并上线：2026-11-23。按最早未完成项顺延，本次仅交付本功能。
- 状态：`published`。Day 09 及以后保持待开发。
- 功能提交：`eadbe8198b890ebca8832cd9d3302f08c5c8727b`。
- Actions：<https://github.com/Snowman1727/planet-studio/actions/runs/45099872103>。
- 站点：<https://snowman1727.github.io/planet-studio/>。

## 交付内容

新增「选择」工具，点击可选中实际可见的单个物件并显示球面选中轮廓。
支持松林、木屋、阔叶树、花丛、岩石和蘑菇；选取考虑地形遮挡，
不会选中星球背面的物件。拖动可沿球面移动，始终保持贴地，
不会从树冠点击位置突然跳回地面。4px 拖动阈值区分点击与移动。
离开球面或遇到其他物件占用区域时保留最后安全位置。

侧栏提供纬度、经度、朝向和大小输入，点击应用或 Enter 一次提交；
可单独删除物件。大小沿用 75%–120% 范围。每次完整拖动、应用或删除
只占一步历史，撤销重做精确恢复；无修改操作保留原始精度和重做。
Escape、指针取消、丢失捕获、窗口失焦、切换工具或预览、
滚轮导航及双指手势会取消尚未完成的整次拖动。
支持键盘画布中心选取、Delete/Backspace 删除以及真实触屏操作。

选中状态属于临时编辑器状态，不写入作品；JSON、草稿、作品库和独立
HTML 保留最终位置、朝向、大小。PNG 和预览不显示编辑轮廓。
作品格式保持 schema 2，兼容 schema 1，无需新增存储字段。
继续保留 2,000 物件、40 步历史及 2 MB JSON 上限。
中英文及手机窄屏均可使用，渲染失败仍可下载 JSON 备份。

改动涉及 `model.js`、`object-edit.js`、`object-inspector.js`、
`scene.js`、`main.js`、`i18n.js`、`style.css`、`prototype/index.html`、
两份 README、两份新增测试及当日技术方案。博客仓库未修改。
本次不包含 Day 09 物件锁定或 Day 10 物件列表。

## 本地验证

使用 Node.js 24：

```sh
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm test
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run build
git diff --check
```

完整单元测试 **102/102** 通过；构建成功，仅有既有的大包体积警告；
diff 检查通过。新增 15 项物件编辑测试和 4 项球面坐标测试，
先观察缺少接口或辅助函数的预期失败，再实现通过。
界面控件验收先观察缺少 Select 工具的失败，再通过 6 项检查。

真实 Chromium 生产构建验收 **306 项**通过：
6 项控件、152 项集成、20 项手势/边界/可达性及 128 项 Day 07 回归。

- 六类物件、雪地与非雪地实例映射、真实几何命中和地形遮挡。
- 移动、朝向、大小、删除、精确撤销重做、无操作与重做保留。
- 鼠标及 CDP 真实触屏拖动、双指取消、剩余手指抑制；
  Escape、pointercancel、lostpointercapture、blur、切换及导航取消。
- 数字输入和拖动的碰撞保护、离球处理、4px 阈值、2,000 物件上限。
- 中英文，1440×960、390×844、360×640、844×390；
  每个输入、应用及删除按钮均可滚动到达并通过实际命中检查。
- 实际下载 JSON 并重新导入、schema 1、刷新恢复和本地作品库。
- 实际下载 HTML，从 `file://` 打开并阻断 HTTP(S)，
  验证精确变换、真实 WebGL 像素、缩放及零网络请求。
- 实际下载并解码 1024 PNG；有无选中状态导出文件 SHA 相同，
  同时确认轮廓确实改变编辑画布像素，避免无效对比。
- 渲染失败时禁用物件编辑，实际下载 JSON 备份仍可用。
- 最终验收脚本没有未捕获 JavaScript 或控制台错误、警告。

已查看桌面、中英文手机、窄屏、横屏和离线截图。
验收仅代表 Chromium，不代表 Safari、Firefox 或手机实机验证。

验收脚本修正了三处测试假设：花丛中心是枝叶间的空隙，改点实际花瓣；
双指使用真实 CDP 接触点而非未注册的合成指针；
补充数据比较逐字段而非依赖 JSON 属性顺序。这些不是生产逻辑修复。

## 审查与决策

独立只读审查检查全部改动、相邻导航和渲染逻辑、验收脚本及代表截图，
并独立运行 102/102 单元测试和 whitespace 检查。
无 Critical、Important、Minor 问题，没有搁置未判断行为，无需修复。

本次决策及代价：

- 沿用已批准的原目录 main 开发发布流程，不额外创建工作树或重复确认；
  通过 fresh fetch 和正常推送保护并发变更，不能绕过并发冲突。
- 采用球面直接拖动加数字面板，不引入 3D 操纵轴，适合小星球与触屏；
  代价是经纬度输入不如操纵轴直观。
- 对已导入且重叠的物件允许旋转和缩小，因为不会扩大占地；
  移动或放大仍需安全空间。代价是原有重叠要移动后才能消除。

## 上线证据

功能已正常推送，Actions 的 build、deploy、verify 全部成功。
线上 `release.json.commit` 精确等于功能提交
`eadbe8198b890ebca8832cd9d3302f08c5c8727b`，
标记 `builtAt` 为 `2026-11-23T02:23:05.234Z`。

独立线上浏览器 **20 项**检查通过：精确版本、英文选择工具、
真实可见实例选取、真实 WebGL 像素、球面拖动及邻居保护、
整次拖动撤销重做、朝向和大小编辑、实际下载 JSON 的精确最终变换、
刷新恢复且不保留临时选择、中文手机触屏选取、数字编辑、
应用按钮可达、无横向溢出、非空 WebGL、删除及撤销。
没有 JavaScript 或控制台错误、警告；已查看线上桌面和手机截图。

本进度和报告在功能线上验收后单独提交，仅记录上述功能提交；
记录提交的 Actions 和最新线上版本由执行者在提交后继续核验。
推送使用临时 HTTPS 凭据助手和 HTTP/1.1，没有修改 remote、
Git 配置、提交历史或暴露凭据。

## QA 产物

均位于被 Git 忽略的 `output/playwright/`，不提交公开：

```text
verify-day08-{control,edit,gestures,live}.cjs
day08-{unit,build,browser,gestures,live,workflow}-result.log
day08-day07-regression.log
day08-inspector-{zh-CN,en}-{1440,390,360,844}.png
day08-reachable-{zh-CN,en}-360.png
day08-live-{desktop,mobile}.png
day08-{project,live,render-failure}.planet.json
day08-offline.html
day08-offline.png
day08-{selected,unselected}.png
```

本次创建的生产预览和隔离浏览器会话在最终验收后关闭；
不关闭其他项目的本地服务。
