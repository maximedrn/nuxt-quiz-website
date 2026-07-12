/**
 * Locales the app can serve, in stable order.
 *
 * Adding a language is a one-line change here (plus the locale file under
 * `i18n/locales/`). `useTypedI18n` cycles through this object, so any new entry
 * is automatically picked up by the language toggle.
 */
const SupportedLocales = { en: "en", fr: "fr" } as const satisfies Record<
  string,
  string
>;

type SupportedLocale = (typeof SupportedLocales)[keyof typeof SupportedLocales];

export type { SupportedLocale };
export { SupportedLocales };
