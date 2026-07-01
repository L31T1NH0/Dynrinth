import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { detectLocaleFromLanguage, getTranslations, htmlLang } from '@/lib/i18n-core';

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocaleFromLanguage((await headers()).get('accept-language'));
  const t = getTranslations(locale);
  return {
    metadataBase: new URL('https://dynrinth.vercel.app'),
    title: 'Dynrinth',
    description: t.meta.homeDescription,
    openGraph: {
      title: 'Dynrinth',
      description: t.meta.homeDescription,
      url: 'https://dynrinth.vercel.app',
      siteName: 'Dynrinth',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Dynrinth',
      description: t.meta.homeDescription,
    },
  };
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Dynrinth',
  url: 'https://dynrinth.vercel.app',
  description: 'Minecraft mod downloader for Modrinth and CurseForge. Search mods, shaders, datapacks and resourcepacks, resolve dependencies, and download everything as a single ZIP.',
  applicationCategory: 'GameApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = detectLocaleFromLanguage((await headers()).get('accept-language'));
  return (
    <html lang={htmlLang(locale)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Script
          id="microsoft-clarity"
          dangerouslySetInnerHTML={{
            __html:
              '(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","wnin70ru8r");',
          }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
