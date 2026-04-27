'use client';

import { useState } from 'react';

export function PillToggle<T extends string>({
  options,
  active,
  onToggle,
  primaryCount,
}: {
  options:      { id: T; label: string }[];
  active:       T | null;
  onToggle:     (id: T) => void;
  primaryCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasSecondary = primaryCount !== undefined && options.length > primaryCount;
  const activeIsSecondary = hasSecondary && active !== null && options.findIndex(o => o.id === active) >= primaryCount!;
  const showAll = expanded || activeIsSecondary;
  const visible = hasSecondary && !showAll ? options.slice(0, primaryCount) : options;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map(o => (
        <button
          key={o.id}
          onClick={() => onToggle(o.id)}
          className={[
            'h-7 px-3 rounded-md text-[11px] transition-all duration-150 font-medium',
            active === o.id
              ? 'bg-brand-glow border border-brand text-brand'
              : 'bg-bg-surface text-ink-secondary hover:text-ink-primary hover:bg-bg-hover',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
      {hasSecondary && !showAll && (
        <button
          onClick={() => setExpanded(true)}
          className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-bg-surface text-ink-secondary hover:text-ink-primary hover:bg-bg-hover transition-all duration-150"
        >
          +
        </button>
      )}
      {hasSecondary && showAll && !activeIsSecondary && (
        <button
          onClick={() => setExpanded(false)}
          className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-bg-surface text-ink-secondary hover:text-ink-primary hover:bg-bg-hover transition-all duration-150"
        >
          −
        </button>
      )}
    </div>
  );
}
