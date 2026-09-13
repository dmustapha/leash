# DESIGN_SYSTEM.md · LEASH · Signal Grid

The canonical source of these tokens and classes is `web/app/globals.css`. This document mirrors it.
Copy rule for every surface: no em dashes in UI copy.

## Identity
- **World statement:** keep your AI agents on a leash. A near-black world under a faint blueprint grid, where the only bright thing on any screen is the action you take and the verdict you get back. LEASH is the control layer for your AI agent fleet: identity, account, limits, funding, kill-switch, audit.
- **Accent color:** electric lime `#c6f24d`. One high-energy signal hue against neutral near-black. It marks the single thing that matters per screen: the primary action, a live tx link, an in-flight state, the kill-switch.
- **Signature element:** the Concept A "Tether" mark (the LEASH wordmark riding a single fine electric-lime leash-line with a clasp loop and snap gate before the L and a hook after the H, native to the name, the leash you can cut), a faint blueprint grid warmed by a single lime radial glow, and lime verdict beacons. Bright is reserved for the action and the verdict; everything else is near-black.
- **Invariant phrase (reuse verbatim across docs):** **"Keep your AI agents on a leash."**

## Tokens

Ready-to-paste `@theme` (Tailwind v4, CSS-first, dark-only). This mirrors the live source in `web/app/globals.css` exactly.

```css
@theme {
  /* palette - signal grid (near-black + electric lime) */
  --color-base: #0a0a0b;
  --color-surface-1: #141416;
  --color-surface-2: #1c1c1f;
  --color-surface-3: #232327;
  --color-line: #2a2a2e;
  --color-line-soft: #1e1e21;
  --color-ink: #f4f4ef;
  --color-ink-dim: #a2a29c;
  --color-ink-faint: #64645f;

  --color-accent: #c6f24d;        /* electric lime signal */
  --color-accent-hi: #d6ff6a;
  --color-accent-soft: #1e2410;

  --color-allow: #4fd08a;         /* jade - ALLOW / active / paid */
  --color-allow-soft: #0e2a1c;
  --color-deny: #ff5d6c;          /* coral - DENY / REVOKED / blocked */
  --color-deny-soft: #2a1418;

  --color-amber: var(--color-accent);       /* legacy alias -> accent */
  --color-amber-soft: var(--color-accent-soft);

  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.375rem;
  --radius-full: 999px;

  /* crisp-glow shadows (near-black world, lime accent glow) */
  --shadow-1: 0 1px 2px rgba(0,0,0,0.55), 0 6px 20px rgba(0,0,0,0.42);
  --shadow-2: 0 2px 8px rgba(0,0,0,0.6), 0 20px 50px rgba(0,0,0,0.5);
  --shadow-accent: 0 0 0 1px rgba(198,242,77,0.4), 0 10px 34px rgba(198,242,77,0.16);
  --shadow-amber: var(--shadow-accent);

  --text-display: clamp(2.2rem, 1.3rem + 3.6vw, 3.9rem);
  --text-h1: clamp(1.7rem, 1.15rem + 2vw, 2.6rem);
  --text-h2: clamp(1.3rem, 1rem + 1.15vw, 1.75rem);
  --text-stat: clamp(1.9rem, 1.3rem + 2vw, 2.8rem);
  --font-display: "Clash Display", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Manrope", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

- **Spacing:** base `0.25rem`; use multiples (0.5 / 0.75 / 1 / 1.5 / 2 / 3rem). `clamp()` for page padding (see `.wrap`).
- **Surface ladder:** `base` -> `surface-1` -> `surface-2` -> `surface-3`, each z-level a lighter fill. Variety comes from elevation, never a second color.
- **Legacy aliases:** `--color-amber` and `--shadow-amber` resolve to the accent, so any un-migrated reference adopts the Signal Grid world.

**Do's:** one accent hue only (electric lime); surfaces lighten per elevation; every radius/shadow from the token scale; verdict = jade/coral, never raw green/red; keep the base non-flat (blueprint grid + single lime glow).
**Don'ts:** no second brand hue; no ad-hoc `rounded-[17px]` or inline hex; never a bare 1px border with no elevation (use `.card`/`.panel`/`.raised`); color never carries meaning alone (always pair a verdict color with its state token text).

## Type system
| Face | Token | Role | Why |
|------|-------|------|-----|
| **Clash Display** 500/600/700 | `--font-display` | Display, headings, stat numbers, wordmark | High-contrast geometric display face gives the near-black world its one moment of confidence and scale. Headings weight 600, `letter-spacing -0.01em`, `line-height 1.04`. |
| **Manrope** 400-700 | `--font-sans` | Body, labels, paragraphs | Humanist, highly legible at small sizes on dark; keeps long honest-model copy readable at `line-height 1.55`. |
| **JetBrains Mono** 400-600 | `--font-mono` | Data, tx hashes, verdict pills, eyebrows, code, ENS names | Fixed-width signals "this is machine truth": addresses, amounts, decisions. Every on-chain value renders in mono. |

Fluid sizes: display `--text-display`, h1 `--text-h1`, h2 `--text-h2`, stat `--text-stat`; body ~1rem; caption 0.72 to 0.85rem.

## Status legend
Color never stands alone; each verdict pairs with a text token in a mono face.

| Color | State token | Primitive | Meaning |
|-------|-------------|-----------|---------|
| `#4fd08a` jade | `ALLOW` | `.pill-allow` | policy check passed; the co-signed payment settled on Hedera |
| `#ff5d6c` coral | `DENY` / `REVOKED` | `.pill-deny` | blocked at the payment rail (`OVER_CAP` / `OVER_DAILY_CAP` / `OVER_WEEKLY_CAP` / `OUTSIDE_WINDOW` / `OFF_ALLOWLIST` / `MISSING_COSIGN` / `RPC_ERROR`) or the ENS policy record was revoked |
| `#c6f24d` lime | `PENDING` / `IDLE` | `.pill-accent` / `.pill-idle` | accent; an action in flight or an awaiting-input state (not a settled verdict) |

