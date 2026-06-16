import { createTranslator } from '../core/i18n'
import type { SettingsStore } from '../core/settings'
import type {
  CaptionMode,
  LanguagePreference,
  RevealShortcut,
  SiteName,
  SubtitleShieldSettings,
} from '../core/types'
import { CAPTION_MODES, LANGUAGE_PREFERENCES, REVEAL_SHORTCUTS } from '../core/types'

export interface SettingsPanel {
  open(): void
  close(): void
  destroy(): void
}

export function createSettingsPanel(store: SettingsStore): SettingsPanel {
  let layer: HTMLDivElement | null = null
  let renderedLanguage = ''
  let panelPosition: PanelPosition | null = null
  let ballPosition: PanelPosition | null = null
  let dragState: DragState | null = null
  let minimized = false

  const unsubscribe = store.subscribe((settings) => {
    if (layer && settings.language !== renderedLanguage) {
      render()
    }
  })

  const handleResize = () => {
    if (!layer) {
      return
    }

    if (minimized && ballPosition) {
      const ball = layer.querySelector<HTMLElement>('.ss-panel-ball')
      if (ball) {
        ballPosition = clampElementPosition(ball, ballPosition.left, ballPosition.top)
        applyElementPosition(ball, ballPosition)
      }
    }

    if (!minimized && panelPosition) {
      const panel = layer.querySelector<HTMLElement>('.ss-panel')
      if (panel) {
        panelPosition = clampElementPosition(panel, panelPosition.left, panelPosition.top)
        applyElementPosition(panel, panelPosition)
      }
    }
  }

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close()
    }
  }

  const close = () => {
    endDrag()
    layer?.remove()
    layer = null
    document.removeEventListener('keydown', handleEscape)
    window.removeEventListener('resize', handleResize)
  }

  const open = () => {
    if (layer) {
      if (minimized) {
        restorePanel()
        return
      }

      layer.querySelector<HTMLElement>('.ss-panel__minimize')?.focus()
      return
    }

    layer = document.createElement('div')
    layer.className = 'ss-panel-layer'
    document.body.append(layer)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleResize)
    render()
    layer.querySelector<HTMLElement>('.ss-panel__close')?.focus()
  }

  const render = () => {
    if (!layer) {
      return
    }

    if (minimized) {
      renderBall()
      return
    }

    const settings = store.get()
    const { t, language } = createTranslator(settings.language)
    renderedLanguage = settings.language

    const panel = document.createElement('section')
    panel.className = 'ss-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-modal', 'false')
    panel.setAttribute('aria-labelledby', 'ss-panel-title')

    const title = document.createElement('h2')
    title.id = 'ss-panel-title'
    title.className = 'ss-panel__title'
    title.textContent = t('panelTitle')

    const closeButton = document.createElement('button')
    closeButton.className = 'ss-panel__icon-button ss-panel__close'
    closeButton.type = 'button'
    closeButton.textContent = '×'
    closeButton.setAttribute('aria-label', t('closePanel'))
    closeButton.addEventListener('click', close)

    const minimizeButton = document.createElement('button')
    minimizeButton.className = 'ss-panel__icon-button ss-panel__minimize'
    minimizeButton.type = 'button'
    minimizeButton.textContent = '–'
    minimizeButton.setAttribute('aria-label', t('minimizePanel'))
    minimizeButton.addEventListener('click', minimizePanel)

    const actions = document.createElement('div')
    actions.className = 'ss-panel__actions'
    actions.append(minimizeButton, closeButton)

    const header = document.createElement('header')
    header.className = 'ss-panel__header'
    header.addEventListener('pointerdown', (event) => startDrag(event, panel))
    header.append(title, actions)

    const body = document.createElement('div')
    body.className = 'ss-panel__body'
    body.append(
      createSection(t('sectionGeneral'), [
        createCheckbox(t('enabled'), settings.enabled, (checked) =>
          store.update({ enabled: checked }),
        ),
        createSelect<LanguagePreference>(
          t('language'),
          settings.language,
          LANGUAGE_PREFERENCES,
          (value) => languageLabel(value, t),
          (value) => store.update({ language: value }),
        ),
        createSelect<CaptionMode>(
          t('mode'),
          settings.mode,
          CAPTION_MODES,
          (value) => modeLabel(value, t),
          (value) => store.update({ mode: value }),
        ),
        createSelect<RevealShortcut>(
          t('revealShortcut'),
          settings.revealShortcut,
          REVEAL_SHORTCUTS,
          (value) => shortcutLabel(value, t),
          (value) => store.update({ revealShortcut: value }),
        ),
        createCheckbox(t('revealOnHover'), settings.revealOnHover, (checked) =>
          store.update({ revealOnHover: checked }),
        ),
        createCheckbox(t('showOnPause'), settings.showOnPause, (checked) =>
          store.update({ showOnPause: checked }),
        ),
      ]),
      createSection(t('sectionSites'), [
        createCheckbox(t('youtubeEnabled'), settings.sites.youtube, (checked) =>
          updateSite('youtube', checked),
        ),
        createCheckbox(t('bilibiliEnabled'), settings.sites.bilibili, (checked) =>
          updateSite('bilibili', checked),
        ),
      ]),
      createSection(t('sectionTuning'), [
        createRangeNumberRow({
          label: t('blurPx'),
          unit: t('unitPx'),
          value: settings.blurPx,
          min: 0,
          max: 20,
          step: 1,
          onValue: (value) => store.update({ blurPx: value }),
        }),
        createNumberRow({
          label: t('delayMs'),
          unit: t('unitMs'),
          value: settings.delayMs,
          min: 0,
          max: 10000,
          step: 100,
          onValue: (value) => store.update({ delayMs: value }),
        }),
        createRangeNumberRow({
          label: t('captionOffsetYPx'),
          unit: t('unitPx'),
          value: settings.captionOffsetYPx,
          min: -120,
          max: 120,
          step: 1,
          onValue: (value) => store.update({ captionOffsetYPx: value }),
        }),
      ]),
    )

    const resetButton = document.createElement('button')
    resetButton.className = 'ss-panel__button'
    resetButton.type = 'button'
    resetButton.textContent = t('reset')
    resetButton.addEventListener('click', () => {
      void store.reset().then(render)
    })

    const doneButton = document.createElement('button')
    doneButton.className = 'ss-panel__button ss-panel__button--primary'
    doneButton.type = 'button'
    doneButton.textContent = t('done')
    doneButton.addEventListener('click', close)

    const footer = document.createElement('footer')
    footer.className = 'ss-panel__footer'
    footer.append(resetButton, doneButton)

    panel.lang = language
    panel.append(header, body, footer)
    if (panelPosition) {
      applyElementPosition(panel, panelPosition)
    }
    layer.replaceChildren(panel)
  }

  const renderBall = () => {
    if (!layer) {
      return
    }

    const { t, language } = createTranslator(store.get().language)
    renderedLanguage = store.get().language

    const ball = document.createElement('button')
    ball.className = 'ss-panel-ball'
    ball.type = 'button'
    ball.textContent = 'SS'
    ball.lang = language
    ball.setAttribute('aria-label', t('restorePanel'))
    ball.addEventListener('pointerdown', (event) => startDrag(event, ball))
    ball.addEventListener('click', (event) => {
      if (event.detail === 0) {
        restorePanel()
      }
    })

    if (!ballPosition) {
      ballPosition = getDefaultBallPosition()
    }
    applyElementPosition(ball, ballPosition)
    layer.replaceChildren(ball)
    ball.focus()
  }

  const minimizePanel = () => {
    if (!layer) {
      return
    }

    const panel = layer.querySelector<HTMLElement>('.ss-panel')
    if (panel) {
      const rect = panel.getBoundingClientRect()
      panelPosition = {
        left: rect.left,
        top: rect.top,
      }

      if (!ballPosition) {
        ballPosition = clampElementPosition(
          getVirtualBallElement(),
          rect.right - FLOATING_BALL_SIZE,
          rect.top,
        )
      }
    }

    minimized = true
    render()
  }

  const restorePanel = () => {
    minimized = false
    render()
    layer?.querySelector<HTMLElement>('.ss-panel__minimize')?.focus()
  }

  const startDrag = (event: PointerEvent, element: HTMLElement) => {
    const isBall = element.classList.contains('ss-panel-ball')
    if (event.button !== 0 || (!isBall && isInteractiveTarget(event.target))) {
      return
    }

    const rect = element.getBoundingClientRect()
    dragState = {
      element,
      kind: element.classList.contains('ss-panel-ball') ? 'ball' : 'panel',
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      didMove: false,
    }
    element.classList.add(dragState.kind === 'ball' ? 'ss-panel-ball--dragging' : 'ss-panel--dragging')
    element.setPointerCapture(event.pointerId)
    element.addEventListener('pointermove', handleDragMove)
    element.addEventListener('pointerup', handleDragEnd)
    element.addEventListener('pointercancel', handleDragEnd)
    event.preventDefault()
  }

  const handleDragMove = (event: PointerEvent) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return
    }

    dragState.didMove =
      dragState.didMove ||
      Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) > 4

    const nextPosition = clampElementPosition(
      dragState.element,
      event.clientX - dragState.offsetX,
      event.clientY - dragState.offsetY,
    )

    if (dragState.kind === 'ball') {
      ballPosition = nextPosition
    } else {
      panelPosition = nextPosition
    }

    applyElementPosition(dragState.element, nextPosition)
  }

  const handleDragEnd = (event: PointerEvent) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return
    }

    const shouldRestoreBall =
      dragState.kind === 'ball' && !dragState.didMove && event.type === 'pointerup'
    endDrag()
    if (shouldRestoreBall) {
      restorePanel()
    }
  }

  const endDrag = () => {
    if (!dragState) {
      return
    }

    const { element, kind, pointerId } = dragState
    element.classList.remove(kind === 'ball' ? 'ss-panel-ball--dragging' : 'ss-panel--dragging')
    element.removeEventListener('pointermove', handleDragMove)
    element.removeEventListener('pointerup', handleDragEnd)
    element.removeEventListener('pointercancel', handleDragEnd)

    try {
      element.releasePointerCapture(pointerId)
    } catch {
      // The browser may release capture automatically when the pointer is cancelled.
    }

    dragState = null
  }

  const updateSite = (site: SiteName, enabled: boolean) =>
    store.update({
      sites: {
        [site]: enabled,
      },
    })

  return {
    open,
    close,
    destroy: () => {
      close()
      unsubscribe()
    },
  }
}

