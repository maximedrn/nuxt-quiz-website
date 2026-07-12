import type { TranslationKey } from '@/app/lib/i18n/i18n.keys'

/**
 * Typed wrapper around the `@nuxtjs/i18n` composable.
 *
 * Constrains `t()` to only accept `TranslationKey` values, giving compile-time
 * safety without touching the module's auto-imported `useI18n` directly.
 *
 * @returns `t` typed to `TranslationKey`, reactive `locale`, and `toggleLocale`.
 */
export function useTypedI18n() {
  const { t, locale, setLocale } = useI18n()

  /** Translates a `TranslationKey` into the current locale string. */
  const translate = (key: TranslationKey): string => t(key)

  /** Switches between `fr` and `en`. */
  const toggleLocale = (): void => {
    setLocale(locale.value === 'fr' ? 'en' : 'fr')
  }

  return { t: translate, locale, toggleLocale }
}
