import { useSyncExternalStore } from 'react';
import { en } from '@/locales/en';
import { de } from '@/locales/de';
import { tr } from '@/locales/tr';
import { pt } from '@/locales/pt';

export type Locale = 'en' | 'de' | 'tr' | 'pt';
export type Translations = typeof en;

const locales: Record<Locale, Translations> = { en, de, tr, pt };

function detectLocale(): Locale {
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('tr')) return 'tr';
  if (lang.startsWith('pt')) return 'pt';
  return 'en';
}

// Locale never changes at runtime, so no subscription is needed.
const emptySubscribe = () => () => {};

/**
 * Returns the translation object for the user's browser language.
 * Uses useSyncExternalStore so the correct locale is read on the first
 * client render with no extra re-render, while the server snapshot
 * safely falls back to English to avoid hydration mismatches.
 */
export function useLocale(): Translations {
  return useSyncExternalStore(
    emptySubscribe,
    () => locales[detectLocale()],
    () => en,
  );
}