interface PanelPosition {
  left: number
  top: number
}

interface DragState {
  element: HTMLElement
  kind: 'panel' | 'ball'
  pointerId: number
  offsetX: number
  offsetY: number
  startX: number
  startY: number
  didMove: boolean
}

const FLOATING_BALL_SIZE = 48

function applyElementPosition(element: HTMLElement, position: PanelPosition): void {
  element.style.left = `${position.left}px`
  element.style.top = `${position.top}px`
  element.style.right = 'auto'
  element.style.bottom = 'auto'
}

function clampElementPosition(element: HTMLElement, left: number, top: number): PanelPosition {
  const margin = 8
  const width = element.offsetWidth || FLOATING_BALL_SIZE
  const height = element.offsetHeight || FLOATING_BALL_SIZE
  const maxLeft = Math.max(margin, window.innerWidth - width - margin)
  const maxTop = Math.max(margin, window.innerHeight - height - margin)

  return {
    left: Math.min(maxLeft, Math.max(margin, left)),
    top: Math.min(maxTop, Math.max(margin, top)),
  }
}

function getDefaultBallPosition(): PanelPosition {
  const margin = 16

  return {
    left: Math.max(8, window.innerWidth - FLOATING_BALL_SIZE - margin),
    top: Math.max(8, window.innerHeight - FLOATING_BALL_SIZE - margin),
  }
}

