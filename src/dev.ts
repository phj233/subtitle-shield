import { bootstrapSubtitleShield } from './app/bootstrap'
import { createGmStorage } from './userscript/gm-storage'
import type { SiteAdapter } from './sites/types'
import './dev.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="dev-shell">
    <section class="dev-player" aria-label="Mock video player">
      <div class="dev-video">
        <div class="dev-caption caption-window">This is a local caption preview.</div>
      </div>
      <button class="dev-open" type="button">Open settings</button>
    </section>
  </main>
`

const devAdapter: SiteAdapter = {
  site: 'youtube',
  matches: () => true,
  setup: (onSnapshot) => {
    const player = document.querySelector<HTMLElement>('.dev-player')
    const caption = document.querySelector<HTMLElement>('.dev-caption')
    onSnapshot({
      site: 'youtube',
      player,
      video: null,
      captionContainers: caption ? [caption] : [],
    })

    return {
      refresh: () => undefined,
      destroy: () => undefined,
    }
  },
}

void bootstrapSubtitleShield({
  storage: createGmStorage('subtitle-shield.dev.'),
  adapter: devAdapter,
  registerMenuCommand: (_label, callback) => {
    document.querySelector<HTMLButtonElement>('.dev-open')?.addEventListener('click', callback)
  },
}).then((app) => {
  if (import.meta.hot) {
    import.meta.hot.dispose(app.destroy)
  }
})
