import { useDark, useToggle } from '@vueuse/core'

/**
 * Light/dark theme backed by `@vueuse/core`.
 *
 * `useDark` toggles the `.dark` class on <html> and persists the choice to
 * localStorage; `useToggle` flips it. No hand-rolled cookie/head wiring.
 *
 * @returns The reactive `isDark` flag and a `toggle`.
 */
export function useTheme() {
  const isDark = useDark()
  const toggle = useToggle(isDark)
  return { isDark, toggle }
}
