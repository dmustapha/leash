// File: web/components/Reveal.tsx
// Tiny scroll-reveal island for the public trees (/ and /proof). Privy-FREE so it keeps the
// zero import edge to /app (INVARIANT #10). Uses IntersectionObserver (no scroll listeners) and
// falls back to visible-first: if reduced motion is requested or IO is unavailable, content shows
// immediately. Renders a plain block wrapper; adds the design-system .rise class when in view.
'use client';

import { useEffect, useRef, useState } from 'react';

export default function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className,
  style,
  ...rest
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={[shown ? 'rise' : undefined, className].filter(Boolean).join(' ')}
      style={{
        opacity: shown ? undefined : 0,
        animationDelay: shown && delay ? `${delay}ms` : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
