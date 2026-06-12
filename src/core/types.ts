export type CaptionMode = 'blur' | 'flip' | 'hide' | 'pauseOnly' | 'delay'
export type LanguagePreference = 'auto' | 'zh-CN' | 'en-US'
export type SupportedLanguage = Exclude<LanguagePreference, 'auto'>
export type RevealShortcut = 'Alt' | 'Shift' | 'Control' | 'Meta'
export type SiteName = 'youtube' | 'bilibili'

export interface SubtitleShieldSettings {
  schemaVersion: 1
  enabled: boolean
  language: LanguagePreference
  mode: CaptionMode
  blurPx: number
  delayMs: number
  captionOffsetYPx: number
  revealShortcut: RevealShortcut
  revealOnHover: boolean
  showOnPause: boolean
  sites: Record<SiteName, boolean>
}

export type SettingsPatch = Partial<Omit<SubtitleShieldSettings, 'sites'>> & {
  sites?: Partial<Record<SiteName, boolean>>
}

export const CAPTION_MODES: readonly CaptionMode[] = [
  'blur',
  'flip',
  'hide',
  'pauseOnly',
  'delay',
]

export const LANGUAGE_PREFERENCES: readonly LanguagePreference[] = ['auto', 'zh-CN', 'en-US']
export const REVEAL_SHORTCUTS: readonly RevealShortcut[] = ['Alt', 'Shift', 'Control', 'Meta']
export const SITE_NAMES: readonly SiteName[] = ['youtube', 'bilibili']
