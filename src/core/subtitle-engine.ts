import { DEFAULT_SETTINGS } from './settings'
import type { SubtitleShieldSettings } from './types'
import type { SiteSnapshot } from '../sites/types'

const MODE_CLASSES = [
  'ss-mode-blur',
  'ss-mode-flip',
  'ss-mode-hide',
  'ss-mode-pause-only',
  'ss-mode-delay',
]

const ROOT_CLASSES = [
  'ss-caption-root',
  'ss-enabled',
  'ss-revealing',
  'ss-video-paused',
  'ss-delay-ready',
  'ss-hover-reveal',
  ...MODE_CLASSES,
]

interface DelayState {
  observer: MutationObserver
  timer: number | null
  delayMs: number
}

export class SubtitleEngine {
  private settings = DEFAULT_SETTINGS
  private snapshot: SiteSnapshot | null = null
  private targets = new Set<HTMLElement>()
  private delayStates = new Map<HTMLElement, DelayState>()
  private revealing = false
  private video: HTMLVideoElement | null = null

  private readonly handleVideoStateChange = () => {
    this.apply()
  }

  constructor(settings: SubtitleShieldSettings = DEFAULT_SETTINGS) {
    this.settings = settings
  }

  setSettings(settings: SubtitleShieldSettings): void {
    this.settings = settings
    this.apply()
  }

  setSnapshot(snapshot: SiteSnapshot): void {
    this.snapshot = snapshot
    this.setVideo(snapshot.video)
    this.replaceTargets(snapshot.captionContainers)
    this.apply()
  }

  setRevealing(revealing: boolean): void {
    if (this.revealing === revealing) {
      return
    }

    this.revealing = revealing
    this.apply()
  }

  destroy(): void {
    for (const target of this.targets) {
      this.cleanTarget(target)
    }

    this.targets.clear()
    this.setVideo(null)
  }

  private replaceTargets(nextTargets: HTMLElement[]): void {
    const next = new Set(nextTargets)

    for (const target of this.targets) {
      if (!next.has(target)) {
        this.cleanTarget(target)
        this.targets.delete(target)
      }
    }

    for (const target of next) {
      this.targets.add(target)
    }
  }

  private setVideo(video: HTMLVideoElement | null): void {
    if (this.video === video) {
      return
    }

    this.video?.removeEventListener('play', this.handleVideoStateChange)
    this.video?.removeEventListener('pause', this.handleVideoStateChange)
    this.video?.removeEventListener('ended', this.handleVideoStateChange)
    this.video = video
    this.video?.addEventListener('play', this.handleVideoStateChange)
    this.video?.addEventListener('pause', this.handleVideoStateChange)
    this.video?.addEventListener('ended', this.handleVideoStateChange)
  }

  private apply(): void {
    const snapshot = this.snapshot
    const siteEnabled = snapshot ? this.settings.sites[snapshot.site] : false
    const active = this.settings.enabled && siteEnabled
    const isPausedReveal =
      Boolean(this.video?.paused) &&
      (this.settings.showOnPause || this.settings.mode === 'pauseOnly')

    for (const target of this.targets) {
      if (!active) {
        this.cleanTarget(target)
        continue
      }

      target.classList.add('ss-caption-root', 'ss-enabled')
      target.classList.remove(...MODE_CLASSES)
      target.classList.add(modeClassName(this.settings.mode))
      target.classList.toggle('ss-revealing', this.revealing)
      target.classList.toggle('ss-video-paused', isPausedReveal)
      target.classList.toggle('ss-hover-reveal', this.settings.revealOnHover)
      target.style.setProperty('--ss-blur-px', `${this.settings.blurPx}px`)
      target.style.setProperty('--ss-offset-y', `${this.settings.captionOffsetYPx}px`)
      this.updateDelayTracking(target, this.settings.mode === 'delay')
    }
  }

  private updateDelayTracking(target: HTMLElement, shouldTrack: boolean): void {
    if (!shouldTrack) {
      this.teardownDelay(target)
      target.classList.remove('ss-delay-ready')
      return
    }

    if (this.delayStates.has(target)) {
      const state = this.delayStates.get(target)
      if (state && state.delayMs !== this.settings.delayMs) {
        state.delayMs = this.settings.delayMs
        this.restartDelay(target)
      }
      return
    }

    const observer = new MutationObserver(() => this.restartDelay(target))
    observer.observe(target, {
      childList: true,
      characterData: true,
      subtree: true,
    })

    this.delayStates.set(target, {
      observer,
      timer: null,
      delayMs: this.settings.delayMs,
    })
    this.restartDelay(target)
  }

  private restartDelay(target: HTMLElement): void {
    const state = this.delayStates.get(target)
    if (!state) {
      return
    }

    if (state.timer !== null) {
      window.clearTimeout(state.timer)
      state.timer = null
    }

    target.classList.remove('ss-delay-ready')

    if (!target.textContent?.trim() || this.settings.delayMs <= 0) {
      target.classList.add('ss-delay-ready')
      return
    }

    state.timer = window.setTimeout(() => {
      target.classList.add('ss-delay-ready')
      state.timer = null
    }, this.settings.delayMs)
  }

  private teardownDelay(target: HTMLElement): void {
    const state = this.delayStates.get(target)
    if (!state) {
      return
    }

    if (state.timer !== null) {
      window.clearTimeout(state.timer)
    }

    state.observer.disconnect()
    this.delayStates.delete(target)
  }

  private cleanTarget(target: HTMLElement): void {
    this.teardownDelay(target)
    target.classList.remove(...ROOT_CLASSES)
    target.style.removeProperty('--ss-blur-px')
    target.style.removeProperty('--ss-offset-y')
  }
}

function modeClassName(mode: SubtitleShieldSettings['mode']): string {
  switch (mode) {
    case 'blur':
      return 'ss-mode-blur'
    case 'flip':
      return 'ss-mode-flip'
    case 'hide':
      return 'ss-mode-hide'
    case 'pauseOnly':
      return 'ss-mode-pause-only'
    case 'delay':
      return 'ss-mode-delay'
  }
}
