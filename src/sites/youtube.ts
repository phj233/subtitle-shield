import { queryHtmlElements, toHtmlElements, uniqueElements } from './dom'
import { watchNavigation } from './navigation'
import type { SiteAdapter, SiteSnapshot } from './types'

export function createYoutubeAdapter(): SiteAdapter {
  return {
    site: 'youtube',
    matches: (location) =>
      location.hostname === 'youtube.com' || location.hostname.endsWith('.youtube.com'),
    setup: (onSnapshot) => setupYoutubeAdapter(onSnapshot),
  }
}

function setupYoutubeAdapter(onSnapshot: (snapshot: SiteSnapshot) => void) {
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
    const snapshot = getYoutubeSnapshot()
    onSnapshot(snapshot)

    const nextRoot = snapshot.player ?? document.querySelector('ytd-app') ?? document.body
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
  window.addEventListener('yt-navigate-finish', scheduleRefresh)
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
      window.removeEventListener('yt-navigate-finish', scheduleRefresh)
      document.removeEventListener('visibilitychange', scheduleRefresh)
    },
  }
}

function getYoutubeSnapshot(): SiteSnapshot {
  const player = findYoutubePlayer()
  const root = player ?? document
  const video = player?.querySelector('video') ?? document.querySelector('video')
  const captionContainers = findYoutubeCaptionContainers(root)

  return {
    site: 'youtube',
    player,
    video,
    captionContainers,
  }
}

function findYoutubePlayer(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('.html5-video-player') ??
    document.querySelector<HTMLElement>('#movie_player') ??
    document.querySelector<HTMLElement>('ytd-player')
  )
}

function findYoutubeCaptionContainers(root: ParentNode): HTMLElement[] {
  const windows = queryHtmlElements(root, ['.caption-window'])
  if (windows.length > 0) {
    return windows
  }

  const segments = queryHtmlElements(root, ['.ytp-caption-window-container .ytp-caption-segment'])
  if (segments.length > 0) {
    return segments
  }

  const fallbackContainers = toHtmlElements(root.querySelectorAll('.ytp-caption-window-container'))
  return uniqueElements(fallbackContainers.filter((element) => element.textContent?.trim()))
}
