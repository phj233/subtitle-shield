import type { RevealShortcut, SubtitleShieldSettings } from './types'

export interface ShortcutController {
  setSettings(settings: SubtitleShieldSettings): void
  destroy(): void
}

interface ShortcutControllerOptions {
  getSettings(): SubtitleShieldSettings
  onRevealChange(revealing: boolean): void
}

export function createShortcutController({
  getSettings,
  onRevealChange,
}: ShortcutControllerOptions): ShortcutController {
  let activeShortcut: RevealShortcut | null = null
  let settings = getSettings()

  const setRevealing = (revealing: boolean) => {
    onRevealChange(revealing)
  }

  const reset = () => {
    if (activeShortcut === null) {
      return
    }

    activeShortcut = null
    setRevealing(false)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat || isEditableTarget(event.target)) {
      return
    }

    const shortcut = settings.revealShortcut
    if (event.key === shortcut) {
      activeShortcut = shortcut
      setRevealing(true)
    }
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    if (activeShortcut !== null && event.key === activeShortcut) {
      reset()
    }
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState !== 'visible') {
      reset()
    }
  }

  window.addEventListener('keydown', handleKeyDown, true)
  window.addEventListener('keyup', handleKeyUp, true)
  window.addEventListener('blur', reset)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return {
    setSettings: (nextSettings) => {
      if (settings.revealShortcut !== nextSettings.revealShortcut) {
        reset()
      }
      settings = nextSettings
    },
    destroy: () => {
      reset()
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
      window.removeEventListener('blur', reset)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    },
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.matches('input, textarea, select, [contenteditable="true"]')
  )
}
