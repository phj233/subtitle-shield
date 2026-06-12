import type { SiteName } from '../core/types'

export interface SiteSnapshot {
  site: SiteName
  player: HTMLElement | null
  video: HTMLVideoElement | null
  captionContainers: HTMLElement[]
}

export interface SiteAdapterHandle {
  refresh(): void
  destroy(): void
}

export interface SiteAdapter {
  site: SiteName
  matches(location: Location): boolean
  setup(onSnapshot: (snapshot: SiteSnapshot) => void): SiteAdapterHandle
}
