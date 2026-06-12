# AGENTS.md

## 1. 项目定位

Subtitle Shield 是一个面向语言学习者的字幕辅助工具。它通过模糊、倒置、隐藏、延迟显示、仅暂停时显示等方式，降低用户在观看 YouTube 和 Bilibili 视频时下意识偷看字幕的概率，帮助用户先听，再在需要时查看字幕。

项目优先形态是 Tampermonkey/Violentmonkey 用户脚本；长期可以演进为基于 Chromium 的浏览器扩展。任何实现都应尽量让核心逻辑可复用，不要把业务逻辑锁死在单一运行环境里。

## 2. 当前仓库状态

当前仓库是 Vite + TypeScript 用户脚本项目，已移除 Vite starter 示例代码和示例资源。

主要文件包括：

- `vite.config.ts`：Vite library build 配置，输出单文件 `dist/subtitle-shield.user.js`，并在文件顶部注入 userscript metadata。
- `src/main.ts`：Tampermonkey/Violentmonkey 用户脚本入口。
- `src/dev.ts`、`src/dev.css`：本地 Vite 调试沙盒，不进入 userscript 构建入口。
- `src/app/`：应用启动与生命周期装配。
- `src/core/`：设置、i18n、字幕引擎、快捷键、样式注入、存储抽象。
- `src/sites/`：YouTube 和 Bilibili 站点适配器。
- `src/ui/`：页面内设置面板。
- `src/userscript/`：GM 存储和菜单适配层。
- `tests/`：Vitest 单元测试。
- `.github/workflows/greasyfork.yml`：构建用户脚本并发布到 `greasyfork` 分支，供 Greasy Fork 同步。
- `README.md`：中文用户文档。
- `README.en.md`：英文用户文档。

如果后续代码结构与本文件不一致，先阅读实际代码，再更新本文件。不要机械套用过期说明。

## 3. 常用命令

优先使用仓库已有脚本：

```bash
npm install
npm run dev
npm run check
npm run test
npm run build
npm run preview
```

当前仓库使用 npm，并应保留 `package-lock.json`。如果没有安装依赖，运行：

```bash
npm install
```

脚本含义：

- `npm run dev`：启动 Vite 本地沙盒，用 mock 字幕测试配置面板和基础字幕效果。
- `npm run check`：运行 `tsc --noEmit`。
- `npm run test`：运行 Vitest 单元测试。
- `npm run build`：运行 TypeScript 检查并构建 `dist/subtitle-shield.user.js`。
- `npm run preview`：预览 Vite 构建输出。

新增 lint、format、extension build 或发布命令后，必须同步更新本节。

## 4. 面向 Agent 的工作准则

- 默认用中文与用户沟通，代码命名和公开 API 保持英文。
- 修改前先读相关文件，不要基于猜测大改。
- 保持变更聚焦。不要顺手重构与当前任务无关的代码。
- 保留用户已有改动。不要还原、删除或覆盖未确认来源的内容。
- 不要提交 `.idea/`、构建产物、浏览器 profile、打包后的扩展文件或临时调试文件。
- 如果遇到当前代码与本文件冲突，以当前代码和用户最新要求为准，并在必要时更新本文件。
- 不要声称验证通过，除非确实运行了对应命令或完成了手动验证。

## 5. 产品原则

- 工具应该制造“温和阻力”，而不是惩罚学习者。
- 默认模式应尽量不破坏观看体验。推荐默认使用 `blur`，而不是永久隐藏。
- 用户必须能快速临时显示字幕，例如按住快捷键、暂停显示或面板开关。
- YouTube 和 Bilibili 都是一等支持站点。
- 不干扰播放、账号、评论、推荐、广告、弹幕、付费内容或平台访问控制。
- 不实现下载字幕、破解付费内容、绕过 DRM 或规避平台限制的功能。
- 不采集、不上传、不远程记录用户观看内容、字幕内容或浏览历史。

## 6. 非目标

以下内容不是 MVP 目标，除非用户明确要求：

- 自建字幕翻译服务。
- 语音识别或自动生成字幕。
- 下载视频、下载字幕或批量抓取字幕。
- 账号同步、云端备份、学习数据统计。
- 大型复杂前端框架驱动的配置后台。
- 兼容所有视频网站。

