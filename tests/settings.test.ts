import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, mergeSettings, normalizeSettings } from '../src/core/settings'

describe('settings', () => {
  it('fills missing fields from defaults', () => {
    expect(normalizeSettings({ enabled: false })).toEqual({
      ...DEFAULT_SETTINGS,
      enabled: false,
    })
  })

  it('falls back when stored values are invalid', () => {
    expect(
      normalizeSettings({
        enabled: 'yes',
        language: 'fr-FR',
        mode: 'mirror',
        blurPx: Number.NaN,
        delayMs: -10,
        captionOffsetYPx: Number.POSITIVE_INFINITY,
        revealShortcut: 'Enter',
        revealOnHover: 'no',
        sites: {
          youtube: 'true',
          bilibili: false,
        },
      }),
    ).toEqual({
      ...DEFAULT_SETTINGS,
      delayMs: 0,
      sites: {
        youtube: true,
        bilibili: false,
      },
    })
  })

  it('merges nested site patches', () => {
    expect(
      mergeSettings(DEFAULT_SETTINGS, {
        mode: 'delay',
        sites: {
          youtube: false,
        },
      }),
    ).toEqual({
      ...DEFAULT_SETTINGS,
      mode: 'delay',
      sites: {
        youtube: false,
        bilibili: true,
      },
    })
  })

  it('keeps negative caption offsets and clamps extreme values', () => {
    expect(normalizeSettings({ captionOffsetYPx: -36 }).captionOffsetYPx).toBe(-36)
    expect(normalizeSettings({ captionOffsetYPx: -999 }).captionOffsetYPx).toBe(-120)
    expect(normalizeSettings({ captionOffsetYPx: 999 }).captionOffsetYPx).toBe(120)
  })
})
