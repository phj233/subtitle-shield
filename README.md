# Subtitle Shield

中文 | [English](README.en.md)

Subtitle Shield 是一个面向语言学习者的 Tampermonkey/Violentmonkey 用户脚本。它给 YouTube 和 Bilibili 字幕增加一点温和阻力，让你先听，再在需要时临时查看字幕。

它不下载字幕，不绕过平台限制，也不会上传观看记录、字幕内容或配置数据。

## 亮点

| 能力 | 说明 |
| --- | --- |
| 多种字幕模式 | 支持模糊、倒置、隐藏、仅暂停显示、延迟显示 |
| 快速临时显示 | 按住快捷键即可恢复字幕，默认快捷键为 `Alt` |
| 分站点控制 | YouTube 和 Bilibili 可以分别启用或禁用 |
| 实时调节 | 模糊强度、延迟时间、字幕垂直位置调整后立即生效 |
| 紧凑设置面板 | 面板可拖动，也可最小化为可拖动悬浮球 |
| 双语界面 | 设置面板支持 `zh-CN` 和 `en-US` |

## 快速安装

先安装依赖并构建用户脚本：

```bash
npm install
npm run build
```

然后在 Tampermonkey 或 Violentmonkey 中安装：

```text
dist/subtitle-shield.user.js
```

安装后打开 YouTube 或 Bilibili 视频页，在用户脚本管理器菜单中选择 `Open Subtitle Shield` 打开设置面板。

## 字幕模式

| 模式 | 效果 |
| --- | --- |
| `blur` | 模糊字幕，默认模式 |
| `flip` | 反转字幕，降低下意识阅读概率 |
| `hide` | 隐藏字幕，但不删除原生字幕 DOM |
| `pauseOnly` | 播放时隐藏，暂停时显示 |
| `delay` | 字幕出现一段时间后再显示 |

## 配置项

- 全局启用或禁用。
- YouTube 和 Bilibili 独立启用或禁用。
- 模糊强度。
- 延迟时间。
- 字幕垂直位置，负值向上移动，正值向下移动。
- 按住显示字幕的快捷键。
- 鼠标悬停字幕区域时显示字幕。
- 视频暂停时显示字幕。
- 设置面板语言。

## 支持站点

- `https://www.youtube.com/*`
- `https://youtube.com/*`
- `https://www.bilibili.com/video/*`
- `https://www.bilibili.com/list/*`

## 本地开发

启动 Vite 调试沙盒：

```bash
npm run dev
```

常用检查命令：

```bash
npm run check
npm run test
npm run build
```

生产构建会输出单文件用户脚本：

```text
dist/subtitle-shield.user.js
```

## Greasy Fork 发布

GitHub Actions 会在 `main` 分支更新后自动构建用户脚本，并把产物发布到 `greasyfork` 分支：

```text
https://raw.githubusercontent.com/phj233/subtitle-shield/greasyfork/subtitle-shield.user.js
```

在 Greasy Fork 首次发布时，可以使用上面的 raw URL 导入脚本；之后在脚本管理页设置脚本同步 URL 为同一个地址。每次发布新版本前记得递增 `@version`。

Greasy Fork 的“附加信息同步”不要指向完整 README、仓库页面或脚本文件，否则可能超过 50,000 字符限制。请使用下面的短说明文件，并选择 Markdown：

```text
https://raw.githubusercontent.com/phj233/subtitle-shield/greasyfork/additional-info.zh-CN.md
https://raw.githubusercontent.com/phj233/subtitle-shield/greasyfork/additional-info.en.md
```

如果 Actions 推送失败，检查 GitHub 仓库设置里的 `Settings -> Actions -> General -> Workflow permissions`，需要允许 `Read and write permissions`。

## 隐私与限制

Subtitle Shield 只在本地处理页面字幕样式，不发送网络请求。YouTube 和 Bilibili 的播放器 DOM 可能变化，脚本使用限定范围的 `MutationObserver` 和多个选择器 fallback，但站点更新后仍可能需要维护适配器选择器。
