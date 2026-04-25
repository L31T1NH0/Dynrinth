'use client';

import { useState } from 'react';

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
    <div className="flex items-center gap-2 bg-bg-card border border-line rounded-lg px-3 py-2">
      <span className="text-ink-secondary text-[12px] shrink-0">Type in Minecraft:</span>
      <code className="text-brand font-mono text-[13px]">{command}</code>
      <button
        onClick={handleCopy}
        className="ml-1 text-[11px] px-2 py-0.5 rounded bg-bg-hover text-ink-secondary hover:text-ink-primary transition-colors border border-line shrink-0"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