## Craft
- **Radius (CF-1):** `--radius-sm/md/lg/xl/full`; no inline radii.
- **Elevation ladder (CF-2):** `base #0a0a0b` -> `surface-1 #141416` (card/panel) -> `surface-2 #1c1c1f` (raised/hover) -> `surface-3 #232327`; each z-level a lighter fill plus a layered shadow, never a bare border.
- **Shadow philosophy, crisp-glow (one, named):** a near-black luminous world. `--shadow-1/2` are crisp black ambient depth; `--shadow-accent` is the single lime glow used only on the primary action, focus ring, and the emblem hub.
- **Hover recipe (CF-4):** `translateY(-1px..-2px)` + step to `--shadow-2` + border lighten to `#3a3a40` (150 to 200ms `--ease-out`); `.btn-primary` swaps to `--shadow-accent`. Guarded by `@media (hover: hover)`.
- **Focus-visible recipe:** `box-shadow: 0 0 0 2px var(--color-base), 0 0 0 4px var(--color-accent)`; a double lime ring, consistent on every interactive element (`:focus-visible` base rule + `.field:focus-visible`).
- **Base texture:** faint blueprint grid (two 46px lime gridlines at 0.035 alpha) + one lime radial glow, `background-attachment: fixed`; the surface is never a flat fill.
- **Glass:** only the sticky `.nav` uses backdrop blur; content surfaces are opaque by design to keep text contrast and the near-black identity intact.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables all animation/transition globally, plus per-utility guards.

## Primitives (globals classes)
- **Layout:** `.wrap` (max 1140px) / `.wrap-narrow` (max 940px), token-clamped padding.
- **Nav:** `.nav` (sticky, blurred), `.nav-link` (dim -> ink on hover; accent on `aria-current`).
- **Surfaces:** `.card` (surface-1 + radius-lg + shadow-1), `.panel` (surface-1 + radius-md), `.raised` (surface-2 + radius-md + shadow-2), `.card-hover` (lift + shadow step on hover).
- **Buttons:** `.btn`, `.btn-primary` (lime gradient on near-black ink, weight 700), `.btn-ghost`, `.btn-danger` (coral), `.btn-sm`; all >=44px target (36px for `-sm`).
- **Pills:** `.pill` + `.pill-allow` / `.pill-deny` / `.pill-accent` / `.pill-idle`, mono verdict pills.
- **Data:** `.badge`, `.stat-num` (display face, `--text-stat`), `.meter` + `.meter-fill` (lime gradient), `.dot-live` (jade live pulse), `.link-tx` (lime underlined tx link).
- **Forms:** `.field` (elevated mono input, lime focus ring), `.toast` + `.toast-ok` / `.toast-err`.
- **Type helpers:** `.eyebrow` (mono uppercase tracked caption), `.code` (mono pre-wrap), `.label`, `.divider`.

## Motion (named by state)
- **Entrance:** `.fade-in` -> `@keyframes enter-fade` (320ms, opacity). `.rise` -> `@keyframes enter-rise` (460ms, opacity + `translateY(14px)`), with staggers `.rise-1..6` (60ms steps).
- **In-flight:** `.spin` -> `@keyframes spin` (0.7s linear).
- **Verdict:** `.flip-in` -> `@keyframes verdict-flip` (420ms `--ease-spring`, the ALLOW/DENY reveal).
- **Liveness:** `.dot-live` -> `@keyframes live-pulse` (2.4s jade ring pulse).
- **Default transition:** 150ms `--ease-out` on transform/box-shadow/background/border-color.
- All of the above are disabled under `prefers-reduced-motion`.