## 7. 预期功能

MVP 应覆盖：

- 全局启用/禁用。
- 分站点启用/禁用：YouTube、Bilibili。
- 字幕处理模式：
  - `blur`：模糊字幕。
  - `flip`：倒置或镜像字幕。
  - `hide`：隐藏字幕。
  - `pauseOnly`：仅在视频暂停时显示字幕。
  - `delay`：延迟显示字幕。
- 可配置模糊强度。
- 可配置延迟时间。
- 可配置字幕垂直位置，负值向上移动，正值向下移动。
- 按住快捷键临时显示字幕。
- 可选：鼠标悬停字幕区域时临时显示。
- 用户脚本菜单入口。
- 页面内配置面板。
- 配置面板支持通过标题栏拖动。
- 配置面板可以最小化为悬浮球，悬浮球同样支持拖动。
- i18n，至少支持 `zh-CN` 和 `en-US`。

## 8. 当前目录结构

当前实现采用以下结构：

```text
src/
  app/
    bootstrap.ts
  core/
    i18n.ts
    settings.ts
    storage.ts
    shortcuts.ts
    styles.ts
    subtitle-engine.ts
    types.ts
  sites/
    bilibili.ts
    dom.ts
    index.ts
    navigation.ts
    types.ts
    youtube.ts
  ui/
    settings-panel.ts
  userscript/
    gm-storage.ts
    menu.ts
  dev.ts
  dev.css
  main.ts
tests/
  i18n.test.ts
  settings.test.ts
```

未来迁移到 Chromium 扩展时，应优先复用 `core/`、`sites/` 和必要的 `ui/` 代码，并新增扩展专用存储适配层，不要把扩展 API 写进核心模块。

## 9. 架构边界

核心原则：平台适配、字幕处理、配置存储、UI、i18n 要分开。

- `storage`：只负责持久化读写。用户脚本里封装 `GM_getValue`、`GM_setValue`；扩展里封装 `chrome.storage`。
- `settings`：定义默认配置、配置迁移、配置校验和合并。
- `i18n`：只负责语言解析和文案查询。
- `site-adapters`：只负责识别站点、查找播放器/字幕容器、监听 SPA 导航。
- `subtitle-engine`：只负责根据配置应用 CSS class、style 或 DOM 状态。
- `shortcuts`：只负责键盘/鼠标临时 reveal 状态。
- `settings-panel`：只负责配置 UI，不直接写字幕 DOM。

不要让任一模块同时承担多个职责。例如不要在 YouTube adapter 里直接写 GM 存储，也不要在 UI 组件里硬编码字幕选择器。

## 10. 配置模型

建议默认配置从这个形状开始：

```ts
type CaptionMode = 'blur' | 'flip' | 'hide' | 'pauseOnly' | 'delay'
type Language = 'auto' | 'zh-CN' | 'en-US'

interface SubtitleShieldSettings {
  enabled: boolean
  language: Language
  mode: CaptionMode
  blurPx: number
  delayMs: number
  captionOffsetYPx: number
  revealShortcut: string
  revealOnHover: boolean
  showOnPause: boolean
  sites: {
    youtube: boolean
    bilibili: boolean
  }
}
```

建议默认值：

```ts
const defaultSettings: SubtitleShieldSettings = {
  enabled: true,
  language: 'auto',
  mode: 'blur',
  blurPx: 6,
  delayMs: 2000,
  captionOffsetYPx: 0,
  revealShortcut: 'Alt',
  revealOnHover: false,
  showOnPause: true,
  sites: {
    youtube: true,
    bilibili: true,
  },
}
```

配置读取必须做合并和容错：旧版本缺字段时使用默认值；字段类型不对时回退默认值。以后改配置结构时要增加版本迁移。

## 11. i18n 规则

- 不要在 UI 代码里硬编码用户可见文案。
- 所有面板标题、按钮、label、hint、模式名称、错误提示都必须进入消息字典。
- 至少维护 `zh-CN` 和 `en-US`。
- `language: 'auto'` 时再读取 `navigator.language`。
- 用户显式选择语言后必须持久化。
- 缺失翻译时按顺序回退：当前语言 -> `en-US` -> key 本身。
- 翻译 key 应稳定，不要用完整句子当 key。

