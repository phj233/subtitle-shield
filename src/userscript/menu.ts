declare const GM_registerMenuCommand:
  | ((caption: string, commandFunc: () => void) => void | number)
  | undefined

export function registerUserscriptMenuCommand(
  label: string,
  callback: () => void,
): void {
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(label, callback)
  }
}
