'use client';

import { useState, useEffect } from 'react';

const LINES = [
  { prefix: '>',  text: '/dynrinth ABC1234567X',                              type: 'input'    },
  { prefix: '◆',  text: 'Fetching modpack…',                                 type: 'info'     },
  { prefix: '◆',  text: 'Resolving 12 mods for MC 1.21.1…',                  type: 'info'     },
  { prefix: '⬇',  text: 'Downloading (3/12) sodium-fabric-0.6.jar',           type: 'progress' },
  { prefix: '⬇',  text: 'Downloading (9/12) lithium-fabric-0.14.jar',         type: 'progress' },
  { prefix: '✓',  text: 'Done! 12 mod(s) installed. Restart to activate.',    type: 'ok'       },
] as const;

const DELAYS = [200, 700, 1200, 1800, 2400, 3200];

export default function ChatMock() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const timers = DELAYS.map((delay, i) =>
      setTimeout(() => setVisible(i + 1), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full mt-2 rounded-xl bg-bg-card border border-line overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-line bg-bg-surface">
        <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
        <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
        <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
        <span className="ml-2 text-[10px] text-ink-tertiary font-mono">Minecraft chat</span>
      </div>
      <div className="px-4 py-4 flex flex-col gap-1.5 min-h-[120px]">
        {LINES.map((line, i) =>
          i < visible ? (
            <div
              key={i}
              className="flex items-start gap-2.5 font-mono text-[12px] leading-snug text-left animate-fadeIn"
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
        {visible < LINES.length && (
          <span className="inline-block w-1.5 h-3.5 bg-ink-tertiary animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  );
}
