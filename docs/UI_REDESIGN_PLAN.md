# Wellspire UI/UX Modernization Plan

Every step below is specified **before** implementation, then executed in order.
Two design resources drive this pass:

1. **taste-skill** (`Leonxlnx/taste-skill`, installed at `.agents/skills/`) — anti-slop
   design discipline: read the brief first, set dials, avoid LLM-default aesthetics.
2. **Vercel Web Interface Guidelines**
   (`vercel-labs/web-interface-guidelines/command.md`) — accessibility, focus states,
   forms, animation, typography, content-handling and anti-pattern rules.

---

## Step 1 — Design read & dials (taste-skill §0–1)

> **Reading this as:** redesign of a trust-first school marketing site (**Surface 1:
> the client website**, `/website`) plus its internal school ERP (**Surface 2: the
> backend portal**, `/`), for parents, students and staff in Hyderabad — a
> premium-but-warm academic language that PRESERVES the real Wellspire brand
> (navy `#233F88` + gold `#DCBA63` + green accent on the website; biophilic green +
> gold in the portal; Roboto Slab serif display).

Dials — website: `VARIANCE 6 · MOTION 3 · DENSITY 3` (trust-first override).
Dials — portal: `VARIANCE 4 · MOTION 2 · DENSITY 5` (product UI, clarity first).
Anti-default discipline: no AI-purple, no mesh-gradient heroes, no glassmorphism
spam; we refine the existing navy/gold/green system instead of replacing it.

## Step 2 — Surface 1: Client website theme modernization (`server/public/site/`)

- **2.1 Tokens** (`style.css` `:root`): layered softer shadows, extra radius steps
  (`--r-sm`, `--r-lg`), a fluid space scale; keep the brand palette untouched.
- **2.2 Typography**: fluid `clamp()` already on headings — extend `text-wrap:
  pretty` to body copy, `tabular-nums` on the stats band, typographic ellipsis `…`.
- **2.3 Interaction states** (Vercel rules): replace `transition:.18s` (an implicit
  `transition: all` anti-pattern) with explicit property lists; hover transforms
  gated behind `prefers-reduced-motion`; visible `:focus-visible` rings on all
  buttons/links; `touch-action: manipulation` on interactive elements.
- **2.4 Nav**: stronger glass effect, safe-area padding, active-link clarity.
- **2.5 Cards/sections**: unified hover behaviour (border-color + subtle lift),
  consistent radius, image `loading="lazy"` below the fold.
- **2.6 NEW — Client guide section** (`index.html#guide`): "One school, two doors"
  — two clear cards that explain and link the surfaces:
  - **School Website** → for families & visitors: explore academics, campus,
    admissions, send an enquiry.
  - **Family & Staff Portal** → for daily school life: fees, attendance,
    timetable, learning & tests, transport.
  Plus a 3-step journey strip: ① Explore & enquire → ② Visit & apply → ③ Sign in
  daily. Footer quick-links gain a "New family guide" link on every page.
- **2.7 A11y audit** per Vercel command.md across all 7 pages (labels, focus,
  alt text, reduced motion).

## Step 3 — Surface 2: Backend portal theme modernization (`web/src/`)

- **3.1 `index.css`**: global `:focus-visible` ring (brand-colored) instead of
  `focus:` only; `color-scheme` + selection color; `text-wrap: balance` on
  headings; `tabular-nums` for table numerals; `overscroll-behavior: contain`
  for modals; `touch-action: manipulation`; button transitions listed explicitly.
- **3.2 Component classes**: `.card` hover polish, `.btn` focus-visible +
  active states, `.input` consistent focus ring.
- **3.3 No palette change** — the green/gold portal identity stays; only the
  interaction/clarity layer is upgraded.

## Step 4 — Verify & test

- `vite build` clean; new strings present in the bundle.
- Local smoke: server boots, `/website/index.html` contains `#guide`.
- Deploy to Render; live checks: all 7 site pages 200 + guide section live,
  portal routes 200, focus/interaction CSS shipped.

## Step 5 — Show

- Report the before/after summary of every change with live URLs.
