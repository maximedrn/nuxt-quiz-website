import { useDark, useToggle } from "@vueuse/core";

interface Theme {
  isDark: Ref<boolean>;
  toggle: (value?: boolean) => boolean;
}

/**
 * Light/dark theme backed by `@vueuse/core`.
 *
 * `useDark` toggles the `.dark` class on <html> and persists the choice to
 * localStorage; `useToggle` flips it. No hand-rolled cookie/head wiring.
 *
 * @returns The reactive `isDark` flag and a `toggle`.
 */
const useTheme: () => Theme = (): Theme => {
  const isDark: Ref<boolean> = useDark();
  const toggle: (value?: boolean) => boolean = useToggle(isDark);
  return { isDark, toggle };
};

export type { Theme };
export { useTheme };
