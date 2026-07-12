import { useI18n } from "vue-i18n";
import {
  type SupportedLocale,
  SupportedLocales,
} from "@/app/lib/i18n/i18n.constants.ts";
import type { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";

/**
 * Public shape returned by {@link useTypedI18n}.
 */
interface TypedI18n {
  locale: Ref<string>;
  nextLocaleCode: ComputedRef<SupportedLocale>;
  t: (key: TranslationKey, params?: Record<string, unknown>) => string;
  toggleLocale: () => void;
}

/**
 * Typed wrapper around the `@nuxtjs/i18n` composable.
 *
 * Constrains `t()` to only accept `TranslationKey` values, giving compile-time
 * safety without touching the module's auto-imported `useI18n` directly.
 * Language cycling uses `SupportedLocales` so adding a locale is a single entry
 * there — never a `fr↔en` branch here.
 *
 * @returns `t` typed to `TranslationKey`, reactive `locale`, `nextLocaleCode`,
 *   and `toggleLocale` (advances to the next locale, wraps around).
 */
const useTypedI18n: () => TypedI18n = (): TypedI18n => {
  const { locale, setLocale, t } = useI18n();

  /**
   * Translates a `TranslationKey` into the current locale string, optionally
   * filling named `{placeholders}` from `params`.
   */
  const translate: (
    key: TranslationKey,
    params?: Record<string, unknown>,
  ) => string = (
    key: TranslationKey,
    params?: Record<string, unknown>,
  ): string => {
    if (params) {
      return t(key, params);
    }
    return t(key);
  };

  /**
   * Index of the current locale inside `SupportedLocales` (always found).
   */
  const currentIndex: ComputedRef<number> = computed(() => {
    const idx: number = Object.values(SupportedLocales).indexOf(
      locale.value as SupportedLocale,
    );
    if (idx === -1) {
      return 0;
    }
    return idx;
  });

  /**
   * Code of the locale the toggle will switch to.
   */
  const nextLocaleCode: ComputedRef<SupportedLocale> = computed(() => {
    const locales: SupportedLocale[] = Object.values(
      SupportedLocales,
    ) as SupportedLocale[];
    return locales[
      (currentIndex.value + 1) % locales.length
    ] as SupportedLocale;
  });

  /**
   * Advances to the next locale, wrapping around to the first.
   */
  const toggleLocale: () => void = (): void => {
    setLocale(nextLocaleCode.value);
  };

  return { locale, nextLocaleCode, t: translate, toggleLocale };
};

export type { TypedI18n };
export { useTypedI18n };
