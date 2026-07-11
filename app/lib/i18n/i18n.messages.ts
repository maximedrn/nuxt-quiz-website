import { TranslationKey } from '@/app/lib/i18n/i18n.keys'

/** Supported locales. */
export const Locale = { FR: 'fr', EN: 'en' } as const
export type Locale = (typeof Locale)[keyof typeof Locale]

/** Message catalog per locale. Every key is required in every locale. */
export const I18nMessages: Record<Locale, Record<TranslationKey, string>> = {
  fr: {
    [TranslationKey.NavBrand]: 'Core Solidity & EVM',
    [TranslationKey.NavHistory]: 'Historique',
    [TranslationKey.NavNewSession]: 'Nouvelle session',
    [TranslationKey.NavLogout]: 'Déconnexion',
    [TranslationKey.ThemeToggle]: 'Thème',
    [TranslationKey.LangToggle]: 'EN',
    [TranslationKey.LoginTitle]: 'Connexion',
    [TranslationKey.LoginSubtitle]: 'Entre ton code à 8 chiffres pour continuer.',
    [TranslationKey.LoginCodeLabel]: 'Code à 8 chiffres',
    [TranslationKey.LoginCodePlaceholder]: '••••••••',
    [TranslationKey.LoginSignIn]: 'Se connecter',
    [TranslationKey.LoginRegister]: 'Créer un compte',
    [TranslationKey.LoginHint]: 'Choisis un code que tu retiendras — il ne peut pas être récupéré.',
    [TranslationKey.LoginInvalidCode]: 'Le code doit contenir exactement 8 chiffres.',
    [TranslationKey.CommonLoading]: 'Chargement…',
  },
  en: {
    [TranslationKey.NavBrand]: 'Core Solidity & EVM',
    [TranslationKey.NavHistory]: 'History',
    [TranslationKey.NavNewSession]: 'New session',
    [TranslationKey.NavLogout]: 'Sign out',
    [TranslationKey.ThemeToggle]: 'Theme',
    [TranslationKey.LangToggle]: 'FR',
    [TranslationKey.LoginTitle]: 'Sign in',
    [TranslationKey.LoginSubtitle]: 'Enter your 8-digit code to continue.',
    [TranslationKey.LoginCodeLabel]: '8-digit code',
    [TranslationKey.LoginCodePlaceholder]: '••••••••',
    [TranslationKey.LoginSignIn]: 'Sign in',
    [TranslationKey.LoginRegister]: 'Create account',
    [TranslationKey.LoginHint]: 'Pick a code you will remember — it cannot be recovered.',
    [TranslationKey.LoginInvalidCode]: 'The code must be exactly 8 digits.',
    [TranslationKey.CommonLoading]: 'Loading…',
  },
}