示例：

```ts
const messages = {
  'zh-CN': {
    panelTitle: 'Subtitle Shield 设置',
    enabled: '启用',
    mode: '字幕模式',
  },
  'en-US': {
    panelTitle: 'Subtitle Shield Settings',
    enabled: 'Enabled',
    mode: 'Caption mode',
  },
}
```

## 12. 用户脚本要求

用户脚本版本需要注意：

- 使用明确的 `@match`，不要无差别运行在所有网站。
- 至少匹配：
  - `https://www.youtube.com/*`
  - `https://youtube.com/*`
  - `https://www.bilibili.com/video/*`
  - `https://www.bilibili.com/list/*`，如果后续确认需要。
- 通过 `GM_registerMenuCommand` 提供配置面板入口。
- 通过 `GM_getValue` 和 `GM_setValue` 持久化设置。
- 如果注入样式，确保只注入一次，并使用稳定 id。
- 不要使用长期高频 `setInterval` 扫描 DOM；优先使用 `MutationObserver`，必要轮询也要有上限和退避。

用户脚本 metadata 示例仅作为方向，实际以构建产物为准：

```js
// ==UserScript==
// @name         Subtitle Shield
// @name:zh-CN   Subtitle Shield
// @namespace    https://github.com/phj233/subtitle-shield
// @version      0.1.0
// @description  Hide, blur, or flip YouTube and Bilibili captions so language learners listen first.
// @description:zh-CN 为 YouTube 和 Bilibili 字幕增加模糊、倒置、隐藏、延迟和暂停显示模式，帮助语言学习者先听再看。
// @license      MIT
// @homepageURL  https://github.com/phj233/subtitle-shield
// @supportURL   https://github.com/phj233/subtitle-shield/issues
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @match        https://www.bilibili.com/video/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==
```

## 13. Chromium 扩展迁移方向

不要为了 MVP 过早实现扩展，但写代码时要预留迁移空间：

- content script 复用 `core` 和 `sites`。
- options page 或 popup 复用 `settings`、`i18n` 和部分 UI 控件。
- 用存储适配器隔离 `GM_*` 与 `chrome.storage`。
- 不把 Tampermonkey 专属 API 泄漏到核心模块。
- 不把扩展 manifest 逻辑和字幕处理逻辑混在一起。

扩展版本需要单独考虑：

- Manifest V3 权限最小化。
- host permissions 只覆盖支持站点。
- popup/options 的无障碍与键盘操作。
- content script 注入时机。
- 与页面 CSP 的兼容性。

## 14. YouTube 适配策略

YouTube 是 SPA，需要处理页面内导航。实现时关注：

- `yt-navigate-finish` 等导航事件。
- URL 从一个视频切换到另一个视频时重新绑定。
- 字幕容器可能在用户打开 CC 后才出现。
- 字幕节点可能频繁变化，处理必须幂等。

可作为起点的选择器方向：

- `.ytp-caption-window-container`
- `.caption-window`
- `.ytp-caption-segment`
- `.html5-video-player`

这些选择器不能被视为永久稳定。每次修复 YouTube 适配时，要说明是基于哪一天的 DOM 观察。

## 15. Bilibili 适配策略

Bilibili 同样可能有播放器内部 DOM 变化和页面内切换。实现时关注：

- 视频页 URL：`/video/`。
- 播放器容器和字幕容器可能随播放器版本变化。
- Bilibili 同时存在字幕、弹幕、播放器提示，不要误伤弹幕。
- 不要修改弹幕层，除非用户明确要求。

可作为起点的选择器方向：

- `.bpx-player-container`
- `.bpx-player-video-wrap`
- `.bpx-player-subtitle-panel`
- `[class*="subtitle"]`

含 `subtitle` 的泛选择器只能作为 fallback，并且必须限制在播放器容器内，避免影响页面其他区域。

## 16. 字幕处理规则

所有视觉效果优先通过 CSS class 控制。推荐 class 前缀：

- `ss-root`
- `ss-enabled`
- `ss-mode-blur`
- `ss-mode-flip`
- `ss-mode-hide`
- `ss-mode-pause-only`
- `ss-mode-delay`
- `ss-revealing`
- `ss-panel-open`

