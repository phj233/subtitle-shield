import type { LanguagePreference, SupportedLanguage } from './types'

const messages = {
  'en-US': {
    menuOpenSettings: 'Open Subtitle Shield',
    panelTitle: 'Subtitle Shield',
    closePanel: 'Close',
    minimizePanel: 'Minimize',
    restorePanel: 'Restore settings',
    sectionGeneral: 'General',
    sectionSites: 'Sites',
    sectionTuning: 'Tuning',
    enabled: 'Enabled',
    language: 'Language',
    languageAuto: 'Auto',
    languageZh: 'Chinese',
    languageEn: 'English',
    mode: 'Caption mode',
    modeBlur: 'Blur',
    modeFlip: 'Flip',
    modeHide: 'Hide',
    modePauseOnly: 'Pause only',
    modeDelay: 'Delay',
    revealShortcut: 'Hold shortcut',
    shortcutAlt: 'Alt',
    shortcutShift: 'Shift',
    shortcutControl: 'Control',
    shortcutMeta: 'Command / Windows',
    revealOnHover: 'Reveal on hover',
    showOnPause: 'Reveal while paused',
    youtubeEnabled: 'YouTube',
    bilibiliEnabled: 'Bilibili',
    blurPx: 'Blur strength',
    delayMs: 'Delay',
    captionOffsetYPx: 'Vertical position',
    unitPx: 'px',
    unitMs: 'ms',
    reset: 'Reset',
    done: 'Done',
  },
  'zh-CN': {
    menuOpenSettings: '打开 Subtitle Shield',
    panelTitle: 'Subtitle Shield',
    closePanel: '关闭',
    minimizePanel: '最小化',
    restorePanel: '还原设置',
    sectionGeneral: '通用',
    sectionSites: '站点',
    sectionTuning: '调节',
    enabled: '启用',
    language: '语言',
    languageAuto: '自动',
    languageZh: '中文',
    languageEn: '英文',
    mode: '字幕模式',
    modeBlur: '模糊',
    modeFlip: '倒置',
    modeHide: '隐藏',
    modePauseOnly: '仅暂停',
    modeDelay: '延迟',
    revealShortcut: '按住快捷键',
    shortcutAlt: 'Alt',
    shortcutShift: 'Shift',
    shortcutControl: 'Control',
    shortcutMeta: 'Command / Windows',
    revealOnHover: '悬停显示',
    showOnPause: '暂停时显示',
    youtubeEnabled: 'YouTube',
    bilibiliEnabled: 'Bilibili',
    blurPx: '模糊强度',
    delayMs: '延迟时间',
    captionOffsetYPx: '字幕垂直位置',
    unitPx: '像素',
    unitMs: '毫秒',
    reset: '重置',
    done: '完成',
  },
} as const

export type MessageKey = keyof (typeof messages)['en-US']

export interface Translator {
  language: SupportedLanguage
  t(key: string): string
}

export function createTranslator(
  languagePreference: LanguagePreference,
  navigatorLanguage = globalThis.navigator?.language,
): Translator {
  const language = resolveLanguage(languagePreference, navigatorLanguage)

  return {
    language,
    t: (key: string) =>
      readMessage(language, key) ?? readMessage('en-US', key) ?? key,
  }
}

export function resolveLanguage(
  languagePreference: LanguagePreference,
  navigatorLanguage = '',
): SupportedLanguage {
  if (languagePreference !== 'auto') {
    return languagePreference
  }

  return navigatorLanguage.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

function readMessage(language: SupportedLanguage, key: string): string | undefined {
  return messages[language][key as MessageKey]
}
