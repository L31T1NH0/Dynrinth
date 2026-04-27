'use client';

import { useState, useEffect } from 'react';

type ChatLine = {
  prefix: string;
  text: string;
  type: 'input' | 'info' | 'progress' | 'ok';
};

export default function ChatMock({ title, lines, fontClassName }: { title: string; lines: ChatLine[]; fontClassName?: string }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    const timers = lines.map((_, i) =>
      200 + i * 500,
    ).map((delay, i) =>
      setTimeout(() => setVisible(i + 1), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [lines]);

  return (
    <div className="w-full mt-2 rounded-xl bg-bg-card border border-line overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-line bg-bg-surface">
        <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
        <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
        <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
        <span className="ml-2 text-[8px] text-ink-tertiary font-mono">{title}</span>
      </div>
      <div className={`px-4 py-4 flex flex-col gap-1.5 h-[180px] overflow-hidden${fontClassName ? ` ${fontClassName}` : ''}`}>
        {lines.map((line, i) =>
          i < visible ? (
            <div
              key={i}
              className="flex items-start gap-2.5 text-[8px] leading-relaxed text-left animate-fadeIn [text-shadow:1px_1px_0_rgba(0,0,0,0.8)]"
            >
              <span className={
                line.type === 'ok'       ? 'text-brand shrink-0 w-3'        :
                line.type === 'progress' ? 'text-brand shrink-0 w-3'        :
                                           'text-ink-tertiary shrink-0 w-3'
              }>{line.prefix}</span>
              <span className={
                line.type === 'ok'       ? 'text-brand'         :
                line.type === 'input'    ? 'text-ink-primary'   :
                line.type === 'progress' ? 'text-ink-secondary' :
                                           'text-ink-tertiary'
              }>{line.text}</span>
            </div>
          ) : null,
        )}
        {visible < lines.length && (
          <span className="inline-block w-1.5 h-3.5 bg-ink-tertiary animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  );
}
