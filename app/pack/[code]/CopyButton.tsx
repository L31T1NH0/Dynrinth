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
      className="group flex items-center gap-2.5 rounded-lg bg-bg-card border border-line px-3 py-2 transition-colors hover:border-brand/40 hover:bg-brand-dark/30"
    >
      <code className="text-brand font-mono text-[12px] leading-none">{command}</code>
      <span className="shrink-0 text-ink-tertiary group-hover:text-brand transition-colors">
        {copied
          ? <CheckIcon className="w-3.5 h-3.5 text-brand" />
          : <ClipboardIcon className="w-3.5 h-3.5" />
        }
      </span>
    </button>
  );
}
