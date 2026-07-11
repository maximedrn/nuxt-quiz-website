/**
 * Translation keys as a `const enum` — the single source of truth for every
 * translatable string id. Using a const enum keeps call sites type-safe
 * (`t(TranslationKey.NavHistory)`) while the values stay as stable dotted ids.
 */
export enum TranslationKey {
  NavBrand = 'nav.brand',
  NavHistory = 'nav.history',
  NavNewSession = 'nav.newSession',
  NavLogout = 'nav.logout',
  ThemeToggle = 'theme.toggle',
  LangToggle = 'lang.toggle',
  LoginTitle = 'login.title',
  LoginSubtitle = 'login.subtitle',
  LoginCodeLabel = 'login.codeLabel',
  LoginCodePlaceholder = 'login.codePlaceholder',
  LoginSignIn = 'login.signIn',
  LoginRegister = 'login.register',
  LoginHint = 'login.hint',
  LoginInvalidCode = 'login.invalidCode',
  CommonLoading = 'common.loading',
}