function getVirtualBallElement(): HTMLElement {
  const element = document.createElement('div')
  element.style.width = `${FLOATING_BALL_SIZE}px`
  element.style.height = `${FLOATING_BALL_SIZE}px`
  return element
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('button, input, select, textarea, a'))
}

function createSection(label: string, rows: HTMLElement[]): HTMLFieldSetElement {
  const section = document.createElement('fieldset')
  section.className = 'ss-panel__section'

  const legend = document.createElement('legend')
  legend.className = 'ss-panel__legend'
  legend.textContent = label

  const stack = document.createElement('div')
  stack.className = 'ss-panel__stack'
  stack.append(...rows)

  section.append(legend, stack)
  return section
}

function createCheckbox(
  label: string,
  checked: boolean,
  onChange: (checked: boolean) => Promise<SubtitleShieldSettings>,
): HTMLLabelElement {
  const row = document.createElement('label')
  row.className = 'ss-panel__check'

  const input = document.createElement('input')
  input.type = 'checkbox'
  input.checked = checked
  input.addEventListener('change', () => {
    void onChange(input.checked)
  })

  const text = document.createElement('span')
  text.className = 'ss-panel__label'
  text.textContent = label

  row.append(input, text)
  return row
}

function createSelect<T extends string>(
  label: string,
  value: T,
  options: readonly T[],
  labelFor: (value: T) => string,
  onChange: (value: T) => Promise<SubtitleShieldSettings>,
): HTMLLabelElement {
  const row = document.createElement('label')
  row.className = 'ss-panel__row'

  const text = document.createElement('span')
  text.className = 'ss-panel__label'
  text.textContent = label

  const select = document.createElement('select')
  for (const optionValue of options) {
    const option = document.createElement('option')
    option.value = optionValue
    option.textContent = labelFor(optionValue)
    select.append(option)
  }
  select.value = value
  select.addEventListener('change', () => {
    void onChange(select.value as T)
  })

  row.append(text, select)
  return row
}

