# Day 09: 物件锁定

- 计划日期：2026-11-20，Asia/Shanghai。
- 实际开发并上线：2026-11-24。按最早未完成项顺延，本次只交付这一项。
- 状态：`published`。Day 10 及以后保持待开发。
- 功能提交：`a36ceafd34884de2d0e638f8c798a36ddd820989`。
- Actions：<https://github.com/Snowman1727/planet-studio/actions/runs/45304501153>。
- 站点：<https://snowman1727.github.io/planet-studio/>。

## 交付内容

选中物件后，可通过「锁定物件 / Lock object」复选框锁定或解锁。
锁定物件仍可选中和解锁，但不能拖动、修改位置、朝向或大小、删除。
全部和六种按类型橡皮均跳过锁定物件；它们仍占用空间，
新绘制或移动的其他物件不能进入其保护范围。
锁定时禁用变换和删除控件，但不禁用解锁；无选择、预览或渲染失败时
禁用锁定控件。支持中英文、键盘 Space 和真实触屏。

每次有效锁定或解锁只占一步历史；未完成的拖动或擦除先取消再记录。
无操作、缺失 ID 和非法调用不清空重做。撤销重做恢复完整物件快照，
包括锁定状态，因此撤销锁定可以恢复到未锁定状态。
新建、打开和模板替换仍是明确的整个项目替换，不受局部编辑锁限制。
锁定是编辑保护，不是权限或安全边界。

保持 schema 2，新增可选布尔字段 `locked`：只规范保存 `true`，
缺失或 `false` 表示未锁定；显式非布尔值拒绝导入。
旧 schema 1/2 项目默认未锁定，不改变原有位置和大小。
JSON、草稿恢复、本地作品库和独立 HTML 均保留锁定数据。
旧版编辑器重新保存可能丢弃该可选字段，需使用新版保持编辑保护。
保留 2,000 物件、40 步历史及 2 MB JSON 限制。

改动涉及 `model.js`、`object-inspector.js`、`main.js` 的图标注册、
`i18n.js`、`style.css`、`prototype/index.html`、两份 README、
新增锁定测试和当日技术方案。未修改博客，未包含物件列表或混合画笔。

## 本地验证

使用 Node.js 24：

```sh
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm test
env PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run build
git diff --check
```

基线 102 项；新增 12 项锁定测试先观察缺失 API、存档或保护逻辑的
预期失败，再实现为完整 **114/114** 通过。界面控件检查先观察缺失
复选框的失败，再通过 **4 项**。构建通过，仅有既有的大包体积警告；
whitespace 检查通过。发布前再次运行完整测试和构建均成功。

真实 Chromium 生产构建共 **292 项**本地检查通过：
4 项控件、136 项锁定集成及 152 项 Day 08 编辑回归。

- 六类物件实际几何选取，锁定后真实拖动、Delete/Backspace 和擦除均受保护。
- 解锁、旋转、实际拖动、重新锁定及精确一步撤销重做。
- 全部和按类型擦除、保护占地、新物件绘制及 2,000 物件上限。
- 键盘 Space、画布中心 Enter 选取、CDP 真实触屏拖动和复选框操作。
- 中英文，1440×960、390×844、360×640、844×390；
  复选框和应用按钮滚动到达后以实际命中验证无遮挡，无横向溢出。
- schema 1/2 迁移、非法锁定值非破坏性拒绝、刷新恢复及作品库保存打开。
- 实际下载 JSON 并重导入；实际下载 HTML 从 `file://` 打开，
  阻断 HTTP(S)，验证精确锁定数据、真实 WebGL 像素、缩放和零网络请求。
- 预览及渲染失败禁用锁定；渲染失败仍能实际下载精确 JSON 备份。
- 最终检查无未捕获 JavaScript、控制台错误或警告。

已查看桌面、中英文手机、窄屏、横屏和离线截图。
本次验收覆盖 Chromium，不代表 Safari、Firefox 或手机实机验证。

QA 修正：新增单元测试的初始夹具在实现前校正为实际类型 `flowers`，
以及实际木屋/树木保守占地 0.115/0.06。
Day 08 回归最初在 390px 的旧「应用按钮无需滚动即在视口内」假设处停止。
新增锁定行使面板更高，现有面板本就可滚动，独立锁定验收也已证明按钮
滚动后可实际命中。仅给被忽略的回归脚本增加显式滚动，再保留同一边界
断言，152/152 通过；没有修改生产布局来掩盖回归。

## 审查与决策

独立只读审查覆盖全部 10 个改动文件、相邻选择、导航、渲染、作品库、
恢复及导出路径，以及浏览器验收脚本和结果；独立运行 114/114 单元测试
与 whitespace 检查通过。没有 Critical、Important 或 Minor 问题，
没有未判断行为，无需修复；审查者未独立重跑构建和浏览器。

本次决策及代价：

- 沿用已批准的原目录 main 开发发布流程，不额外创建工作树或重复确认；
  通过 fresh fetch 和正常推送保护并发变更，若有并发冲突必须停止处理。
- schema 2 使用可选 `locked: true`，缺失和 false 规范为未锁定；
  延续已有可选字段方式、兼容旧作品，代价是旧编辑器可能丢弃锁定状态。
- 撤销重做恢复完整快照，整个项目替换仍允许；
  锁定只保护直接编辑，代价是撤销可能恢复未锁定快照，不提供权限隔离。

## 上线证据

功能正常推送后，Actions 的 build、deploy、verify 全部成功。
线上 `release.json.commit` 精确等于功能 SHA
`a36ceafd34884de2d0e638f8c798a36ddd820989`，
`builtAt` 为 `2026-11-24T01:22:16.453Z`。

在独立浏览器上下文对线上生产站点完整重跑同一锁定脚本，**136/136**
通过；脚本取回的 release SHA 另经断言再次精确匹配功能提交。
覆盖上述锁定、鼠标/触屏、双语布局、数据往返、恢复/作品库、
实际离线下载及 WebGL 检查，零 JavaScript 和控制台错误、警告。
已查看线上桌面、390px 中文、360px 英文、844px 横屏及离线截图。

本进度和报告只在功能线上验收成功后提交，记录的是功能 SHA；
记录提交的工作流及最终线上 SHA 在这次提交后继续核验，不增加自引用记录。
HTTPS Git 获取超时，改用已配置 origin 的 SSH 正常获取和推送成功，
未修改 remote、Git 配置或历史，未暴露凭据。

## QA 产物

位于被 Git 忽略的 `output/playwright/`，不提交公开：

```text
verify-day09-{control,lock}.cjs
verify-day08-edit.cjs
day09-{baseline,red,unit,unit-final,build,browser,live,workflow}.log
day09-control-{red,green}.log
day09-day08-regression.log
day09-{en,zh-CN}-{1440,390,360,844}.png
day09-live-{en,zh-CN}-{1440,390,360,844}.png
day09-{desktop,offline}.png
day09-live-{desktop,offline}.png
day09{,-live}.planet.json
day09{,-live}-render-failure.planet.json
day09{,-live}-offline.html
```

最终验收后关闭本次创建的 5189 生产预览和隔离浏览器会话；
保留其他项目及原有的本地服务。
