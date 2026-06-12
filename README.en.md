# Subtitle Shield

[中文](README.md) | English

Subtitle Shield is a Tampermonkey/Violentmonkey userscript for language learners. It adds gentle friction to YouTube and Bilibili captions, helping you listen first and reveal captions only when needed.

It does not download captions, bypass platform restrictions, or upload viewing history, caption text, or settings data.

## Highlights

| Capability | Details |
| --- | --- |
| Multiple caption modes | Blur, flip, hide, pause-only, and delay |
| Fast temporary reveal | Hold a shortcut to restore captions, defaulting to `Alt` |
| Per-site control | Enable or disable YouTube and Bilibili separately |
| Live tuning | Blur strength, delay time, and vertical caption position apply immediately |
| Compact settings panel | Drag the panel or minimize it into a draggable floating button |
| Bilingual UI | Settings panel supports `zh-CN` and `en-US` |

## Quick Install

Install dependencies and build the userscript:

```bash
npm install
npm run build
```

Then install this file in Tampermonkey or Violentmonkey:

```text
dist/subtitle-shield.user.js
```

After installation, open a YouTube or Bilibili video page and choose `Open Subtitle Shield` from the userscript manager menu.

## Caption Modes

| Mode | Effect |
| --- | --- |
| `blur` | Blurs captions, the default mode |
| `flip` | Flips captions to reduce reflexive reading |
| `hide` | Hides captions without removing native caption DOM |
| `pauseOnly` | Hides captions during playback and reveals them while paused |
| `delay` | Reveals captions after a configurable delay |

## Settings

- Global enable or disable switch.
- Per-site switches for YouTube and Bilibili.
- Blur strength.
- Delay time.
- Vertical caption position, negative values move captions up and positive values move them down.
- Hold-to-reveal shortcut.
- Reveal captions on hover.
- Reveal captions while video is paused.
- Settings panel language.

## Supported Sites

- `https://www.youtube.com/*`
- `https://youtube.com/*`
- `https://www.bilibili.com/video/*`
- `https://www.bilibili.com/list/*`

## Local Development

Run the Vite sandbox:

```bash
npm run dev
```

Useful checks:

```bash
npm run check
npm run test
npm run build
```

The production build emits a single userscript file:

```text
dist/subtitle-shield.user.js
```

## Greasy Fork Publishing

GitHub Actions automatically builds the userscript when `main` changes and publishes the output to the `greasyfork` branch:

```text
https://raw.githubusercontent.com/phj233/subtitle-shield/greasyfork/subtitle-shield.user.js
```

For the first Greasy Fork release, import the script from the raw URL above. After that, set the script sync URL to the same address in the script admin page. Remember to bump `@version` before publishing a new release.

Do not point Greasy Fork's synced additional info to the full README, repository page, or userscript file. It can exceed Greasy Fork's 50,000-character limit. Use these short Markdown files instead:

```text
https://raw.githubusercontent.com/phj233/subtitle-shield/greasyfork/additional-info.zh-CN.md
https://raw.githubusercontent.com/phj233/subtitle-shield/greasyfork/additional-info.en.md
```

If the workflow cannot push the branch, check `Settings -> Actions -> General -> Workflow permissions` in the GitHub repository and allow `Read and write permissions`.

## Privacy And Limits

Subtitle Shield only changes caption presentation locally and does not send network requests. YouTube and Bilibili can change player DOM at any time. The script uses scoped `MutationObserver` listeners and multiple selector fallbacks, but site-specific selectors may still need maintenance after platform updates.
