# DESIGN_SYSTEM.md — LEASH

## Identity
- **World statement:** a calm, editorial control-room for money that agents spend — near-black and warm, where the only bright thing is the action you take and the verdict you get back.
- **Accent color:** amber `#f2a63b` — a single warm signal hue against neutral near-black; it marks the one thing that matters on each screen (the primary action, a live tx link, an in-flight state).
- **Signature element:** muted jewel-tone verdict pills (jade `#4fae7a` ALLOW / garnet `#d16060` DENY·REVOKED) rendered in a mono code face, over a near-black base warmed by a faint amber+jade radial vignette so the surface is never a flat fill.
- **Invariant phrase (reuse verbatim ≥3 docs):** **"LEASH is the ENS name that can un-pay it."**

## Tokens

Ready-to-paste `@theme` (Tailwind v4, CSS-first — dark-only; this is the live source in `web/app/globals.css`):

```css
@theme {
  /* palette — warm-editorial-dark */
  --color-base: #0b0b0d;        /* near-black page */
  --color-surface-1: #141417;   /* elevation 1 (card) */
  --color-surface-2: #1c1c21;   /* elevation 2 (raised / hover) */
  --color-line: #2a2a31;        /* hairline */
  --color-ink: #f4f1ea;         /* warm off-white text */
  --color-ink-dim: #a8a29a;     /* secondary text */
  --color-ink-faint: #6b665e;   /* tertiary / captions */
  --color-amber: #f2a63b;       /* accent */
  --color-amber-soft: #3a2a12;  /* amber wash bg */
  --color-allow: #4fae7a;       /* muted jade — ALLOW */
  --color-allow-soft: #12261d;
  --color-deny: #d16060;        /* muted garnet — DENY / REVOKED */
  --color-deny-soft: #2a1416;
  /* radius scale (CF-1) */
  --radius-sm: 0.375rem; --radius-md: 0.625rem; --radius-lg: 1rem; --radius-full: 999px;
  /* shadow scale — pure-glow (CF-5) */
  --shadow-1: 0 1px 2px rgba(0,0,0,.5), 0 4px 14px rgba(0,0,0,.35);
  --shadow-2: 0 2px 6px rgba(0,0,0,.55), 0 16px 40px rgba(0,0,0,.45);
  --shadow-amber: 0 0 0 1px rgba(242,166,59,.35), 0 8px 30px rgba(242,166,59,.12);
  /* fluid type (CF-6) */
  --text-display: clamp(2rem, 1.2rem + 3vw, 3.25rem);
  --text-h2: clamp(1.25rem, 1rem + 1vw, 1.6rem);
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
}
```

- **Spacing:** base `0.25rem`; use multiples (0.5 / 0.75 / 1 / 1.5 / 2 / 3rem). `clamp()` for page padding (`clamp(2rem,5vw,5rem)`).
- **Type:** display `--text-display`, section `--text-h2`, body ~1rem/1.05rem, caption 0.72–0.85rem. Headings weight 600, letter-spacing `-0.02em`. Mono for code/tx/eyebrow.

**Do's:** one accent hue only (amber); surfaces lighten per elevation (base → surface-1 → surface-2); every radius/shadow from the token scale; verdict = jade/garnet, never raw green/red.
**Don'ts:** no second brand hue (surface variety comes from opacity/elevation, not color); no ad-hoc `rounded-[17px]` or inline hex; never a bare 1px border with no elevation (use `.card`/`.panel`); color never carries meaning alone — always pair a verdict color with its state token text.

## Status Legend
| Color | State token | Meaning |
|-------|-------------|---------|
| `#4fae7a` jade | `ALLOW` | policy check passed; co-signed payment settled gas-free on Hedera |
| `#d16060` garnet | `DENY` / `REVOKED` | blocked at the payment rail (`OVER_CAP` / `OVER_DAILY_CAP` / `OVER_WEEKLY_CAP` / `OUTSIDE_WINDOW` / `OFF_ALLOWLIST` / `MISSING_COSIGN` / `RPC_ERROR`) or the ENS policy record was revoked |
| `#f2a63b` amber | `PENDING` / `IDLE` | accent — an action in flight or awaiting input (not a settled verdict) |

## Craft
- **Radius (CF-1):** `--radius-sm/md/lg/full`; no inline radii.
- **Elevation ladder (CF-2):** `base #0b0b0d` → `surface-1 #141417` (card) → `surface-2 #1c1c21` (raised/hover); each z-level lighter, plus a layered shadow — never a bare border.
- **Shadow philosophy — pure-glow (one, named):** dark luminous world; `--shadow-1/2` are soft black ambient depth, `--shadow-amber` is the accent glow used only on the primary action + focus.
- **Hover recipe (CF-4):** `translateY(-1px)` + step to `--shadow-2` + border lighten to `#3a3a44` (150ms ease); `.btn-primary` swaps to `--shadow-amber`. Guarded by `@media (hover:hover)`.
- **Focus-visible recipe:** `box-shadow: 0 0 0 2px var(--color-base), 0 0 0 4px var(--color-amber)` — a double amber ring, consistent on every interactive element (`:focus-visible` base rule + `.field:focus-visible`).
- **Glass:** none (opaque elevation by design; keeps text contrast ≥4.5:1 and the near-black identity intact).
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables all animation/transition globally.

## Primitives
- `.card` — surface-1 + `--radius-lg` + `--shadow-1` (content container).
- `.panel` — surface-1 + `--radius-md` + `--shadow-1` (tighter block).
- `.btn` / `.btn-primary` — ≥44px target, radius-md, hover transform+shadow; primary = amber gradient on dark ink text.
- `.field` — elevated input (surface-1 + shadow-1), amber focus ring.
- `.pill` + `.pill-allow` / `.pill-deny` / `.pill-amber` / `.pill-idle` — mono verdict pills.
- `.eyebrow` — mono, uppercase, tracked caption. `.code` — mono pre-wrap. `.link-tx` — amber underlined tx link.

## Motion
- Vocabulary: `.fade-in` (260ms ease, `translateY(4px)→0`) for entrances; `.spin` (0.7s linear) for in-flight.
- Default transition: 150ms ease on transform/box-shadow/background/border-color.
- Stagger: entrance fades may stagger ~40–60ms per row on lists; disabled under reduced-motion.