处理规则：

- `blur`：使用 `filter: blur(var(--ss-blur-px))`，必要时配合轻微 opacity。
- `flip`：优先只作用于字幕文本容器，不要翻转整个播放器。
- 字幕位置调整：使用 CSS 变量控制垂直位移，不要覆盖平台原有 `transform`。
- `hide`：隐藏字幕文本，但不要删除字幕 DOM。
- `pauseOnly`：播放中隐藏或模糊，暂停时显示。
- `delay`：字幕出现后延迟显示，注意节点变化和计时器清理。
- reveal 状态优先级最高：用户临时显示时应覆盖所有模式。

不要直接修改用户原有字幕样式到不可恢复。禁用工具后，页面应恢复原生字幕表现。

## 17. 配置面板 UI 规则

配置面板应是页面内浮层，不依赖浏览器扩展 popup。

要求：

- 可从用户脚本菜单打开。
- 可以关闭。
- 不应永久遮挡播放器控制区。
- 可以拖动配置面板标题栏，把面板移出字幕或播放器控制区。
- 配置面板可以最小化为悬浮球，悬浮球必须可点击还原、可键盘聚焦、可拖动。
- 所有控件有可读 label。
- 支持键盘 Tab 导航和 Escape 关闭。
- 需要基本 focus 样式。
- 保存后立即生效。
- 设置变更应持久化。
- CSS 必须命名空间隔离，不污染视频网站页面。

推荐控件：

- 启用/禁用：checkbox 或 switch。
- 站点开关：checkbox。
- 字幕模式：select 或 segmented control。
- 模糊强度：range + number。
- 延迟时间：number。
- 语言：select。
- 快捷键：先用 select 或固定选项，后续再做自定义录入。

## 18. 快捷键规则

- 默认快捷键建议为按住 `Alt` 临时显示字幕。
- 不要拦截输入框、textarea、contenteditable 中的正常输入。
- 不要破坏视频网站已有快捷键。
- 快捷键监听应可卸载。
- 同时支持 keydown 和 keyup，避免 keyup 丢失导致一直 reveal。
- 页面失焦、visibility change 或 blur 时，应清理 reveal 状态。

## 19. 样式规则

- 注入 CSS 使用唯一 style id，例如 `subtitle-shield-style`。
- class 使用 `ss-` 或 `subtitle-shield-` 前缀。
- 不使用全局 reset。
- 不修改 `body`、`html` 的全局布局。
- 不用过高 z-index，配置面板只需高于播放器即可。
- 不使用容易影响页面性能的大范围选择器。
- 尽量只在字幕容器或根 class 下生效。

## 20. 隐私与安全

- 不发送网络请求，除非用户明确要求并说明用途。
- 不上传字幕内容、视频 URL、观看历史或用户配置。
- 不读取无关页面内容。
- 不引入远程脚本。
- 不在配置里存储敏感信息。
- 不使用 `eval` 或动态执行远程代码。
- 不绕过 YouTube 或 Bilibili 的技术限制、付费墙或权限控制。

## 21. 可访问性与学习体验

- 临时显示字幕应该足够快，避免用户需要反复打开设置。
- 模糊强度默认值不要过激，用户可以自己调高。
- 配置面板要有清晰的可聚焦元素。
- 文案要短，不要在 UI 里写长篇说明。
- 英文 UI 使用自然表达，中文 UI 使用简洁表达。
- 不要把“学习失败”归咎于用户，产品语气保持帮助和鼓励。

## 22. 测试与验证

每次代码变更后，至少运行：

```bash
npm run check
npm run test
```

影响构建、userscript metadata、入口文件或字幕行为时，必须运行：

```bash
npm run build
```

涉及 UI 或页面行为时，尽量运行本地沙盒：

```bash
npm run dev
```

本地沙盒只能验证面板、设置持久化和基础字幕效果。YouTube/Bilibili 的真实 DOM 行为仍需在对应站点手动验证。

手动验证清单：

