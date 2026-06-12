import { createBilibiliAdapter } from './bilibili'
import type { SiteAdapter } from './types'
import { createYoutubeAdapter } from './youtube'

export function detectSiteAdapter(location = window.location): SiteAdapter | null {
  const adapters = [createYoutubeAdapter(), createBilibiliAdapter()]
  return adapters.find((adapter) => adapter.matches(location)) ?? null
}
