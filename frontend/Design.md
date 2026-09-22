# Design System: English Connection Dashboard

## 1. Overview

A premium dark dashboard UI inspired by modern language-learning platforms. Dark background with vibrant orange/amber primary accent and purple secondary. Frosted glass panels over animated light orbs. Clean horizontal navbar with tab navigation.

## 2. Colors

- **Background:** `#0b0e14`
- **Surface tiers:** `#10131a` → `#1c2028` → `#22262f`
- **Primary gradient:** `#f59e0b` → `#f97316` (orange/amber — buttons, active states, XP indicators)
- **Secondary gradient:** `#b79fff` → `#ab8eff` (purple — charts, decorative accents)
- **Cyan accent:** `#00e3fd` (info states, XP chip in navbar)
- **Pink accent:** `#ff6c95` (destructive, alerts)
- **Green:** `#22c55e` (success, active-day checkmarks)
- **Text — headings:** `#ecedf6` (never pure white)
- **Text — body:** `#a9abb3`
- **Ghost borders:** `rgba(255,255,255,0.06)` with brighter top edge `rgba(255,255,255,0.10)`

## 3. Typography

- **Display/Headlines:** Plus Jakarta Sans
- **Body/UI:** Manrope
- **Mono:** Fira Code

## 4. Corner Radii

- `--radius: 0.5rem` — inputs, small elements
- `rounded-xl` (1rem) — cards, panels, modals
- `rounded-2xl` (1.25rem) — dashboard cards, feature cards
- `rounded-full` — buttons, chips, nav tabs (pill shape)

## 5. Layout — Dashboard Shell

### Navbar (top bar)

Sticky, full-width, dark semi-transparent with blur. Height: 64px.

- **Left:** 4 horizontal nav tabs as pills (Jumble Words, Pronunciation, AI Partner, Leaderboard). Active tab gets `bg-primary/20 text-primary`.
- **Center:** Logo + brand name "English Connection".
- **Right:** XP chip (orange) + Level chip (purple) + Profile (avatar + name + "Student" subtitle + chevron dropdown).

### Content area

Max-width 1400px, centered. Padding: `px-4 md:px-6 lg:px-8`, vertical: `py-8 lg:py-10`.

### Dashboard page

Top section: 2-column grid.
- Left: Welcome hero card (glass panel, greeting, CTA buttons).
- Right: Weekly activity chart (PRO card with level/sessions/streak + stacked bar chart with day labels + activity checkmarks).

Bottom section: "Trainings" — 4 feature cards in a row (Jumble Words orange, Pronunciation purple, AI Partner green, Leaderboard cyan). Each card has icon, title, subtitle, arrow link.

## 6. Ambient Floating Orbs

Five DOM elements rendered in the root layout behind all content. Large radial gradient circles (400-600px) at varying opacities (10-22%), blurred at 80px, drifting on independent animation paths (16-25s cycles). They serve as the colored light source that frosted glass panels refract.

## 7. Frosted Glass Panels

Every panel in the app uses the same frosted glass recipe. Three tiers:

**`.c-box`** — Standard panels:
```
background: rgba(16, 19, 26, 0.55);
backdrop-filter: blur(20px) saturate(140%) brightness(1.05);
border: 1px solid rgba(255, 255, 255, 0.06);
border-top-color: rgba(255, 255, 255, 0.10);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
```

**`.glass`** — Lighter overlays (modals, popovers):
Same but `background: rgba(34, 38, 47, 0.35)` and `saturate(150%) brightness(1.08)`

**`.glass-glow`** — Interactive panels with pointer-following glow border.

Key principles:
- `saturate()` + `brightness()` in the backdrop-filter
- Top border slightly brighter than sides
- Background opacity is 55% — transparent enough for orbs to bleed through

## 8. Pointer-Following Glow Border

Conic-gradient masked to a 1.5px border ring that follows the cursor.
Config: `--glow-spread: 90` (degree arc), colors cycle `#f59e0b → #f97316 → #b79fff`.

## 9. Buttons

- **Primary:** `rounded-full`, gradient `#f59e0b → #f97316`, orange glow shadow
- **Secondary/Ghost:** Glass-morphic — `surface-variant/30`, backdrop-blur, ghost border
- **Icon:** `rounded-xl`, same glass or gradient treatment

## 10. Feature Cards (Training section)

Each card has:
- Colored gradient background at low opacity (`from-[color]/20 to-[color]/10`)
- Matching border at low opacity
- Icon in a dark surface circle
- Title + subtitle
- Arrow link with hover translate

Accent mapping: Jumble Words = orange, Pronunciation = purple, AI Partner = green, Leaderboard = cyan.

## 11. Activity Chart

The WeeklyActivityChart component shows:
- Left: Orange gradient "PRO" card with level, sessions, streak stats
- Right: 7-day stacked bar chart (purple segments for jumble/pronunciation/ai-partner) with day labels and green activity checkmarks

## 12. Accessibility

- `prefers-reduced-motion: reduce` — freezes all orb animations and glow transitions
- `prefers-reduced-transparency: reduce` — replaces all glass with solid `#10131a`, hides glow pseudos
- Text contrast maintained at 4.5:1+ (WCAG AA)
- All orbs are `aria-hidden="true"`

## 13. Tech Stack

Use shadcn/ui and Tailwind CSS as the UI library. All shadcn tokens mapped via CSS variables in globals.css so components inherit the theme automatically.
