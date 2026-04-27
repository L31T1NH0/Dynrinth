'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 10) setVisible(false); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      href="#how-it-works"
      className={`relative z-10 text-ink-tertiary hover:text-ink-primary transition-all duration-300 pointer-events-auto ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <ChevronDownIcon className="w-5 h-5 animate-bounce" />
    </a>
  );
}
