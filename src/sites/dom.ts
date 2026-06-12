export function toHtmlElements(elements: Iterable<Element | null | undefined>): HTMLElement[] {
  const result: HTMLElement[] = []

  for (const element of elements) {
    if (element instanceof HTMLElement) {
      result.push(element)
    }
  }

  return uniqueElements(result)
}

export function uniqueElements<T extends HTMLElement>(elements: Iterable<T>): T[] {
  return [...new Set(elements)]
}

export function queryHtmlElements(root: ParentNode, selectors: readonly string[]): HTMLElement[] {
  return uniqueElements(
    selectors.flatMap((selector) => toHtmlElements(root.querySelectorAll(selector))),
  )
}
