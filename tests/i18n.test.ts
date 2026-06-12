import { describe, expect, it } from 'vitest'
import { createTranslator, resolveLanguage } from '../src/core/i18n'

describe('i18n', () => {
  it('resolves automatic Chinese locales', () => {
    expect(resolveLanguage('auto', 'zh-CN')).toBe('zh-CN')
    expect(resolveLanguage('auto', 'zh-Hant-TW')).toBe('zh-CN')
  })

  it('falls back to English for unsupported automatic locales', () => {
    expect(resolveLanguage('auto', 'fr-FR')).toBe('en-US')
  })

  it('falls back to the key when a message is missing', () => {
    const translator = createTranslator('zh-CN')
    expect(translator.t('missingKey')).toBe('missingKey')
  })
})
