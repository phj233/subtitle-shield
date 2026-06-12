import { bootstrapSubtitleShield } from './app/bootstrap'
import { createGmStorage } from './userscript/gm-storage'
import { registerUserscriptMenuCommand } from './userscript/menu'

void bootstrapSubtitleShield({
  storage: createGmStorage(),
  registerMenuCommand: registerUserscriptMenuCommand,
}).then((app) => {
  if (import.meta.hot) {
    import.meta.hot.dispose(app.destroy)
  }
})
