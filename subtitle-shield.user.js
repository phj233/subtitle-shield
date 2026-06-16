// ==UserScript==
// @name         Subtitle Shield
// @name:en      Subtitle Shield
// @name:zh-CN   Subtitle Shield
// @namespace    https://github.com/phj233/subtitle-shield
// @version      0.2.0
// @description  Hide, blur, or flip YouTube and Bilibili captions so language learners listen first.
// @description:en Hide, blur, or flip YouTube and Bilibili captions so language learners listen first.
// @description:zh-CN 为 YouTube 和 Bilibili 字幕增加模糊、倒置、隐藏、延迟和暂停显示模式，帮助语言学习者先听再看。
// @license      MIT
// @homepageURL  https://github.com/phj233/subtitle-shield
// @supportURL   https://github.com/phj233/subtitle-shield/issues
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==
(function() {
	//#region src/core/i18n.ts
	var messages = {
		"en-US": {
			menuOpenSettings: "Open Subtitle Shield",
			panelTitle: "Subtitle Shield",
			closePanel: "Close",
			minimizePanel: "Minimize",
			restorePanel: "Restore settings",
			sectionGeneral: "General",
			sectionSites: "Sites",
			sectionTuning: "Tuning",
			enabled: "Enabled",
			language: "Language",
			languageAuto: "Auto",
			languageZh: "Chinese",
			languageEn: "English",
			mode: "Caption mode",
			modeBlur: "Blur",
			modeFlip: "Flip + blur",
			modeHide: "Hide",
			modePauseOnly: "Pause only",
			modeDelay: "Delay",
			revealShortcut: "Hold shortcut",
			shortcutAlt: "Alt",
			shortcutShift: "Shift",
			shortcutControl: "Control",
			shortcutMeta: "Command / Windows",
			revealOnHover: "Reveal on hover",
			showOnPause: "Reveal while paused",
			youtubeEnabled: "YouTube",
			bilibiliEnabled: "Bilibili",
			blurPx: "Blur strength",
			delayMs: "Delay",
			captionOffsetYPx: "Vertical position",
			unitPx: "px",
			unitMs: "ms",
			reset: "Reset",
			done: "Done"
		},
		"zh-CN": {
			menuOpenSettings: "打开 Subtitle Shield",
			panelTitle: "Subtitle Shield",
			closePanel: "关闭",
			minimizePanel: "最小化",
			restorePanel: "还原设置",
			sectionGeneral: "通用",
			sectionSites: "站点",
			sectionTuning: "调节",
			enabled: "启用",
			language: "语言",
			languageAuto: "自动",
			languageZh: "中文",
			languageEn: "英文",
			mode: "字幕模式",
			modeBlur: "模糊",
			modeFlip: "倒置 + 模糊",
			modeHide: "隐藏",
			modePauseOnly: "仅暂停",
			modeDelay: "延迟",
			revealShortcut: "按住快捷键",
			shortcutAlt: "Alt",
			shortcutShift: "Shift",
			shortcutControl: "Control",
			shortcutMeta: "Command / Windows",
			revealOnHover: "悬停显示",
			showOnPause: "暂停时显示",
			youtubeEnabled: "YouTube",
			bilibiliEnabled: "Bilibili",
			blurPx: "模糊强度",
			delayMs: "延迟时间",
			captionOffsetYPx: "字幕垂直位置",
			unitPx: "像素",
			unitMs: "毫秒",
			reset: "重置",
			done: "完成"
		}
	};
	function createTranslator(languagePreference, navigatorLanguage = globalThis.navigator?.language) {
		const language = resolveLanguage(languagePreference, navigatorLanguage);
		return {
			language,
			t: (key) => readMessage(language, key) ?? readMessage("en-US", key) ?? key
		};
	}
	function resolveLanguage(languagePreference, navigatorLanguage = "") {
		if (languagePreference !== "auto") return languagePreference;
		return navigatorLanguage.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
	}
	function readMessage(language, key) {
		return messages[language][key];
	}
	//#endregion
	//#region src/core/types.ts
	var CAPTION_MODES = [
		"blur",
		"flip",
		"hide",
		"pauseOnly",
		"delay"
	];
	var LANGUAGE_PREFERENCES = [
		"auto",
		"zh-CN",
		"en-US"
	];
	var REVEAL_SHORTCUTS = [
		"Alt",
		"Shift",
		"Control",
		"Meta"
	];
	var SITE_NAMES = ["youtube", "bilibili"];
	//#endregion
	//#region src/core/settings.ts
	var SETTINGS_STORAGE_KEY = "subtitleShield.settings.v1";
	var DEFAULT_SETTINGS = {
		schemaVersion: 1,
		enabled: true,
		language: "auto",
		mode: "blur",
		blurPx: 6,
		delayMs: 2e3,
		captionOffsetYPx: 0,
		revealShortcut: "Alt",
		revealOnHover: false,
		showOnPause: true,
		sites: {
			youtube: true,
			bilibili: true
		}
	};
	function createSettingsStore(storage) {
		let current = DEFAULT_SETTINGS;
		const listeners = /* @__PURE__ */ new Set();
		const emit = () => {
			for (const listener of listeners) listener(current);
		};
		const persist = async (settings) => {
			current = normalizeSettings(settings);
			await storage.set(SETTINGS_STORAGE_KEY, current);
			emit();
			return current;
		};
		return {
			get: () => current,
			load: async () => {
				current = normalizeSettings(await storage.get(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS));
				await storage.set(SETTINGS_STORAGE_KEY, current);
				emit();
				return current;
			},
			reset: () => persist(DEFAULT_SETTINGS),
			set: persist,
			update: (patch) => persist(mergeSettings(current, patch)),
			subscribe: (listener) => {
				listeners.add(listener);
				return () => listeners.delete(listener);
			}
		};
	}
	function mergeSettings(settings, patch) {
		return normalizeSettings({
			...settings,
			...patch,
			sites: {
				...settings.sites,
				...patch.sites
			}
		});
	}
	function normalizeSettings(value) {
		const input = isRecord(value) ? value : {};
		const sitesInput = isRecord(input.sites) ? input.sites : {};
		return {
			schemaVersion: 1,
			enabled: pickBoolean(input.enabled, DEFAULT_SETTINGS.enabled),
			language: pickOption(input.language, LANGUAGE_PREFERENCES, DEFAULT_SETTINGS.language),
			mode: pickOption(input.mode, CAPTION_MODES, DEFAULT_SETTINGS.mode),
			blurPx: clampNumber(input.blurPx, 0, 20, DEFAULT_SETTINGS.blurPx),
			delayMs: clampNumber(input.delayMs, 0, 1e4, DEFAULT_SETTINGS.delayMs),
			captionOffsetYPx: clampNumber(input.captionOffsetYPx, -120, 120, DEFAULT_SETTINGS.captionOffsetYPx),
			revealShortcut: pickOption(input.revealShortcut, REVEAL_SHORTCUTS, DEFAULT_SETTINGS.revealShortcut),
			revealOnHover: pickBoolean(input.revealOnHover, DEFAULT_SETTINGS.revealOnHover),
			showOnPause: pickBoolean(input.showOnPause, DEFAULT_SETTINGS.showOnPause),
			sites: SITE_NAMES.reduce((result, site) => {
				result[site] = pickBoolean(sitesInput[site], DEFAULT_SETTINGS.sites[site]);
				return result;
			}, {})
		};
	}
	function isRecord(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}
	function pickBoolean(value, fallback) {
		return typeof value === "boolean" ? value : fallback;
	}
	function pickOption(value, options, fallback) {
		return typeof value === "string" && options.includes(value) ? value : fallback;
	}
	function clampNumber(value, min, max, fallback) {
		if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
		return Math.min(max, Math.max(min, Math.round(value)));
	}
	//#endregion
	//#region src/core/shortcuts.ts
	function createShortcutController({ getSettings, onRevealChange }) {
		let activeShortcut = null;
		let settings = getSettings();
		const setRevealing = (revealing) => {
			onRevealChange(revealing);
		};
		const reset = () => {
			if (activeShortcut === null) return;
			activeShortcut = null;
			setRevealing(false);
		};
		const handleKeyDown = (event) => {
			if (event.repeat || isEditableTarget(event.target)) return;
			const shortcut = settings.revealShortcut;
			if (event.key === shortcut) {
				activeShortcut = shortcut;
				setRevealing(true);
			}
		};
		const handleKeyUp = (event) => {
			if (activeShortcut !== null && event.key === activeShortcut) reset();
		};
		const handleVisibilityChange = () => {
			if (document.visibilityState !== "visible") reset();
		};
		window.addEventListener("keydown", handleKeyDown, true);
		window.addEventListener("keyup", handleKeyUp, true);
		window.addEventListener("blur", reset);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return {
			setSettings: (nextSettings) => {
				if (settings.revealShortcut !== nextSettings.revealShortcut) reset();
				settings = nextSettings;
			},
			destroy: () => {
				reset();
				window.removeEventListener("keydown", handleKeyDown, true);
				window.removeEventListener("keyup", handleKeyUp, true);
				window.removeEventListener("blur", reset);
				document.removeEventListener("visibilitychange", handleVisibilityChange);
			}
		};
	}
	function isEditableTarget(target) {
		if (!(target instanceof HTMLElement)) return false;
		return target.isContentEditable || target.matches("input, textarea, select, [contenteditable=\"true\"]");
	}
	//#endregion
	//#region src/core/styles.ts
	var STYLE_ID = "subtitle-shield-style";
	var SUBTITLE_SHIELD_STYLESHEET = `
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
  filter: blur(var(--ss-blur-px)) !important;
  opacity: 0.82 !important;
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
`;
	function injectStyles(documentRef = document) {
		if (documentRef.getElementById("subtitle-shield-style")) return;
		const style = documentRef.createElement("style");
		style.id = STYLE_ID;
		style.textContent = SUBTITLE_SHIELD_STYLESHEET;
		documentRef.head.append(style);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.133.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.133.0/helpers/esm/toPrimitive.js
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.133.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.133.0/helpers/esm/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	//#endregion
	//#region src/core/subtitle-engine.ts
	var MODE_CLASSES = [
		"ss-mode-blur",
		"ss-mode-flip",
		"ss-mode-hide",
		"ss-mode-pause-only",
		"ss-mode-delay"
	];
	var ROOT_CLASSES = [
		"ss-caption-root",
		"ss-enabled",
		"ss-revealing",
		"ss-video-paused",
		"ss-delay-ready",
		"ss-hover-reveal",
		...MODE_CLASSES
	];
	var SubtitleEngine = class {
		constructor(settings = DEFAULT_SETTINGS) {
			_defineProperty(this, "settings", DEFAULT_SETTINGS);
			_defineProperty(this, "snapshot", null);
			_defineProperty(this, "targets", /* @__PURE__ */ new Set());
			_defineProperty(this, "delayStates", /* @__PURE__ */ new Map());
			_defineProperty(this, "revealing", false);
			_defineProperty(this, "video", null);
			_defineProperty(this, "handleVideoStateChange", () => {
				this.apply();
			});
			this.settings = settings;
		}
		setSettings(settings) {
			this.settings = settings;
			this.apply();
		}
		setSnapshot(snapshot) {
			this.snapshot = snapshot;
			this.setVideo(snapshot.video);
			this.replaceTargets(snapshot.captionContainers);
			this.apply();
		}
		setRevealing(revealing) {
			if (this.revealing === revealing) return;
			this.revealing = revealing;
			this.apply();
		}
		destroy() {
			for (const target of this.targets) this.cleanTarget(target);
			this.targets.clear();
			this.setVideo(null);
		}
		replaceTargets(nextTargets) {
			const next = new Set(nextTargets);
			for (const target of this.targets) if (!next.has(target)) {
				this.cleanTarget(target);
				this.targets.delete(target);
			}
			for (const target of next) this.targets.add(target);
		}
		setVideo(video) {
			if (this.video === video) return;
			this.video?.removeEventListener("play", this.handleVideoStateChange);
			this.video?.removeEventListener("pause", this.handleVideoStateChange);
			this.video?.removeEventListener("ended", this.handleVideoStateChange);
			this.video = video;
			this.video?.addEventListener("play", this.handleVideoStateChange);
			this.video?.addEventListener("pause", this.handleVideoStateChange);
			this.video?.addEventListener("ended", this.handleVideoStateChange);
		}
		apply() {
			const snapshot = this.snapshot;
			const siteEnabled = snapshot ? this.settings.sites[snapshot.site] : false;
			const active = this.settings.enabled && siteEnabled;
			const isPausedReveal = Boolean(this.video?.paused) && (this.settings.showOnPause || this.settings.mode === "pauseOnly");
			for (const target of this.targets) {
				if (!active) {
					this.cleanTarget(target);
					continue;
				}
				target.classList.add("ss-caption-root", "ss-enabled");
				target.classList.remove(...MODE_CLASSES);
				target.classList.add(modeClassName(this.settings.mode));
				target.classList.toggle("ss-revealing", this.revealing);
				target.classList.toggle("ss-video-paused", isPausedReveal);
				target.classList.toggle("ss-hover-reveal", this.settings.revealOnHover);
				target.style.setProperty("--ss-blur-px", `${this.settings.blurPx}px`);
				target.style.setProperty("--ss-offset-y", `${this.settings.captionOffsetYPx}px`);
				this.updateDelayTracking(target, this.settings.mode === "delay");
			}
		}
		updateDelayTracking(target, shouldTrack) {
			if (!shouldTrack) {
				this.teardownDelay(target);
				target.classList.remove("ss-delay-ready");
				return;
			}
			if (this.delayStates.has(target)) {
				const state = this.delayStates.get(target);
				if (state && state.delayMs !== this.settings.delayMs) {
					state.delayMs = this.settings.delayMs;
					this.restartDelay(target);
				}
				return;
			}
			const observer = new MutationObserver(() => this.restartDelay(target));
			observer.observe(target, {
				childList: true,
				characterData: true,
				subtree: true
			});
			this.delayStates.set(target, {
				observer,
				timer: null,
				delayMs: this.settings.delayMs
			});
			this.restartDelay(target);
		}
		restartDelay(target) {
			const state = this.delayStates.get(target);
			if (!state) return;
			if (state.timer !== null) {
				window.clearTimeout(state.timer);
				state.timer = null;
			}
			target.classList.remove("ss-delay-ready");
			if (!target.textContent?.trim() || this.settings.delayMs <= 0) {
				target.classList.add("ss-delay-ready");
				return;
			}
			state.timer = window.setTimeout(() => {
				target.classList.add("ss-delay-ready");
				state.timer = null;
			}, this.settings.delayMs);
		}
		teardownDelay(target) {
			const state = this.delayStates.get(target);
			if (!state) return;
			if (state.timer !== null) window.clearTimeout(state.timer);
			state.observer.disconnect();
			this.delayStates.delete(target);
		}
		cleanTarget(target) {
			this.teardownDelay(target);
			target.classList.remove(...ROOT_CLASSES);
			target.style.removeProperty("--ss-blur-px");
			target.style.removeProperty("--ss-offset-y");
		}
	};
	function modeClassName(mode) {
		switch (mode) {
			case "blur": return "ss-mode-blur";
			case "flip": return "ss-mode-flip";
			case "hide": return "ss-mode-hide";
			case "pauseOnly": return "ss-mode-pause-only";
			case "delay": return "ss-mode-delay";
		}
	}
	//#endregion
	//#region src/sites/dom.ts
	function toHtmlElements(elements) {
		const result = [];
		for (const element of elements) if (element instanceof HTMLElement) result.push(element);
		return uniqueElements(result);
	}
	function uniqueElements(elements) {
		return [...new Set(elements)];
	}
	function queryHtmlElements(root, selectors) {
		return uniqueElements(selectors.flatMap((selector) => toHtmlElements(root.querySelectorAll(selector))));
	}
	//#endregion
	//#region src/sites/navigation.ts
	var listeners = /* @__PURE__ */ new Set();
	var installed = false;
	function watchNavigation(listener) {
		listeners.add(listener);
		installNavigationWatcher();
		return () => {
			listeners.delete(listener);
		};
	}
	function installNavigationWatcher() {
		if (installed) return;
		installed = true;
		const originalPushState = history.pushState;
		const originalReplaceState = history.replaceState;
		history.pushState = function pushState(...args) {
			const result = originalPushState.apply(this, args);
			queueNavigationEmit();
			return result;
		};
		history.replaceState = function replaceState(...args) {
			const result = originalReplaceState.apply(this, args);
			queueNavigationEmit();
			return result;
		};
		window.addEventListener("popstate", queueNavigationEmit);
		window.addEventListener("hashchange", queueNavigationEmit);
	}
	var queued = false;
	function queueNavigationEmit() {
		if (queued) return;
		queued = true;
		window.setTimeout(() => {
			queued = false;
			for (const listener of listeners) listener();
		}, 0);
	}
	//#endregion
	//#region src/sites/bilibili.ts
	var CAPTION_SELECTORS = [
		".bpx-player-subtitle-panel",
		".bpx-player-subtitle-wrap",
		".bpx-player-subtitle-item",
		".bilibili-player-video-subtitle",
		".bilibili-player-video-subtitle-panel"
	];
	var FALLBACK_BLOCKLIST = [
		"button",
		"control",
		"danmaku",
		"dm",
		"setting",
		"switch",
		"tooltip"
	];
	function createBilibiliAdapter() {
		return {
			site: "bilibili",
			matches: (location) => location.hostname === "www.bilibili.com" && (location.pathname.startsWith("/video/") || location.pathname.startsWith("/list/")),
			setup: (onSnapshot) => setupBilibiliAdapter(onSnapshot)
		};
	}
	function setupBilibiliAdapter(onSnapshot) {
		let animationFrame = 0;
		let observedRoot = null;
		const observer = new MutationObserver(() => scheduleRefresh());
		const scheduleRefresh = () => {
			if (animationFrame !== 0) return;
			animationFrame = window.requestAnimationFrame(() => {
				animationFrame = 0;
				refresh();
			});
		};
		const refresh = () => {
			const snapshot = getBilibiliSnapshot();
			onSnapshot(snapshot);
			const nextRoot = snapshot.player ?? document.querySelector("#app") ?? document.body;
			if (nextRoot !== observedRoot) {
				observer.disconnect();
				observer.observe(nextRoot, {
					childList: true,
					subtree: true,
					characterData: true
				});
				observedRoot = nextRoot;
			}
		};
		const unwatchNavigation = watchNavigation(scheduleRefresh);
		document.addEventListener("visibilitychange", scheduleRefresh);
		refresh();
		return {
			refresh,
			destroy: () => {
				if (animationFrame !== 0) window.cancelAnimationFrame(animationFrame);
				observer.disconnect();
				unwatchNavigation();
				document.removeEventListener("visibilitychange", scheduleRefresh);
			}
		};
	}
	function getBilibiliSnapshot() {
		const player = findBilibiliPlayer();
		const root = player ?? document;
		return {
			site: "bilibili",
			player,
			video: player?.querySelector("video") ?? document.querySelector("video"),
			captionContainers: findBilibiliCaptionContainers(root)
		};
	}
	function findBilibiliPlayer() {
		const video = document.querySelector("video");
		return document.querySelector(".bpx-player-container") ?? document.querySelector("#bilibili-player") ?? document.querySelector(".bilibili-player") ?? video?.closest("[class*=\"player\"]") ?? null;
	}
	function findBilibiliCaptionContainers(root) {
		const stableTargets = queryHtmlElements(root, CAPTION_SELECTORS);
		if (stableTargets.length > 0) return stableTargets;
		return uniqueElements(toHtmlElements(root.querySelectorAll("[class*=\"subtitle\"]")).filter(isLikelyCaptionElement));
	}
	function isLikelyCaptionElement(element) {
		const className = element.className.toString().toLowerCase();
		if (!className.includes("subtitle")) return false;
		return !FALLBACK_BLOCKLIST.some((blocked) => className.includes(blocked));
	}
	//#endregion
	//#region src/sites/youtube.ts
	function createYoutubeAdapter() {
		return {
			site: "youtube",
			matches: (location) => location.hostname === "youtube.com" || location.hostname.endsWith(".youtube.com"),
			setup: (onSnapshot) => setupYoutubeAdapter(onSnapshot)
		};
	}
	function setupYoutubeAdapter(onSnapshot) {
		let animationFrame = 0;
		let observedRoot = null;
		const observer = new MutationObserver(() => scheduleRefresh());
		const scheduleRefresh = () => {
			if (animationFrame !== 0) return;
			animationFrame = window.requestAnimationFrame(() => {
				animationFrame = 0;
				refresh();
			});
		};
		const refresh = () => {
			const snapshot = getYoutubeSnapshot();
			onSnapshot(snapshot);
			const nextRoot = snapshot.player ?? document.querySelector("ytd-app") ?? document.body;
			if (nextRoot !== observedRoot) {
				observer.disconnect();
				observer.observe(nextRoot, {
					childList: true,
					subtree: true,
					characterData: true
				});
				observedRoot = nextRoot;
			}
		};
		const unwatchNavigation = watchNavigation(scheduleRefresh);
		window.addEventListener("yt-navigate-finish", scheduleRefresh);
		document.addEventListener("visibilitychange", scheduleRefresh);
		refresh();
		return {
			refresh,
			destroy: () => {
				if (animationFrame !== 0) window.cancelAnimationFrame(animationFrame);
				observer.disconnect();
				unwatchNavigation();
				window.removeEventListener("yt-navigate-finish", scheduleRefresh);
				document.removeEventListener("visibilitychange", scheduleRefresh);
			}
		};
	}
	function getYoutubeSnapshot() {
		const player = findYoutubePlayer();
		const root = player ?? document;
		return {
			site: "youtube",
			player,
			video: player?.querySelector("video") ?? document.querySelector("video"),
			captionContainers: findYoutubeCaptionContainers(root)
		};
	}
	function findYoutubePlayer() {
		return document.querySelector(".html5-video-player") ?? document.querySelector("#movie_player") ?? document.querySelector("ytd-player");
	}
	function findYoutubeCaptionContainers(root) {
		const windows = queryHtmlElements(root, [".caption-window"]);
		if (windows.length > 0) return windows;
		const segments = queryHtmlElements(root, [".ytp-caption-window-container .ytp-caption-segment"]);
		if (segments.length > 0) return segments;
		return uniqueElements(toHtmlElements(root.querySelectorAll(".ytp-caption-window-container")).filter((element) => element.textContent?.trim()));
	}
	//#endregion
	//#region src/sites/index.ts
	function detectSiteAdapter(location = window.location) {
		return [createYoutubeAdapter(), createBilibiliAdapter()].find((adapter) => adapter.matches(location)) ?? null;
	}
	//#endregion
	//#region src/ui/settings-panel.ts
	function createSettingsPanel(store) {
		let layer = null;
		let renderedLanguage = "";
		let panelPosition = null;
		let ballPosition = null;
		let dragState = null;
		let minimized = false;
		const unsubscribe = store.subscribe((settings) => {
			if (layer && settings.language !== renderedLanguage) render();
		});
		const handleResize = () => {
			if (!layer) return;
			if (minimized && ballPosition) {
				const ball = layer.querySelector(".ss-panel-ball");
				if (ball) {
					ballPosition = clampElementPosition(ball, ballPosition.left, ballPosition.top);
					applyElementPosition(ball, ballPosition);
				}
			}
			if (!minimized && panelPosition) {
				const panel = layer.querySelector(".ss-panel");
				if (panel) {
					panelPosition = clampElementPosition(panel, panelPosition.left, panelPosition.top);
					applyElementPosition(panel, panelPosition);
				}
			}
		};
		const handleEscape = (event) => {
			if (event.key === "Escape") close();
		};
		const close = () => {
			endDrag();
			layer?.remove();
			layer = null;
			document.removeEventListener("keydown", handleEscape);
			window.removeEventListener("resize", handleResize);
		};
		const open = () => {
			if (layer) {
				if (minimized) {
					restorePanel();
					return;
				}
				layer.querySelector(".ss-panel__minimize")?.focus();
				return;
			}
			layer = document.createElement("div");
			layer.className = "ss-panel-layer";
			document.body.append(layer);
			document.addEventListener("keydown", handleEscape);
			window.addEventListener("resize", handleResize);
			render();
			layer.querySelector(".ss-panel__close")?.focus();
		};
		const render = () => {
			if (!layer) return;
			if (minimized) {
				renderBall();
				return;
			}
			const settings = store.get();
			const { t, language } = createTranslator(settings.language);
			renderedLanguage = settings.language;
			const panel = document.createElement("section");
			panel.className = "ss-panel";
			panel.setAttribute("role", "dialog");
			panel.setAttribute("aria-modal", "false");
			panel.setAttribute("aria-labelledby", "ss-panel-title");
			const title = document.createElement("h2");
			title.id = "ss-panel-title";
			title.className = "ss-panel__title";
			title.textContent = t("panelTitle");
			const closeButton = document.createElement("button");
			closeButton.className = "ss-panel__icon-button ss-panel__close";
			closeButton.type = "button";
			closeButton.textContent = "×";
			closeButton.setAttribute("aria-label", t("closePanel"));
			closeButton.addEventListener("click", close);
			const minimizeButton = document.createElement("button");
			minimizeButton.className = "ss-panel__icon-button ss-panel__minimize";
			minimizeButton.type = "button";
			minimizeButton.textContent = "–";
			minimizeButton.setAttribute("aria-label", t("minimizePanel"));
			minimizeButton.addEventListener("click", minimizePanel);
			const actions = document.createElement("div");
			actions.className = "ss-panel__actions";
			actions.append(minimizeButton, closeButton);
			const header = document.createElement("header");
			header.className = "ss-panel__header";
			header.addEventListener("pointerdown", (event) => startDrag(event, panel));
			header.append(title, actions);
			const body = document.createElement("div");
			body.className = "ss-panel__body";
			body.append(createSection(t("sectionGeneral"), [
				createCheckbox(t("enabled"), settings.enabled, (checked) => store.update({ enabled: checked })),
				createSelect(t("language"), settings.language, LANGUAGE_PREFERENCES, (value) => languageLabel(value, t), (value) => store.update({ language: value })),
				createSelect(t("mode"), settings.mode, CAPTION_MODES, (value) => modeLabel(value, t), (value) => store.update({ mode: value })),
				createSelect(t("revealShortcut"), settings.revealShortcut, REVEAL_SHORTCUTS, (value) => shortcutLabel(value, t), (value) => store.update({ revealShortcut: value })),
				createCheckbox(t("revealOnHover"), settings.revealOnHover, (checked) => store.update({ revealOnHover: checked })),
				createCheckbox(t("showOnPause"), settings.showOnPause, (checked) => store.update({ showOnPause: checked }))
			]), createSection(t("sectionSites"), [createCheckbox(t("youtubeEnabled"), settings.sites.youtube, (checked) => updateSite("youtube", checked)), createCheckbox(t("bilibiliEnabled"), settings.sites.bilibili, (checked) => updateSite("bilibili", checked))]), createSection(t("sectionTuning"), [
				createRangeNumberRow({
					label: t("blurPx"),
					unit: t("unitPx"),
					value: settings.blurPx,
					min: 0,
					max: 20,
					step: 1,
					onValue: (value) => store.update({ blurPx: value })
				}),
				createNumberRow({
					label: t("delayMs"),
					unit: t("unitMs"),
					value: settings.delayMs,
					min: 0,
					max: 1e4,
					step: 100,
					onValue: (value) => store.update({ delayMs: value })
				}),
				createRangeNumberRow({
					label: t("captionOffsetYPx"),
					unit: t("unitPx"),
					value: settings.captionOffsetYPx,
					min: -120,
					max: 120,
					step: 1,
					onValue: (value) => store.update({ captionOffsetYPx: value })
				})
			]));
			const resetButton = document.createElement("button");
			resetButton.className = "ss-panel__button";
			resetButton.type = "button";
			resetButton.textContent = t("reset");
			resetButton.addEventListener("click", () => {
				store.reset().then(render);
			});
			const doneButton = document.createElement("button");
			doneButton.className = "ss-panel__button ss-panel__button--primary";
			doneButton.type = "button";
			doneButton.textContent = t("done");
			doneButton.addEventListener("click", close);
			const footer = document.createElement("footer");
			footer.className = "ss-panel__footer";
			footer.append(resetButton, doneButton);
			panel.lang = language;
			panel.append(header, body, footer);
			if (panelPosition) applyElementPosition(panel, panelPosition);
			layer.replaceChildren(panel);
		};
		const renderBall = () => {
			if (!layer) return;
			const { t, language } = createTranslator(store.get().language);
			renderedLanguage = store.get().language;
			const ball = document.createElement("button");
			ball.className = "ss-panel-ball";
			ball.type = "button";
			ball.textContent = "SS";
			ball.lang = language;
			ball.setAttribute("aria-label", t("restorePanel"));
			ball.addEventListener("pointerdown", (event) => startDrag(event, ball));
			ball.addEventListener("click", (event) => {
				if (event.detail === 0) restorePanel();
			});
			if (!ballPosition) ballPosition = getDefaultBallPosition();
			applyElementPosition(ball, ballPosition);
			layer.replaceChildren(ball);
			ball.focus();
		};
		const minimizePanel = () => {
			if (!layer) return;
			const panel = layer.querySelector(".ss-panel");
			if (panel) {
				const rect = panel.getBoundingClientRect();
				panelPosition = {
					left: rect.left,
					top: rect.top
				};
				if (!ballPosition) ballPosition = clampElementPosition(getVirtualBallElement(), rect.right - FLOATING_BALL_SIZE, rect.top);
			}
			minimized = true;
			render();
		};
		const restorePanel = () => {
			minimized = false;
			render();
			layer?.querySelector(".ss-panel__minimize")?.focus();
		};
		const startDrag = (event, element) => {
			const isBall = element.classList.contains("ss-panel-ball");
			if (event.button !== 0 || !isBall && isInteractiveTarget(event.target)) return;
			const rect = element.getBoundingClientRect();
			dragState = {
				element,
				kind: element.classList.contains("ss-panel-ball") ? "ball" : "panel",
				pointerId: event.pointerId,
				offsetX: event.clientX - rect.left,
				offsetY: event.clientY - rect.top,
				startX: event.clientX,
				startY: event.clientY,
				didMove: false
			};
			element.classList.add(dragState.kind === "ball" ? "ss-panel-ball--dragging" : "ss-panel--dragging");
			element.setPointerCapture(event.pointerId);
			element.addEventListener("pointermove", handleDragMove);
			element.addEventListener("pointerup", handleDragEnd);
			element.addEventListener("pointercancel", handleDragEnd);
			event.preventDefault();
		};
		const handleDragMove = (event) => {
			if (!dragState || event.pointerId !== dragState.pointerId) return;
			dragState.didMove = dragState.didMove || Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) > 4;
			const nextPosition = clampElementPosition(dragState.element, event.clientX - dragState.offsetX, event.clientY - dragState.offsetY);
			if (dragState.kind === "ball") ballPosition = nextPosition;
			else panelPosition = nextPosition;
			applyElementPosition(dragState.element, nextPosition);
		};
		const handleDragEnd = (event) => {
			if (!dragState || event.pointerId !== dragState.pointerId) return;
			const shouldRestoreBall = dragState.kind === "ball" && !dragState.didMove && event.type === "pointerup";
			endDrag();
			if (shouldRestoreBall) restorePanel();
		};
		const endDrag = () => {
			if (!dragState) return;
			const { element, kind, pointerId } = dragState;
			element.classList.remove(kind === "ball" ? "ss-panel-ball--dragging" : "ss-panel--dragging");
			element.removeEventListener("pointermove", handleDragMove);
			element.removeEventListener("pointerup", handleDragEnd);
			element.removeEventListener("pointercancel", handleDragEnd);
			try {
				element.releasePointerCapture(pointerId);
			} catch {}
			dragState = null;
		};
		const updateSite = (site, enabled) => store.update({ sites: { [site]: enabled } });
		return {
			open,
			close,
			destroy: () => {
				close();
				unsubscribe();
			}
		};
	}
	var FLOATING_BALL_SIZE = 48;
	function applyElementPosition(element, position) {
		element.style.left = `${position.left}px`;
		element.style.top = `${position.top}px`;
		element.style.right = "auto";
		element.style.bottom = "auto";
	}
	function clampElementPosition(element, left, top) {
		const margin = 8;
		const width = element.offsetWidth || FLOATING_BALL_SIZE;
		const height = element.offsetHeight || FLOATING_BALL_SIZE;
		const maxLeft = Math.max(margin, window.innerWidth - width - margin);
		const maxTop = Math.max(margin, window.innerHeight - height - margin);
		return {
			left: Math.min(maxLeft, Math.max(margin, left)),
			top: Math.min(maxTop, Math.max(margin, top))
		};
	}
	function getDefaultBallPosition() {
		const margin = 16;
		return {
			left: Math.max(8, window.innerWidth - FLOATING_BALL_SIZE - margin),
			top: Math.max(8, window.innerHeight - FLOATING_BALL_SIZE - margin)
		};
	}
	function getVirtualBallElement() {
		const element = document.createElement("div");
		element.style.width = `${FLOATING_BALL_SIZE}px`;
		element.style.height = `${FLOATING_BALL_SIZE}px`;
		return element;
	}
	function isInteractiveTarget(target) {
		return target instanceof HTMLElement && Boolean(target.closest("button, input, select, textarea, a"));
	}
	function createSection(label, rows) {
		const section = document.createElement("fieldset");
		section.className = "ss-panel__section";
		const legend = document.createElement("legend");
		legend.className = "ss-panel__legend";
		legend.textContent = label;
		const stack = document.createElement("div");
		stack.className = "ss-panel__stack";
		stack.append(...rows);
		section.append(legend, stack);
		return section;
	}
	function createCheckbox(label, checked, onChange) {
		const row = document.createElement("label");
		row.className = "ss-panel__check";
		const input = document.createElement("input");
		input.type = "checkbox";
		input.checked = checked;
		input.addEventListener("change", () => {
			onChange(input.checked);
		});
		const text = document.createElement("span");
		text.className = "ss-panel__label";
		text.textContent = label;
		row.append(input, text);
		return row;
	}
	function createSelect(label, value, options, labelFor, onChange) {
		const row = document.createElement("label");
		row.className = "ss-panel__row";
		const text = document.createElement("span");
		text.className = "ss-panel__label";
		text.textContent = label;
		const select = document.createElement("select");
		for (const optionValue of options) {
			const option = document.createElement("option");
			option.value = optionValue;
			option.textContent = labelFor(optionValue);
			select.append(option);
		}
		select.value = value;
		select.addEventListener("change", () => {
			onChange(select.value);
		});
		row.append(text, select);
		return row;
	}
	function createRangeNumberRow(options) {
		const row = document.createElement("label");
		row.className = "ss-panel__row";
		const text = document.createElement("span");
		text.className = "ss-panel__label";
		text.textContent = options.label;
		const range = document.createElement("input");
		range.type = "range";
		range.min = String(options.min);
		range.max = String(options.max);
		range.step = String(options.step);
		range.value = String(options.value);
		const numberWrap = createNumberInput(options);
		const number = numberWrap.querySelector("input");
		range.addEventListener("input", () => {
			if (number) number.value = range.value;
			options.onValue(Number(range.value));
		});
		const controls = document.createElement("div");
		controls.className = "ss-panel__number";
		controls.append(range, numberWrap);
		row.append(text, controls);
		return row;
	}
	function createNumberRow(options) {
		const row = document.createElement("label");
		row.className = "ss-panel__row";
		const text = document.createElement("span");
		text.className = "ss-panel__label";
		text.textContent = options.label;
		row.append(text, createNumberInput(options));
		return row;
	}
	function createNumberInput(options) {
		const wrap = document.createElement("span");
		wrap.className = "ss-panel__number";
		const input = document.createElement("input");
		input.type = "number";
		input.min = String(options.min);
		input.max = String(options.max);
		input.step = String(options.step);
		input.value = String(options.value);
		input.addEventListener("change", () => {
			options.onValue(Number(input.value));
		});
		const unit = document.createElement("span");
		unit.className = "ss-panel__unit";
		unit.textContent = options.unit;
		wrap.append(input, unit);
		return wrap;
	}
	function languageLabel(value, t) {
		switch (value) {
			case "auto": return t("languageAuto");
			case "zh-CN": return t("languageZh");
			case "en-US": return t("languageEn");
		}
	}
	function modeLabel(value, t) {
		switch (value) {
			case "blur": return t("modeBlur");
			case "flip": return t("modeFlip");
			case "hide": return t("modeHide");
			case "pauseOnly": return t("modePauseOnly");
			case "delay": return t("modeDelay");
		}
	}
	function shortcutLabel(value, t) {
		switch (value) {
			case "Alt": return t("shortcutAlt");
			case "Shift": return t("shortcutShift");
			case "Control": return t("shortcutControl");
			case "Meta": return t("shortcutMeta");
		}
	}
	//#endregion
	//#region src/app/bootstrap.ts
	async function bootstrapSubtitleShield({ storage, adapter, registerMenuCommand }) {
		injectStyles();
		const store = createSettingsStore(storage);
		await store.load();
		const panel = createSettingsPanel(store);
		const engine = new SubtitleEngine(store.get());
		const shortcut = createShortcutController({
			getSettings: store.get,
			onRevealChange: (revealing) => engine.setRevealing(revealing)
		});
		let adapterHandle = null;
		const activeAdapter = adapter ?? detectSiteAdapter();
		if (activeAdapter) adapterHandle = activeAdapter.setup((snapshot) => engine.setSnapshot(snapshot));
		const unsubscribeSettings = store.subscribe((settings) => {
			engine.setSettings(settings);
			shortcut.setSettings(settings);
		});
		const { t } = createTranslator(store.get().language);
		registerMenuCommand?.(t("menuOpenSettings"), panel.open);
		return {
			openSettings: panel.open,
			destroy: () => {
				unsubscribeSettings();
				adapterHandle?.destroy();
				shortcut.destroy();
				engine.destroy();
				panel.destroy();
			}
		};
	}
	//#endregion
	//#region src/userscript/gm-storage.ts
	function createGmStorage(keyPrefix = "") {
		const keyFor = (key) => `${keyPrefix}${key}`;
		return {
			get: async (key, fallback) => {
				const storageKey = keyFor(key);
				if (typeof GM_getValue === "function") return Promise.resolve(GM_getValue(storageKey, fallback));
				const raw = localStorage.getItem(storageKey);
				if (raw === null) return fallback;
				try {
					return JSON.parse(raw);
				} catch {
					return fallback;
				}
			},
			set: async (key, value) => {
				const storageKey = keyFor(key);
				if (typeof GM_setValue === "function") {
					await Promise.resolve(GM_setValue(storageKey, value));
					return;
				}
				localStorage.setItem(storageKey, JSON.stringify(value));
			}
		};
	}
	//#endregion
	//#region src/userscript/menu.ts
	function registerUserscriptMenuCommand(label, callback) {
		if (typeof GM_registerMenuCommand === "function") GM_registerMenuCommand(label, callback);
	}
	//#endregion
	//#region src/main.ts
	bootstrapSubtitleShield({
		storage: createGmStorage(),
		registerMenuCommand: registerUserscriptMenuCommand
	}).then((app) => {});
	//#endregion
})();
