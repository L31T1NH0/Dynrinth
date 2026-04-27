import { en } from '@/locales/en';
import { de } from '@/locales/de';
import { tr } from '@/locales/tr';
import { pt } from '@/locales/pt';
import { es } from '@/locales/es';

export type Locale = 'en' | 'de' | 'tr' | 'pt' | 'es';
export type Translations = typeof en;

const locales: Record<Locale, Translations> = { en, de, tr, pt, es };

export function detectLocaleFromLanguage(lang?: string | null): Locale {
  const normalized = (lang ?? '').toLowerCase();
  if (normalized.startsWith('de')) return 'de';
  if (normalized.startsWith('es')) return 'es';
  if (normalized.startsWith('tr')) return 'tr';
  if (normalized.startsWith('pt')) return 'pt';
  return 'en';
}

export function getTranslations(locale: Locale): Translations {
  return locales[locale];
}

export function htmlLang(locale: Locale): string {
  return locale === 'pt' ? 'pt-BR' : locale;
}

export const defaultTranslations = en;
