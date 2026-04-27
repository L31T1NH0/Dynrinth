import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-bg-base text-ink-primary font-sans flex flex-col">
      <header className="flex items-center px-3.5 border-b border-line-subtle h-12 shrink-0">
        <Link href="/">
          <Wordmark />
        </Link>
      </header>

      <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
        <span className="text-[10px] font-mono text-ink-tertiary uppercase tracking-widest">404</span>
        <h1 className="text-[1.5rem] font-semibold tracking-tight">Page not found</h1>
        <p className="text-ink-secondary text-[13px] max-w-xs leading-relaxed">
          This page doesn&apos;t exist or the modpack code is invalid.
        </p>
        <Link
          href="/"
          className="mt-2 h-9 px-5 rounded-lg bg-brand text-brand-dark text-[13px] font-semibold flex items-center gap-2 hover:bg-brand-hover active:scale-95 transition-all"
        >
          Go to Dynrinth
        </Link>
      </div>
    </main>
  );
}