- YouTube 视频页打开后，字幕模式生效。
- YouTube 页面内切换视频后仍然生效。
- Bilibili 视频页打开后，字幕模式生效。
- Bilibili 页面内切换或重新加载后仍然生效。
- 工具禁用后字幕恢复原生表现。
- reveal 快捷键按下显示、松开恢复。
- 配置面板能打开、修改、保存、关闭。
- 刷新页面后配置仍保留。
- `zh-CN` 和 `en-US` 都能完整显示。
- 控制台没有持续报错。
- 没有明显的 observer、timer 或 DOM 重复插入问题。

如果未来加入测试框架，优先覆盖：

- settings merge 和迁移。
- i18n fallback。
- storage adapter。
- subtitle-engine 的 class 状态。
- adapter setup 的幂等性。
- shortcut 在输入框中不触发。

## 23. 代码审查清单

提交或交付前检查：

- 是否只改了任务相关文件。
- 是否保留了用户已有改动。
- 是否没有提交本地 IDE 文件。
- 是否没有把 starter 示例残留在最终用户界面里。
- 是否没有硬编码用户可见文案。
- 是否没有把 YouTube/Bilibili selector 写成唯一不可替换路径。
- 是否没有长期高频轮询。
- 是否没有内存泄漏风险：observer、listener、timer 可清理。
- 是否 build 通过，或明确说明未运行/失败原因。

## 24. README 同步规则

当以下内容变化时，更新 README：

- 支持站点变化。
- 字幕模式变化。
- 安装方式变化。
- 配置项变化。
- 用户脚本管理器要求变化。
- 扩展构建或加载方式变化。
- 已知问题和兼容性说明变化。

README 面向用户，本文件面向 agent。不要把 agent 工作细节塞进 README。

## 25. 版本与发布建议

用户脚本发布建议：

- 使用语义化版本，例如 `0.1.0`。
- 每次改变用户可见行为时更新版本。
- 生成单文件 userscript 产物，方便复制安装。
- 产物文件建议命名为 `subtitle-shield.user.js`。
- Greasy Fork 同步地址应指向 `greasyfork` 分支根目录产物：

```text
https://raw.githubusercontent.com/phj233/subtitle-shield/greasyfork/subtitle-shield.user.js
```

- `.github/workflows/greasyfork.yml` 会从 `main` 构建并 force-push `greasyfork` 分支。若 GitHub Actions 无法推送，检查仓库 `Workflow permissions` 是否允许写入。
- Greasy Fork 详情页长文档不会自动从 `README.md` / `README.en.md` 切换；多语言标题和简介优先用 `@name:zh-CN`、`@description:zh-CN` 等 metadata。

扩展发布建议：

- 单独维护 manifest。
- 不提交本地打包 zip，除非用户明确要求。
- release artifact 可以由 CI 或发布流程生成。

## 26. 已知风险

- YouTube 和 Bilibili 的 DOM 会变化，选择器需要维护。
- 字幕和弹幕可能被误判，尤其是 Bilibili。
- SPA 导航容易导致重复 observer 或重复 style。
- 不同浏览器和脚本管理器对 GM API 支持细节可能不同。
- 某些字幕由 canvas 或 shadow DOM 渲染时，CSS 方案可能不够。

遇到风险时，先做最小可验证修复，不要大范围重写。

## 27. 给 Claude 和 Codex 的特别说明

- 本文件是该仓库中面向 coding agent 的共享事实源。
- Codex 会读取 `AGENTS.md` 作为项目指引。
- 如果 Claude 没有自动读取本文件，可以创建 `CLAUDE.md` 指向本文件，但不要复制两份互相漂移的规则。
- 做实现任务时，优先读取 `package.json`、`tsconfig.json`、`src/` 现有代码和本文件。
- 如果用户要求“先讨论”“先设计”“不要写代码”，就不要主动改文件。
- 如果用户要求实现功能，默认端到端完成：代码、构建验证、简短说明。

## 28. 完成定义

一次功能变更完成时，应满足：

- 行为符合用户要求。
- 配置和 i18n 没有被绕开。
- 对 YouTube/Bilibili 的影响范围明确。
- 禁用工具后能恢复原生字幕。
- 构建通过，或明确记录未通过原因。
- 最终回复用简洁中文说明改了什么、验证了什么、还有什么未做。
