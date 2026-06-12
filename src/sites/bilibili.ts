import { queryHtmlElements, toHtmlElements, uniqueElements } from './dom'
import { watchNavigation } from './navigation'
import type { SiteAdapter, SiteSnapshot } from './types'

const CAPTION_SELECTORS = [
  '.bpx-player-subtitle-panel',
  '.bpx-player-subtitle-wrap',
  '.bpx-player-subtitle-item',
  '.bilibili-player-video-subtitle',
  '.bilibili-player-video-subtitle-panel',
]

const FALLBACK_BLOCKLIST = [
  'button',
  'control',
  'danmaku',
  'dm',
  'setting',
  'switch',
  'tooltip',
]

export function createBilibiliAdapter(): SiteAdapter {
  return {
    site: 'bilibili',
    matches: (location) =>
      location.hostname === 'www.bilibili.com' &&
      (location.pathname.startsWith('/video/') || location.pathname.startsWith('/list/')),
    setup: (onSnapshot) => setupBilibiliAdapter(onSnapshot),
  }
}

function setupBilibiliAdapter(onSnapshot: (snapshot: SiteSnapshot) => void) {
  let animationFrame = 0
  let observedRoot: Node | null = null

  const observer = new MutationObserver(() => scheduleRefresh())

  const scheduleRefresh = () => {
    if (animationFrame !== 0) {
      return
    }

    animationFrame = window.requestAnimationFrame(() => {
      animationFrame = 0
      refresh()
    })
  }

  const refresh = () => {
    const snapshot = getBilibiliSnapshot()
    onSnapshot(snapshot)

    const nextRoot = snapshot.player ?? document.querySelector('#app') ?? document.body
    if (nextRoot !== observedRoot) {
      observer.disconnect()
      observer.observe(nextRoot, {
        childList: true,
        subtree: true,
        characterData: true,
      })
      observedRoot = nextRoot
    }
  }

  const unwatchNavigation = watchNavigation(scheduleRefresh)
  document.addEventListener('visibilitychange', scheduleRefresh)
  refresh()

  return {
    refresh,
    destroy: () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame)
      }
      observer.disconnect()
      unwatchNavigation()
      document.removeEventListener('visibilitychange', scheduleRefresh)
    },
  }
}

function getBilibiliSnapshot(): SiteSnapshot {
  const player = findBilibiliPlayer()
  const root = player ?? document
  const video = player?.querySelector('video') ?? document.querySelector('video')
  const captionContainers = findBilibiliCaptionContainers(root)

  return {
    site: 'bilibili',
    player,
    video,
    captionContainers,
  }
}

function findBilibiliPlayer(): HTMLElement | null {
  const video = document.querySelector('video')

  return (
    document.querySelector<HTMLElement>('.bpx-player-container') ??
    document.querySelector<HTMLElement>('#bilibili-player') ??
    document.querySelector<HTMLElement>('.bilibili-player') ??
    video?.closest<HTMLElement>('[class*="player"]') ??
    null
  )
}

function findBilibiliCaptionContainers(root: ParentNode): HTMLElement[] {
  const stableTargets = queryHtmlElements(root, CAPTION_SELECTORS)
  if (stableTargets.length > 0) {
    return stableTargets
  }

  const fallbackTargets = toHtmlElements(root.querySelectorAll('[class*="subtitle"]')).filter(
    isLikelyCaptionElement,
  )

  return uniqueElements(fallbackTargets)
}

function isLikelyCaptionElement(element: HTMLElement): boolean {
  const className = element.className.toString().toLowerCase()

  if (!className.includes('subtitle')) {
    return false
  }

  return !FALLBACK_BLOCKLIST.some((blocked) => className.includes(blocked))
}
