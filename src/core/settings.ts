import type { KeyValueStorage } from './storage'
import type {
  CaptionMode,
  LanguagePreference,
  RevealShortcut,
  SettingsPatch,
  SiteName,
  SubtitleShieldSettings,
} from './types'
import { CAPTION_MODES, LANGUAGE_PREFERENCES, REVEAL_SHORTCUTS, SITE_NAMES } from './types'

export const SETTINGS_STORAGE_KEY = 'subtitleShield.settings.v1'

export const DEFAULT_SETTINGS: SubtitleShieldSettings = {
  schemaVersion: 1,
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

export interface SettingsStore {
  get(): SubtitleShieldSettings
  load(): Promise<SubtitleShieldSettings>
  reset(): Promise<SubtitleShieldSettings>
  set(nextSettings: SubtitleShieldSettings): Promise<SubtitleShieldSettings>
  update(patch: SettingsPatch): Promise<SubtitleShieldSettings>
  subscribe(listener: SettingsListener): () => void
}

export type SettingsListener = (settings: SubtitleShieldSettings) => void

export function createSettingsStore(storage: KeyValueStorage): SettingsStore {
  let current = DEFAULT_SETTINGS
  const listeners = new Set<SettingsListener>()

  const emit = () => {
    for (const listener of listeners) {
      listener(current)
    }
  }

  const persist = async (settings: SubtitleShieldSettings) => {
    current = normalizeSettings(settings)
    await storage.set(SETTINGS_STORAGE_KEY, current)
    emit()
    return current
  }

  return {
    get: () => current,
    load: async () => {
      const stored = await storage.get<unknown>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS)
      current = normalizeSettings(stored)
      await storage.set(SETTINGS_STORAGE_KEY, current)
      emit()
      return current
    },
    reset: () => persist(DEFAULT_SETTINGS),
    set: persist,
    update: (patch: SettingsPatch) => persist(mergeSettings(current, patch)),
    subscribe: (listener: SettingsListener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export function mergeSettings(
  settings: SubtitleShieldSettings,
  patch: SettingsPatch,
): SubtitleShieldSettings {
  return normalizeSettings({
    ...settings,
    ...patch,
    sites: {
      ...settings.sites,
      ...patch.sites,
    },
  })
}

export function normalizeSettings(value: unknown): SubtitleShieldSettings {
  const input = isRecord(value) ? value : {}
  const sitesInput = isRecord(input.sites) ? input.sites : {}

  return {
    schemaVersion: 1,
    enabled: pickBoolean(input.enabled, DEFAULT_SETTINGS.enabled),
    language: pickOption(
      input.language,
      LANGUAGE_PREFERENCES,
      DEFAULT_SETTINGS.language,
    ) as LanguagePreference,
    mode: pickOption(input.mode, CAPTION_MODES, DEFAULT_SETTINGS.mode) as CaptionMode,
    blurPx: clampNumber(input.blurPx, 0, 20, DEFAULT_SETTINGS.blurPx),
    delayMs: clampNumber(input.delayMs, 0, 10000, DEFAULT_SETTINGS.delayMs),
    captionOffsetYPx: clampNumber(
      input.captionOffsetYPx,
      -120,
      120,
      DEFAULT_SETTINGS.captionOffsetYPx,
    ),
    revealShortcut: pickOption(
      input.revealShortcut,
      REVEAL_SHORTCUTS,
      DEFAULT_SETTINGS.revealShortcut,
    ) as RevealShortcut,
    revealOnHover: pickBoolean(input.revealOnHover, DEFAULT_SETTINGS.revealOnHover),
    showOnPause: pickBoolean(input.showOnPause, DEFAULT_SETTINGS.showOnPause),
    sites: SITE_NAMES.reduce(
      (result, site) => {
        result[site] = pickBoolean(sitesInput[site], DEFAULT_SETTINGS.sites[site])
        return result
      },
      {} as Record<SiteName, boolean>,
    ),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function pickOption<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Math.round(value)))
}
