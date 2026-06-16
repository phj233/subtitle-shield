import { describe, expect, it } from 'vitest'
import { SUBTITLE_SHIELD_STYLESHEET } from '../src/core/styles'

describe('caption styles', () => {
  it('applies blur while captions are flipped', () => {
    const flipRule = SUBTITLE_SHIELD_STYLESHEET.match(
      /\.ss-caption-root\.ss-enabled\.ss-mode-flip[\s\S]*?\}/,
    )?.[0]

    expect(flipRule).toContain('filter: blur(var(--ss-blur-px)) !important;')
    expect(flipRule).toContain('rotate: 180deg !important;')
  })
})
