const listeners = new Set<() => void>()
let installed = false

export function watchNavigation(listener: () => void): () => void {
  listeners.add(listener)
  installNavigationWatcher()

  return () => {
    listeners.delete(listener)
  }
}

function installNavigationWatcher(): void {
  if (installed) {
    return
  }

  installed = true
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function pushState(...args) {
    const result = originalPushState.apply(this, args)
    queueNavigationEmit()
    return result
  }

  history.replaceState = function replaceState(...args) {
    const result = originalReplaceState.apply(this, args)
    queueNavigationEmit()
    return result
  }

  window.addEventListener('popstate', queueNavigationEmit)
  window.addEventListener('hashchange', queueNavigationEmit)
}

let queued = false

function queueNavigationEmit(): void {
  if (queued) {
    return
  }

  queued = true
  window.setTimeout(() => {
    queued = false
    for (const listener of listeners) {
      listener()
    }
  }, 0)
}
