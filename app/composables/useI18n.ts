import type { TranslationKey } from '@/app/lib/i18n/i18n.keys'
import { I18nMessages, Locale } from '@/app/lib/i18n/i18n.messages'

/**
 * Minimal i18n: a cookie-backed locale and a typed `t()` translator.
 *
 * The locale lives in a cookie so SSR and client render the same language.
 *
 * @returns The reactive `locale`, a `t(key)` translator, and `toggleLocale`.
 */
export function useI18n() {
  const locale = useCookie<Locale>('locale', { default: () => Locale.FR })

  /** Translates a key into the current locale, falling back to the key. */
  const t = (key: TranslationKey): string => I18nMessages[locale.value]?.[key] ?? key

  const toggleLocale = () => {
    locale.value = locale.value === Locale.FR ? Locale.EN : Locale.FR
  }

  return { locale, t, toggleLocale }
}
