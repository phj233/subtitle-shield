import type { KeyValueStorage } from '../core/storage'

declare const GM_getValue:
  | (<T>(key: string, defaultValue: T) => T | Promise<T>)
  | undefined
declare const GM_setValue:
  | (<T>(key: string, value: T) => void | Promise<void>)
  | undefined

export function createGmStorage(keyPrefix = ''): KeyValueStorage {
  const keyFor = (key: string) => `${keyPrefix}${key}`

  return {
    get: async <T>(key: string, fallback: T) => {
      const storageKey = keyFor(key)

      if (typeof GM_getValue === 'function') {
        return Promise.resolve(GM_getValue(storageKey, fallback))
      }

      const raw = localStorage.getItem(storageKey)
      if (raw === null) {
        return fallback
      }

      try {
        return JSON.parse(raw) as T
      } catch {
        return fallback
      }
    },
    set: async <T>(key: string, value: T) => {
      const storageKey = keyFor(key)

      if (typeof GM_setValue === 'function') {
        await Promise.resolve(GM_setValue(storageKey, value))
        return
      }

      localStorage.setItem(storageKey, JSON.stringify(value))
    },
  }
}
