export const STYLE_ID = 'subtitle-shield-style'

const stylesheet = `
.ss-caption-root {
  --ss-blur-px: 6px;
  --ss-offset-y: 0px;
  translate: 0 var(--ss-offset-y);
  transition:
    filter 150ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 150ms cubic-bezier(0.22, 1, 0.36, 1),
    rotate 150ms cubic-bezier(0.22, 1, 0.36, 1),
    translate 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.ss-caption-root.ss-enabled.ss-mode-blur:not(.ss-revealing):not(.ss-video-paused) {
  filter: blur(var(--ss-blur-px)) !important;
  opacity: 0.82 !important;
}

.ss-caption-root.ss-enabled.ss-mode-flip:not(.ss-revealing):not(.ss-video-paused) {
  rotate: 180deg !important;
}

.ss-caption-root.ss-enabled.ss-mode-hide:not(.ss-revealing):not(.ss-video-paused),
.ss-caption-root.ss-enabled.ss-mode-pause-only:not(.ss-revealing):not(.ss-video-paused),
.ss-caption-root.ss-enabled.ss-mode-delay:not(.ss-revealing):not(.ss-video-paused):not(.ss-delay-ready) {
  opacity: 0 !important;
  visibility: hidden !important;
}

.ss-caption-root.ss-hover-reveal:hover,
.ss-caption-root.ss-revealing,
.ss-caption-root.ss-video-paused {
  filter: none !important;
  opacity: 1 !important;
  rotate: none !important;
  visibility: visible !important;
}

.ss-panel-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999999;
}

.ss-panel {
  position: fixed;
  top: 72px;
  right: 16px;
  width: min(372px, calc(100vw - 32px));
  max-height: calc(100vh - 96px);
  overflow: auto;
  box-sizing: border-box;
  pointer-events: auto;
  color: oklch(22% 0.012 245);
  background: oklch(98% 0.006 245);
  border: 1px solid oklch(86% 0.018 245);
  border-radius: 8px;
  box-shadow: 0 18px 48px oklch(22% 0.012 245 / 18%);
  font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}

.ss-panel,
.ss-panel * {
  box-sizing: border-box;
}

.ss-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid oklch(90% 0.012 245);
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.ss-panel--dragging .ss-panel__header {
  cursor: grabbing;
}

.ss-panel__title {
  margin: 0;
  color: oklch(20% 0.016 245);
  font-size: 15px;
  font-weight: 650;
  line-height: 1.2;
}

.ss-panel__actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.ss-panel__icon-button {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: oklch(38% 0.018 245);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
}

.ss-panel__icon-button:hover {
  background: oklch(94% 0.01 245);
  border-color: oklch(88% 0.014 245);
}

.ss-panel__close:focus-visible,
.ss-panel button:focus-visible,
.ss-panel input:focus-visible,
.ss-panel select:focus-visible {
  outline: 2px solid oklch(56% 0.14 230);
  outline-offset: 2px;
}

.ss-panel__body {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.ss-panel__section {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.ss-panel__legend {
  margin: 0 0 8px;
  padding: 0;
  color: oklch(40% 0.018 245);
  font-size: 12px;
  font-weight: 650;
}

.ss-panel__stack {
  display: grid;
  gap: 10px;
}

.ss-panel__row,
.ss-panel__check {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ss-panel__label {
  color: oklch(24% 0.014 245);
  font-size: 13px;
  font-weight: 520;
}

.ss-panel__check {
  justify-content: flex-start;
}

.ss-panel__check input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: oklch(56% 0.14 230);
}

.ss-panel select,
.ss-panel input[type="number"] {
  min-width: 132px;
  min-height: 32px;
  padding: 5px 8px;
  color: oklch(22% 0.012 245);
  background: oklch(100% 0.003 245);
  border: 1px solid oklch(82% 0.018 245);
  border-radius: 6px;
  font: inherit;
}

.ss-panel input[type="range"] {
  width: 136px;
  accent-color: oklch(56% 0.14 230);
}

.ss-panel__number {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ss-panel__number input[type="number"] {
  min-width: 84px;
  width: 84px;
}

.ss-panel__unit {
  min-width: 32px;
  color: oklch(46% 0.016 245);
  font-size: 12px;
}

.ss-panel__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 14px 14px;
  border-top: 1px solid oklch(90% 0.012 245);
}

.ss-panel__button {
  min-height: 32px;
  padding: 5px 11px;
  color: oklch(22% 0.012 245);
  background: oklch(100% 0.003 245);
  border: 1px solid oklch(82% 0.018 245);
  border-radius: 6px;
  font: inherit;
  font-weight: 560;
  cursor: pointer;
}

.ss-panel__button:hover {
  background: oklch(94% 0.01 245);
}

.ss-panel__button--primary {
  color: oklch(99% 0.004 245);
  background: oklch(48% 0.14 230);
  border-color: oklch(48% 0.14 230);
}

.ss-panel__button--primary:hover {
  background: oklch(43% 0.14 230);
}

.ss-panel-ball {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: inline-grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  pointer-events: auto;
  color: oklch(99% 0.004 245);
  background: oklch(48% 0.14 230);
  border: 1px solid oklch(58% 0.13 230);
  border-radius: 999px;
  box-shadow: 0 14px 34px oklch(22% 0.012 245 / 22%);
  font: 700 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  letter-spacing: 0;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.ss-panel-ball:hover {
  background: oklch(43% 0.14 230);
}

.ss-panel-ball:focus-visible {
  outline: 2px solid oklch(56% 0.14 230);
  outline-offset: 3px;
}

.ss-panel-ball--dragging {
  cursor: grabbing;
}

@media (max-width: 520px) {
  .ss-panel {
    top: 12px;
    right: 12px;
    width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
  }

  .ss-panel__row {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
}
`

export function injectStyles(documentRef = document): void {
  if (documentRef.getElementById(STYLE_ID)) {
    return
  }

  const style = documentRef.createElement('style')
  style.id = STYLE_ID
  style.textContent = stylesheet
  documentRef.head.append(style)
}
