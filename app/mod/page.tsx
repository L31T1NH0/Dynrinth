import type { Metadata } from 'next';
import {
  ArrowDownTrayIcon,
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  CommandLineIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import ChatMock from './ChatMock';
import { Wordmark } from '@/components/Wordmark';

export const metadata: Metadata = {
  title: 'Dynrinth Mod',
  description: 'Install Minecraft modpacks from a code with /dynrinth <code>',
};

const GITHUB_URL   = 'https://github.com/L31T1NH0/dynrinth-mod';
const RELEASES_URL = `${GITHUB_URL}/releases/latest`;

const STEPS = [
  {
    Icon:  MagnifyingGlassIcon,
    n:     '01',
    title: 'Build your list',
    body:  'Search and queue mods on dynrinth.vercel.app, then click "Share to Minecraft".',
  },
  {
    Icon:  CommandLineIcon,
    n:     '02',
    title: 'Run the command',
    body:  'Join any world or server and type /dynrinth followed by your 10-char code.',
  },
  {
    Icon:  RocketLaunchIcon,
    n:     '03',
    title: 'Restart & play',
    body:  "Everything lands in /mods automatically. Restart the game and you're in.",
  },
];

const COMMANDS = [
  { cmd: '/dynrinth <code>',        desc: 'Install a modpack'        },
  { cmd: '/dynrinth <code> force',  desc: 'Skip version check'       },
  { cmd: '/dynrinth remove <code>', desc: 'Uninstall a modpack'      },
];

const PLATFORMS = [
  { label: 'Fabric',   range: '1.18.2 – latest' },
  { label: 'NeoForge', range: '1.21.1+'          },
  { label: 'Paper',    range: '1.21.1+'          },
];

function Divider() {
  return <div className="h-px bg-line-subtle mx-6 max-w-2xl w-[calc(100%-3rem)] self-center" />;
}

export default function ModPage() {
  return (
    <main className="min-h-dvh bg-bg-base text-ink-primary font-sans flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-3.5 border-b border-line-subtle bg-bg-base shrink-0 h-12">
        <a href="/" className="shrink-0">
          <Wordmark />
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-ink-tertiary hover:text-ink-primary transition-colors"
        >
          <CodeBracketIcon className="w-3.5 h-3.5" />
          Source
        </a>
      </header>

      {/* ── Hero ── */}
      <section className="flex flex-col items-center text-center px-6 pt-12 pb-10 gap-5 max-w-2xl mx-auto w-full">
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dynrinth-wordmark.svg" alt="Dynrinth" className="h-12 w-auto block translate-x-9 -mt-3 mb-6" />
          <h1 className="text-[1.75rem] font-semibold tracking-tight leading-tight">
            Install modpacks<br />
            <span className="text-brand">in one command</span>
          </h1>
          <p className="text-ink-secondary text-[14px] leading-relaxed max-w-sm mx-auto">
            Share a mod list as a 10-char code. Recipients type{' '}
            <code className="text-brand font-mono text-[13px]">/dynrinth CODE</code>{' '}
            in-game and everything downloads automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-5 rounded-lg bg-brand text-brand-dark text-[13px] font-semibold flex items-center gap-2 hover:bg-brand-hover active:scale-95 transition-all"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Download
          </a>
          <a
            href="/"
            className="h-9 px-5 rounded-lg bg-bg-surface border border-line text-ink-secondary text-[13px] font-medium flex items-center gap-2 hover:text-ink-primary hover:border-line-strong active:scale-95 transition-all"
          >
            Build your modpack
          </a>
        </div>

        <ChatMock />
      </section>

      <Divider />

      {/* ── How it works ── */}
      <section className="flex flex-col items-center px-6 py-10 max-w-2xl mx-auto w-full gap-8">
        <p className="text-[9px] font-medium text-ink-tertiary uppercase tracking-widest self-start">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {STEPS.map(({ Icon, n, title, body }) => (
            <div key={n} className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-glow border border-brand/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-brand" />
                </div>
                <span className="text-[10px] font-mono text-ink-tertiary">{n}</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold">{title}</p>
                <p className="text-[12px] text-ink-secondary mt-1 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Commands ── */}
      <section className="flex flex-col items-center px-6 py-10 max-w-2xl mx-auto w-full gap-6">
        <p className="text-[9px] font-medium text-ink-tertiary uppercase tracking-widest self-start">
          Commands
        </p>
        <div className="w-full flex flex-col divide-y divide-line">
          {COMMANDS.map(c => (
            <div key={c.cmd} className="flex items-center justify-between gap-4 py-3">
              <code className="text-brand font-mono text-[12px] shrink-0">{c.cmd}</code>
              <span className="text-[12px] text-ink-tertiary text-right">{c.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Platforms ── */}
      <section className="flex flex-col items-center px-6 py-10 max-w-2xl mx-auto w-full gap-6">
        <p className="text-[9px] font-medium text-ink-tertiary uppercase tracking-widest self-start">
          Supported platforms
        </p>
        <div className="w-full flex flex-col divide-y divide-line">
          {PLATFORMS.map(p => (
            <div key={p.label} className="flex items-center justify-between py-3">
              <span className="text-[13px] font-medium">{p.label}</span>
              <span className="text-[11px] font-mono text-ink-tertiary">{p.range}</span>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Callout ── */}
      <section className="flex flex-col items-center px-6 py-10 max-w-2xl mx-auto w-full">
        <div className="w-full rounded-lg border border-brand/20 bg-brand-glow px-4 py-3.5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium">Don't have a code yet?</p>
            <p className="text-[12px] text-ink-secondary mt-0.5">
              Build your mod list on dynrinth.vercel.app and share it in seconds.
            </p>
          </div>
          <a
            href="/"
            className="shrink-0 h-8 px-4 rounded-lg bg-brand text-brand-dark text-[12px] font-semibold flex items-center gap-1.5 hover:bg-brand-hover transition-colors"
          >
            Open
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-line-subtle px-6 py-4 flex items-center justify-center mt-auto">
        <span className="text-[11px] text-ink-tertiary">
          MIT License ·{' '}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink-primary transition-colors"
          >
            L31T1NH0
          </a>
        </span>
      </footer>

    </main>
  );
}
