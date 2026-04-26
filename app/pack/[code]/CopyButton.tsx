'use client';

import { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function CopyButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      prompt(command);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-2 rounded-lg bg-bg-card/90 border border-line px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition-all duration-150 hover:border-brand/40 hover:bg-brand-dark/30"
      title="Copiar comando"
    >
      <code className="text-brand font-mono text-[11px] sm:text-[12px] leading-none">{command}</code>
      <span className="shrink-0 text-ink-tertiary group-hover:text-brand transition-colors">
        {copied
          ? <CheckIcon className="w-3.5 h-3.5 text-brand" />
          : <ClipboardIcon className="w-3.5 h-3.5" />
        }
      </span>
    </button>
  );
}
