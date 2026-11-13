# Day 02: PNG 图片导出

- 计划日期、实际开发与上线日期：2026-11-13，Asia/Shanghai。
- 状态：`published`。
- 功能提交：`da8563b66f6f84ebaadc18d3cc03e5cb4aceb3d4`。
- Actions：<https://github.com/Snowman1727/planet-studio/actions/runs/43343473210>。
- 站点：<https://snowman1727.github.io/planet-studio/>。

## 本日交付

导出窗口新增 **HTML / PNG** 标签页。PNG 支持 **1024 × 1024**、
**2048 × 2048** 两种尺寸，默认透明背景，也可以选择编辑器的深色背景。
图片使用当前显示的朝向，自动把星球和全部装饰物收进正方形，预留边缘，
不包含工具栏、画笔轮廓、星空或飘雪。

使用原生尺寸选择器、透明背景复选框和下载按钮。标签页支持方向键、
Home / End；中英文同步提供控件、无障碍名称和生成中、成功、失败状态。
生成时阻止重复下载，关闭后再打开窗口也保留进行中的任务。编码失败后
可以重试。HTML 仍是默认页签，嵌入与离线播放器不变。

渲染器用克隆相机拍摄，按地表及可见实例几何的包围球计算安全距离。
临时调整绘图缓冲区后，在同步 `finally` 中恢复尺寸、像素比例和场景标志，
再异步编码复制出的像素。导出不改项目、存档视角、本地草稿、预览状态
或撤销重做历史。没有新增依赖，也不改变 schema 2 或旧存档迁移规则。

修改范围：`prototype/index.html`、`prototype/studio/` 下的渲染器、
导出工具、主控制器、语言和样式，两份 README；新增图片单元测试与当日计划。
只修改独立星球项目，没有修改博客仓库。

## 自动测试

使用 Node.js 24 运行：

```sh
npm test
npm run build
git diff --check
```

- **41 项单元测试通过，0 失败**，新增 PNG 参数边界与安全取景检查。
- RED：实现前两项新测试均因缺少 PNG 功能失败；旧线上站点的浏览器检查
  明确失败为 `PNG export tab is missing`，之后才接入控件。
- 生产构建成功；保留既有的大体积 bundle 警告。
- 空白检查通过。
- 独立最终代码审查批准，无阻塞问题；审查指出的画笔直接验证缺口，
  随后补充 3 项真实渲染断言并通过。

## 浏览器验收

生产构建通过本地 `npm run preview -- --port 5180` 验收。
使用独立 Playwright Chromium 会话，本地共 **114 项断言通过**：

- 主流程 **97 项**：实际下载并解码两种尺寸与背景的 PNG，验证文件签名、
  精确尺寸、透明度、真实着色像素、取景留白；保存到磁盘后用浏览器打开。
- 每次导出前后，草稿字节、物件数量、撤销重做、画布尺寸与编辑器像素
  精确相同；撤销、重做、本地恢复和 JSON 往返继续可用。
- 三种环境与六种物件；在星球轮廓边缘放置最大尺寸树木、木屋，
  验证导出不裁切且保留布局。
- 注入原生编码返回空值及像素复制异常，确认错误本地化、渲染器恢复并
  可重试；延迟真实编码回调，确认忙碌防重、切语言、关闭重开和单次下载。
- 中英文、1440x960、390x844、360x640、844x390；标签页键盘操作、
  控件可达、文本不溢出，每种布局都实际导出图片。
- 旧 schema 1 JSON 导入和往返后可导出 PNG；实际下载 HTML 后阻断网络，
  检查真实 WebGL 像素、键盘旋转、零 HTTP(S) 请求。
- DPR / 动态效果 **14 项**：DPR 2 的高分屏浏览器仍导出精确 1024/2048
  图片，恢复原绘图缓冲区；动画与飘雪继续，暂停状态和像素保持，
  不把动画视角写回草稿。通过 `readPixels` 检查真实编辑器画面。
- 可见画笔 **3 项**：确认画笔确实显示；有无画笔导出的 PNG 哈希完全相同；
  导出后画笔像素精确恢复。
- 无未捕获 JavaScript 异常。

本地 QA 脚本与日志被 Git 忽略，不提交至公开仓库：

```text
output/playwright/verify-day02-png.cjs
output/playwright/day02-browser-verification.log
output/playwright/verify-day02-dpr-motion.cjs
output/playwright/day02-dpr-motion.log
output/playwright/verify-day02-brush.cjs
output/playwright/day02-brush.log
output/playwright/verify-day02-live.cjs
output/playwright/day02-live-verification.log
```

主要图片与截图证据：

```text
output/playwright/day02-{1024,2048}-{transparent,dark}.png
output/playwright/day02-limb-{snow,grass,desert}.png
output/playwright/day02-dialog-{en,zh-CN}-{1440,390,360,844}.png
output/playwright/day02-editor-{en,zh-CN}-{1440,390,360,844}.png
output/playwright/day02-retina-preview.png
output/playwright/day02-offline.png
output/playwright/day02-live-{1024,2048}.png
output/playwright/day02-live-dialog-{1440,390}.png
```

已人工检查实际 PNG、轮廓边缘的树木与木屋、中英文桌面/窄屏/横屏弹窗、
高分屏预览与线上手机截图：图片完整，界面无不合理重叠。

## 发布证据

正常推送 main 后，`Test and deploy` 成功；真实线上浏览器读到：

```json
{
  "commit": "da8563b66f6f84ebaadc18d3cc03e5cb4aceb3d4",
  "builtAt": "2026-11-13T01:15:13.601Z"
}
```

线上另完成 **17 项断言**：精确发布 SHA、绘制、桌面和手机真实 WebGL
画面、双语 PNG 控件、实际下载解码的 2048 透明 PNG 与 1024 深色 PNG、
透明度、精确尺寸、草稿不变、成功文案和布局；无 JavaScript 异常。
通过线上验收之后，才把 Day 02 标记为 `published`。

本文与进度更新的后续文档提交同样经过部署门禁。最终执行阶段再核对
其工作流和线上标记；届时标记变为文档提交，不再是上面的功能提交。

## 决策与限制

- 小型参数/取景函数放在既有 `export.js`，没有新增微小模块。
- WebGL 上下文丢失沿用现有“保存 JSON 后刷新”的处理，不引入上下文自动恢复。
  PNG 会禁用，JSON 仍可保存；普通编码/复制失败则恢复并允许重试。
- 本次真实浏览器验证为 Chromium；不声称已测试 Safari、Firefox 或真实
  显卡驱动故障中的上下文丢失。模拟上下文丢失已验证。
- Day 03（2026-11-14，镜头缩放）仍为 `pending`，没有提前实现。