interface NumberRowOptions {
  label: string
  unit: string
  value: number
  min: number
  max: number
  step: number
  onValue(value: number): Promise<SubtitleShieldSettings>
}

function createRangeNumberRow(options: NumberRowOptions): HTMLLabelElement {
  const row = document.createElement('label')
  row.className = 'ss-panel__row'

  const text = document.createElement('span')
  text.className = 'ss-panel__label'
  text.textContent = options.label

  const range = document.createElement('input')
  range.type = 'range'
  range.min = String(options.min)
  range.max = String(options.max)
  range.step = String(options.step)
  range.value = String(options.value)

  const numberWrap = createNumberInput(options)
  const number = numberWrap.querySelector<HTMLInputElement>('input')

  range.addEventListener('input', () => {
    if (number) {
      number.value = range.value
    }
    void options.onValue(Number(range.value))
  })

  const controls = document.createElement('div')
  controls.className = 'ss-panel__number'
  controls.append(range, numberWrap)

  row.append(text, controls)
  return row
}

function createNumberRow(options: NumberRowOptions): HTMLLabelElement {
  const row = document.createElement('label')
  row.className = 'ss-panel__row'

  const text = document.createElement('span')
  text.className = 'ss-panel__label'
  text.textContent = options.label

  row.append(text, createNumberInput(options))
  return row
}

function createNumberInput(options: NumberRowOptions): HTMLSpanElement {
  const wrap = document.createElement('span')
  wrap.className = 'ss-panel__number'

  const input = document.createElement('input')
  input.type = 'number'
  input.min = String(options.min)
  input.max = String(options.max)
  input.step = String(options.step)
  input.value = String(options.value)
  input.addEventListener('change', () => {
    void options.onValue(Number(input.value))
  })

  const unit = document.createElement('span')
  unit.className = 'ss-panel__unit'
  unit.textContent = options.unit

  wrap.append(input, unit)
  return wrap
}

function languageLabel(value: LanguagePreference, t: (key: string) => string): string {
  switch (value) {
    case 'auto':
      return t('languageAuto')
    case 'zh-CN':
      return t('languageZh')
    case 'en-US':
      return t('languageEn')
  }
}

function modeLabel(value: CaptionMode, t: (key: string) => string): string {
  switch (value) {
    case 'blur':
      return t('modeBlur')
    case 'flip':
      return t('modeFlip')
    case 'hide':
      return t('modeHide')
    case 'pauseOnly':
      return t('modePauseOnly')
    case 'delay':
      return t('modeDelay')
  }
}

function shortcutLabel(value: RevealShortcut, t: (key: string) => string): string {
  switch (value) {
    case 'Alt':
      return t('shortcutAlt')
    case 'Shift':
      return t('shortcutShift')
    case 'Control':
      return t('shortcutControl')
    case 'Meta':
      return t('shortcutMeta')
  }
}
