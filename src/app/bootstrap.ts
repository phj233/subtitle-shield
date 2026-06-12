import { createTranslator } from '../core/i18n'
import { createSettingsStore } from '../core/settings'
import { createShortcutController } from '../core/shortcuts'
import type { KeyValueStorage } from '../core/storage'
import { injectStyles } from '../core/styles'
import { SubtitleEngine } from '../core/subtitle-engine'
import { detectSiteAdapter } from '../sites'
import type { SiteAdapter, SiteAdapterHandle } from '../sites/types'
import { createSettingsPanel } from '../ui/settings-panel'

export interface BootstrapOptions {
  storage: KeyValueStorage
  adapter?: SiteAdapter
  registerMenuCommand?(label: string, callback: () => void): void
}

export interface SubtitleShieldApp {
  openSettings(): void
  destroy(): void
}

export async function bootstrapSubtitleShield({
  storage,
  adapter,
  registerMenuCommand,
}: BootstrapOptions): Promise<SubtitleShieldApp> {
  injectStyles()

  const store = createSettingsStore(storage)
  await store.load()

  const panel = createSettingsPanel(store)
  const engine = new SubtitleEngine(store.get())
  const shortcut = createShortcutController({
    getSettings: store.get,
    onRevealChange: (revealing) => engine.setRevealing(revealing),
  })

  let adapterHandle: SiteAdapterHandle | null = null
  const activeAdapter = adapter ?? detectSiteAdapter()
  if (activeAdapter) {
    adapterHandle = activeAdapter.setup((snapshot) => engine.setSnapshot(snapshot))
  }

  const unsubscribeSettings = store.subscribe((settings) => {
    engine.setSettings(settings)
    shortcut.setSettings(settings)
  })

  const { t } = createTranslator(store.get().language)
  registerMenuCommand?.(t('menuOpenSettings'), panel.open)

  return {
    openSettings: panel.open,
    destroy: () => {
      unsubscribeSettings()
      adapterHandle?.destroy()
      shortcut.destroy()
      engine.destroy()
      panel.destroy()
    },
  }
}
