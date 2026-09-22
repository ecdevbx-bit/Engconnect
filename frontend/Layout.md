# Layout Patterns

A reusable, project-agnostic guide to the layout system: how pages, cards,
tabs, settings screens, and navigation are composed. `DESIGN.md` covers the
visual language (color, type, tokens, motion); **this file covers structure
and composition** — the skeletons you reach for when building a new screen.

Everything here is written as a *pattern*: its anatomy, when to use it, a
copy-able skeleton, and the rules that keep it consistent. It is deliberately
generic — swap class names for your own token set and the patterns still hold.

---

## How to read & extend this document

- Each pattern is numbered and self-contained. Read the **Anatomy** first, then
  the **Skeleton**, then the **Rules**.
- Class names use a generic convention — read them as roles, not literals:
  - `glass` — a frosted surface (semi-transparent bg + backdrop blur).
  - `eyebrow` — a tiny uppercase label above a heading.
  - `surface-1/2/3` — background tiers from deepest to highest.
  - `accent` — the brand/primary color.
- To **add a new pattern**, copy the template at the bottom (§9) and append it.
  Keep the numbered structure so the table of contents stays predictable.

### Index

| # | Pattern | Use it for |
|---|---------|-----------|
| 0 | [Foundational principles](#0-foundational-principles) | The rules every layout obeys |
| 1 | [Page shell & layout grid](#1-page-shell--layout-grid) | The outermost frame of every screen |
| 2 | [Page header](#2-page-header) | The top of any content page |
| 3 | [Cards](#3-cards) | Any bounded, self-contained unit |
| 4 | [Tabs & segmented controls](#4-tabs--segmented-controls) | Switching views within one screen |
| 5 | [Settings pages](#5-settings-pages) | Preference & configuration screens |
| 6 | [Navbar & sidebar](#6-navbar--sidebar) | Global navigation |
| 7 | [Dropdown & popover menus](#7-dropdown--popover-menus) | Contextual menus and account panels |
| 8 | [List rows & feeds](#8-list-rows--feeds) | Repeating items: notifications, activity |
| 9 | [Pattern template](#9-pattern-template) | Adding your own |

---

## 0. Foundational principles

These hold across every pattern. When a decision is unclear, fall back here.

1. **One shell, many pages.** The outer frame (navbar + sidebar + content
   column) is defined *once*. Pages only ever render into the content column —
   they never re-implement navigation or page chrome.

2. **Compose top-down: Shell → Header → Section → Card → Row.** Each level has
   exactly one job. A card never knows about the page grid; a row never knows
   about the card. This is what makes the system extensible — new screens are
   assembled, not authored.

3. **Surfaces are tiered, not flat.** Establish 3–4 background tiers and stack
   them: page background (deepest) → card → nested tile → control. A surface is
   always *one tier brighter* than what sits behind it. Never put a surface on a
   same-tier surface — depth is read from contrast, not borders alone.

4. **Borders are hairlines.** `1px` at low opacity (`~6–12%`). Borders define
   edges; **elevation and contrast** define hierarchy. Heavy borders are a smell.

5. **Radius scales with size.** Controls `rounded-full` (pills) or small radius;
   cards medium radius; large containers/panels large radius. A big radius on a
   small element looks like a bug; a small radius on a big panel looks cheap.

6. **Spacing is rhythmic.** Use one scale (`4 / 8 / 12 / 16 / 24 / 32 / 48`).
   Inside a card: `12–20`. Between sections: `32–48`. Between sibling cards:
   `12–16`. Pick once per context and repeat it — irregular gaps read as bugs.

7. **Every interactive surface has 4 states.** rest → hover → active/selected →
   disabled. Selected is *filled* (accent background); hover is a *subtle lift*
   (brighter surface). Never let hover and selected look the same.

8. **Mobile is a reflow, not a redesign.** Multi-column grids collapse to a
   single stacked column; horizontal tab strips become scroll-snap rails;
   matrix layouts (§5) stack their columns into inline chips. Same components,
   different `grid-template`.

9. **Label everything with an eyebrow.** A tiny uppercase tracked label above a
   heading orients the user instantly and costs almost no space. Use it on page
   headers, card groups, and section dividers.

---

## 1. Page shell & layout grid

The outermost frame. Defined once; every route renders inside it.

### Anatomy

```
┌──────────────────────────────────────────────────────┐
│  NAVBAR  (sticky, full width, ~76px, z-30)            │
├────┬─────────────────────────────────────────────────┤
│ S  │                                                 │
│ I  │   CONTENT COLUMN                                 │
│ D  │   max-width, centered, responsive side padding   │
│ E  │                                                 │
│ B  │   (pages render here — header, sections, cards)  │
│ A  │                                                 │
│ R  │                                                 │
└────┴─────────────────────────────────────────────────┘
```

- **Navbar** — sticky to top, spans full width, sits above all content (`z-30`).
- **Sidebar** — a fixed icon rail on the left (desktop only). Collapsed by
  default (~68px), expands on hover/lock (~232px). Hidden on mobile.
- **Content column** — capped width (`~1400px`), centered, with side padding
  that grows by breakpoint (`12px → 24px → 32px`).

### Skeleton

```tsx
<div className="min-h-screen bg-surface-0">
  <Navbar />                              {/* sticky top-0 z-30 */}
  <div className="flex">
    <Sidebar />                           {/* fixed rail, hidden on mobile */}
    <main className="mx-auto w-full max-w-[1400px] px-3 md:px-6 lg:px-8">
      {children}                          {/* the page */}
    </main>
  </div>
</div>
```

### Multi-column page layouts

Content-heavy pages (feed, dashboards) split the content column into rails.
The canonical layout is **three columns**:

```
┌─────────────┬───────────────────────────┬─────────────┐
│ LEFT RAIL   │  PRIMARY COLUMN           │ RIGHT RAIL  │
│ ~280px      │  1fr (flex-grow)          │ ~320px      │
│             │                           │             │
│ identity,   │  the main content stream  │ featured,   │
│ shortcuts,  │  (tabs + feed + compose)  │ suggestions │
│ upsell      │                           │             │
└─────────────┴───────────────────────────┴─────────────┘
```

- **Left rail** — identity & navigation context (who am I, my shortcuts).
- **Primary column** — the actual job of the page. Flex-grows to fill.
- **Right rail** — discovery & ancillary content (featured, suggestions, ads).
- Rails are **fixed width**; the primary column is **fluid** (`1fr`).
- On tablet, drop the right rail. On mobile, stack all three vertically with
  the primary column first.

### Rules

- Pick a max content width and never exceed it — long lines hurt readability.
- Side padding is responsive; vertical rhythm between sections is not (keep it
  constant so pages feel related).
- The shell is **not** a page component. Pages must be droppable into the
  content column with zero knowledge of navigation.

---

## 2. Page header

The first thing on every content page. Orients the user before they scan.

### Anatomy

```
┌────────────────────────────────────────────────────────┐
│  ICON   EYEBROW · BREADCRUMB            [ Action btn ]  │   ← optional row
│  ▢      ──────────────────                              │
│         Big Display Title                               │
│         A one-to-two line description in muted body     │
│         text, capped to a readable measure.             │
└────────────────────────────────────────────────────────┘
```

Four stacked elements, optional icon on the left, optional action on the right:

1. **Eyebrow** — tiny (`10–11px`), uppercase, wide letter-spacing, accent color.
   Doubles as a breadcrumb: `Settings · Storage`.
2. **Title** — large display font, bold. Use fluid sizing so it scales with
   viewport: `clamp(36px, 5.5vw, 64px)`.
3. **Description** — muted body text, capped to a readable measure
   (`max-width: ~2xl`), `1.5+` line-height.
4. **Action slot** *(optional)* — top-right aligned button(s): Refresh, Save,
   Create. Aligns to the *title's* baseline row, not the description.

### Skeleton

```tsx
<header className="space-y-3">
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-3">
      {icon && <IconBadge>{icon}</IconBadge>}
      <p className="text-[10px] uppercase tracking-[0.22em] text-accent">
        {eyebrow}
      </p>
      <h1 className="font-display font-bold text-[clamp(36px,5.5vw,64px)] text-heading">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-relaxed text-muted">
        {description}
      </p>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
</header>
```

### Rules

- Every content page gets a header. No exceptions — even a "blank" page reads
  better with an eyebrow + title.
- The eyebrow carries the breadcrumb. Don't add a separate breadcrumb bar.
- One `h1` per page. Section titles below are `h2`.
- The description is *one or two lines*. If it needs more, it's not a
  description — it's content.

---

## 3. Cards

A **card** is any bounded, self-contained unit with its own surface. Cards are
the workhorse of the system. They all share one base surface; variation comes
from *what you put inside*, not from new surfaces.

### 3.0 The base card surface

Every card starts here:

```
- surface: one tier brighter than its background, semi-transparent
- backdrop blur (the "glass" effect) + slight saturation boost
- hairline border (~8% opacity)
- medium radius (cards) or large radius (panels)
- soft, low shadow — depth, not drama
- hover (if interactive): surface brightens, border picks up accent tint
```

```tsx
function Card({ interactive, children }) {
  return (
    <div className={cn(
      'rounded-2xl border border-border bg-surface-1 backdrop-blur-xl',
      'shadow-[0_4px_18px_rgba(0,0,0,0.06)]',
      interactive && 'transition-all hover:bg-surface-2 hover:border-accent/25'
    )}>
      {children}
    </div>
  );
}
```

> **Innovation worth keeping:** the *glass* surface. Cards are translucent and
> blur what's behind them rather than being opaque. This makes stacked surfaces
> read as physically layered and ties a busy page together. The cost is one
> `backdrop-filter` declaration. Use it for cards, navbars, dropdowns, and
> overlays — anything that floats above content.

### 3.1 Icon–label–control card (the "setting card")

A horizontal card: leading icon, a label block, a trailing control. This is the
pattern behind the **Email / Push / In-app** channel toggles.

#### Anatomy

```
┌─────────────────────────────────────────────────┐
│  ▢   EYEBROW                                ▢▢  │
│ icon Bold Label                          toggle │
└─────────────────────────────────────────────────┘
   │       │                                  │
 icon    label block                  trailing control
 badge   (tiny eyebrow + bold title)  (switch / chevron / badge)
```

Three zones, fixed roles:
- **Leading** — an *icon badge*: icon inside a small rounded square with a
  tinted background. Gives the card an identity at a glance.
- **Middle** — flex-grows. A tiny eyebrow (the category) above a bold label.
- **Trailing** — exactly one control: a switch, a chevron, a small badge, or a
  value. Never two.

#### Skeleton

```tsx
<label className={cn(
  'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all',
  checked
    ? 'border-accent/30 bg-accent/[0.08]'      // selected: tinted
    : 'border-border bg-surface-1'             // rest
)}>
  <span className="flex h-10 w-10 items-center justify-center
                   rounded-xl bg-accent/10 text-accent">
    {icon}
  </span>
  <div className="min-w-0 flex-1">
    <p className="text-[10px] uppercase tracking-wide text-muted">{eyebrow}</p>
    <h3 className="font-display text-sm font-semibold text-heading">{label}</h3>
  </div>
  <Switch checked={checked} onChange={onToggle} />
</label>
```

#### Rules

- Wrap the whole card in a `<label>` when the trailing control is a toggle —
  the entire card becomes the hit target.
- The icon badge background is a *tint of the accent* (or a status color), not
  a solid fill. `bg-accent/10 text-accent`.
- When the card represents an on/off state, reflect it on the **whole card**
  (tinted border + background), not just the switch. The switch confirms; the
  card communicates.
- Lay these out in a responsive grid: `grid gap-3 sm:grid-cols-3`.

### 3.2 Stat / metric card

A vertical card surfacing one number. The **Storage** tiles (icon, big value,
sublabel, right-side meta tag).

#### Anatomy

```
┌──────────────────────────────┐
│  ▢                    META▸  │   ← icon badge + right-aligned meta tag
│                              │
│  61.72 GB                    │   ← the metric, large
│  ACCOUNT FILES               │   ← muted sublabel
└──────────────────────────────┘
```

#### Skeleton

```tsx
<div className="rounded-2xl border border-border bg-surface-1 p-5">
  <div className="flex items-start justify-between">
    <IconBadge>{icon}</IconBadge>
    <span className="rounded-full bg-surface-2 px-2 py-0.5
                     text-[10px] uppercase tracking-wide text-muted">
      {metaTag}
    </span>
  </div>
  <p className="mt-4 font-display text-2xl font-bold text-heading">{value}</p>
  <p className="mt-0.5 text-xs uppercase tracking-wide text-muted">{label}</p>
</div>
```

#### Rules

- **One** number per card. Multiple metrics → multiple cards in a grid.
- The number is the largest thing in the card. Everything else supports it.
- The right-side meta tag is a *category/qualifier* (e.g. file type, trend), not
  a second metric.
- Color-code the icon badge by category so a grid of tiles is scannable.

### 3.3 Media card

A card led by imagery: an event, a page, a profile. Image on top, content
below.

#### Anatomy

```
┌──────────────────────────────┐
│                              │
│        COVER IMAGE           │   ← fixed aspect ratio (16:9 / 4:3)
│                              │
├──────────────────────────────┤
│ EYEBROW (type)               │
│ ◯  Title                     │   ← avatar + title/subtitle row
│    Subtitle / venue          │
│ ───────────────────────────  │
│ 12 members        ◯◯◯ +5     │   ← footer: stat + avatar stack
└──────────────────────────────┘
```

#### Skeleton

```tsx
<Link href={href} className="block overflow-hidden rounded-xl
                            border border-border bg-surface-1
                            transition-transform hover:scale-[1.02]">
  <div className="aspect-video overflow-hidden">
    <Image src={cover} className="h-full w-full object-cover" />
  </div>
  <div className="p-4">
    <p className="text-[10px] uppercase tracking-wide text-muted">{type}</p>
    <div className="mt-2 flex items-start gap-3">
      <Avatar src={avatar} className="h-11 w-11 rounded-full" />
      <div className="min-w-0">
        <h3 className="truncate font-display font-semibold text-heading">{title}</h3>
        <p className="truncate text-sm text-muted">{subtitle}</p>
      </div>
    </div>
    <footer className="mt-3 flex items-center justify-between text-xs text-muted">
      <span>{stat}</span>
      <AvatarStack users={members} />        {/* overlapping, negative margin */}
    </footer>
  </div>
</Link>
```

#### Rules

- Lock the cover to a fixed **aspect ratio** so a grid never goes ragged.
- `object-cover` always — never let images distort.
- The whole card is one link target. Inner links (avatar → profile) need
  `stopPropagation` or careful nesting.
- Truncate title/subtitle (`truncate` / `line-clamp-2`); cards must stay equal
  height in a grid.
- Hover lifts the *whole card* slightly (`scale-[1.02]`), not the image alone.

### 3.4 Detailed card with overflow menu

A card that owns actions: a top-right `⋯` menu, an accent ribbon, structured
content. The **Address card** is the reference.

#### Anatomy

```
┌──────────────────────────────────────┐
│ ▔▔▔▔▔ accent hairline ribbon ▔▔▔▔▔   │   ← top edge gradient line
│  ▢   EYEBROW                     ⋯  │   ← icon + label + overflow menu
│ icon Title                          │
│ ─────────────────────────────────   │
│  structured body content            │   ← flex-grows
│  (monospace block, fields, etc.)     │
└──────────────────────────────────────┘
```

#### Rules

- A **gradient hairline ribbon** on the top edge (`transparent → accent → transparent`)
  marks a card as "premium" / primary without a heavy border. Cheap, distinctive.
- The `⋯` overflow menu lives top-right, aligned with the icon badge row.
- Body is `flex-1` so a grid of these stays height-aligned regardless of
  content length.
- Reserve this heavier treatment for cards the user *manages* (edit/delete), not
  for read-only display cards.

### Card decision table

| You have…                              | Use            |
|-----------------------------------------|----------------|
| An on/off setting with an icon          | §3.1 icon–label–control |
| A single number to surface              | §3.2 stat card |
| Something with a cover image            | §3.3 media card |
| A managed entity with edit/delete       | §3.4 detailed card |
| A bounded group of mixed content        | §3.0 base card |

---

## 4. Tabs & segmented controls

Switching between views of the *same* screen without navigating away. Two
forms: the **pill segmented control** (few options) and the **scrollable tab
strip** (many options).

### 4.1 Pill segmented control

For 2–4 mutually exclusive views (e.g. *Following / Global / Explore*).

#### Anatomy

```
┌─────────────────────────────────────────┐
│ ┌─────────┐ ┌────────┐ ┌─────────┐      │
│ │Your Feed│ │ Global │ │ Explore │  ●LIVE│   ← track + pills + optional status
│ └─────────┘ └────────┘ └─────────┘      │
└─────────────────────────────────────────┘
   selected      rest        rest
```

- A **track**: a pill-shaped glass container with small inner padding.
- **Pills** inside it. The selected pill is *filled* (accent gradient + glow);
  the rest are transparent with a hover surface.
- Optional **status slot** on the far right (a live indicator, a count).

#### Skeleton

```tsx
<div role="tablist" className="inline-flex items-center gap-1
                               rounded-full bg-surface-1 p-1.5 backdrop-blur-xl">
  {tabs.map((t) => (
    <button
      key={t.id}
      role="tab"
      aria-selected={t.id === active}
      onClick={() => setActive(t.id)}
      className={cn(
        'h-9 rounded-full px-4 text-xs font-semibold transition-all',
        t.id === active
          ? 'bg-gradient-to-br from-accent to-accent-dim text-white shadow-glow'
          : 'text-muted hover:bg-surface-2'
      )}
    >
      {t.label}
    </button>
  ))}
</div>
```

### 4.2 Scrollable tab strip

For many tabs that won't fit on a phone (e.g. a settings nav: *Account,
Livestream, Payments, Subscription, Monetization, Storage, …*).

#### Anatomy

```
   ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
   │⚙ Account│ │▷ Livestrm│ │$ Payments│ │◆ Subscription│  →  (scrolls)
   └────────┘ └──────────┘ └──────────┘ └──────────────┘
   selected
```

- Same pill styling as §4.1, but each pill carries a **leading icon**.
- The strip **scrolls horizontally** when it overflows.
- Use **scroll-snap** so pills click into place on touch.
- Bleed the strip to the screen edges with negative margin so the first/last
  pill can sit flush — the cut-off pill signals "more this way".

#### Skeleton

```tsx
<div className="-mx-3 overflow-x-auto md:-mx-6">      {/* edge bleed */}
  <div className="flex min-w-min snap-x snap-mandatory gap-2 px-3 pb-2">
    {tabs.map((t) => (
      <Link
        key={t.id}
        href={t.href}
        className={cn(
          'inline-flex h-10 flex-shrink-0 snap-start items-center gap-2',
          'rounded-full border px-4 text-xs font-semibold transition-all',
          t.active
            ? 'border-transparent bg-gradient-to-br from-accent to-accent-dim text-white shadow-glow'
            : 'border-border bg-surface-1 text-muted hover:bg-surface-2'
        )}
      >
        <t.icon className="h-4 w-4" />
        <span className="whitespace-nowrap">{t.label}</span>
      </Link>
    ))}
  </div>
</div>
```

### Rules for tabs

- **Selected = filled, hover = lift.** The selected tab is the only filled one.
  Hover only brightens the surface. They must never look alike.
- Tabs that map to **routes** render as `<Link>`; tabs that map to **local
  state** render as `<button>` with `role="tab"` + `aria-selected`.
- Keep tab height consistent (`h-9` / `h-10`). Icons are `16px`.
- 2–4 options → §4.1 pill control. 5+ or icon-led nav → §4.2 strip.
- Never wrap a tab strip onto two lines. Scroll it.
- The selected state must survive a page reload when tabs are routes (derive
  `active` from the current path, not from state).

---

## 5. Settings pages

Settings is its own composition: a §2 header, a §4.2 tab strip, then **grouped
rows of controls**. The reference screens are *Notification preferences* and
*Storage*.

### 5.1 Overall structure

```
┌──────────────────────────────────────────────────────┐
│  PAGE HEADER          (eyebrow "SETTINGS" + title)    │   §2
├──────────────────────────────────────────────────────┤
│  ⚙Account ▷Livestream $Payments ◆Subscription …      │   §4.2 tab strip
├──────────────────────────────────────────────────────┤
│                                                      │
│  ── SECTION: CHANNELS ──────────────────             │   group eyebrow
│  ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │ Email  │ │ Push   │ │ In-app │                   │   §3.1 cards (masters)
│  └────────┘ └────────┘ └────────┘                   │
│                                                      │
│  ── SECTION: FOLLOWERS, LIKES & COMMENTS ──          │   group eyebrow
│  ┌──────────────────────────────────────────────┐   │
│  │ row                          ▢   ▢   ▢       │   │   the preference matrix
│  │ row                          ▢   ▢   ▢       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│                                  [● Save changes]   │   sticky save bar
└──────────────────────────────────────────────────────┘
```

### 5.2 Section grouping

Settings are always **grouped**, never one flat list. Each group is:

```tsx
<section className="space-y-4">
  <div>
    <p className="text-[10px] uppercase tracking-[0.2em] text-accent">
      {groupEyebrow}            {/* e.g. "SOCIAL" */}
    </p>
    <h2 className="font-display text-base font-semibold text-heading">
      {groupTitle}              {/* e.g. "Followers, Likes & Comments" */}
    </h2>
  </div>
  {/* the group's cards or matrix */}
</section>
```

Groups are separated by generous vertical space (`space-y-12` between, `space-y-4`
within). The eyebrow + title combo is the *only* divider needed — no `<hr>`.

### 5.3 Master controls vs. the preference matrix

A well-built settings screen has **two tiers** of control:

1. **Masters** — a row of §3.1 icon–label–control cards at the top. These set a
   *channel* or *mode* on/off globally (Email / Push / In-app). Big, friendly,
   grid-laid.
2. **The matrix** — a fine-grained grid below: each *row* is an event type, each
   *column* is a channel. The intersection is a toggle.

This is the key innovation of the settings layout: **one screen, two
granularities**. Casual users flip the masters; power users tune the matrix.

### 5.4 The preference matrix

#### Desktop — a true grid

```
                                   Email   Push   In-app
┌────────────────────────────────┬───────┬──────┬───────┐
│ New followers                  │  ▢▢   │ ▢▢   │  ▢▢   │
│ someone likes your activity    │  ▢▢   │ ▢▢   │  ▢▢   │
│ new comments on your activity  │  ▢▢   │ ▢▢   │  ▢▢   │
└────────────────────────────────┴───────┴──────┴───────┘
  ↑ label + description (1fr)      ↑ fixed-width toggle columns
```

```tsx
{/* a header row, then one row per preference */}
<div className="hidden grid-cols-[minmax(0,1fr)_64px_64px_64px]
               items-center gap-4 sm:grid">
  <div className="min-w-0">
    <p className="text-sm font-semibold text-heading">{item.label}</p>
    <p className="mt-0.5 text-xs text-muted">{item.description}</p>
  </div>
  {channels.map((ch) => (
    <div key={ch.key} className="flex justify-center">
      <Switch checked={prefs[item.key][ch.key]} onChange={…} />
    </div>
  ))}
</div>
```

The grid template is the trick: `minmax(0,1fr)` for the label (it absorbs all
slack and can shrink/truncate) + one fixed track per channel column. Column
headers use the *same* template so toggles line up perfectly under their label.

#### Mobile — stack the columns into chips

A 4-column grid is unusable on a phone. Below `sm`, the matrix reflows: the row
label stacks above a wrapped set of **inline chips**, each chip = channel icon +
label + its own toggle.

```tsx
<div className="space-y-3 sm:hidden">
  <div>
    <p className="text-sm font-semibold text-heading">{item.label}</p>
    <p className="mt-0.5 text-xs text-muted">{item.description}</p>
  </div>
  <div className="flex flex-wrap items-center gap-3">
    {channels.map((ch) => (
      <label key={ch.key}
        className="inline-flex items-center gap-2 rounded-full
                   border border-border px-3 py-1.5 text-xs font-semibold">
        <ch.icon size={14} />
        <span>{ch.label}</span>
        <Switch checked={prefs[item.key][ch.key]} onChange={…} />
      </label>
    ))}
  </div>
</div>
```

Same data, same toggles — only the `grid-template` differs. Render both, toggle
with `hidden sm:grid` / `sm:hidden`.

### 5.5 The sticky save bar

When a settings screen has unsaved state, anchor a **save bar** to the bottom of
the viewport so the user never hunts for it:

```tsx
<div className="sticky bottom-4 z-10 flex items-center justify-between
               gap-3 rounded-full border border-border bg-surface-1
               px-4 py-2 backdrop-blur-xl shadow-ambient">
  <p className="text-xs text-muted">{dirty ? 'Unsaved changes' : 'All saved'}</p>
  <Button disabled={!dirty}>Save changes</Button>
</div>
```

- It's a glass pill, floating, `sticky bottom-4`.
- A status label on the left (`Unsaved changes` / `All saved`), the button on
  the right.
- Disable the button when there's nothing to save.

### Rules for settings

- Always: header → tab strip → grouped sections. Never a wall of toggles.
- Group every setting under an eyebrow + title. A group with one item is fine.
- Offer masters *and* a matrix when settings have channels/modes — don't make
  power users hunt and don't make casual users learn the matrix.
- The matrix is one component rendered twice (grid + stacked); never two.
- Use a sticky save bar for batch-save screens; use instant-apply (with a tiny
  inline confirmation) for screens where each toggle is independent.

---

## 6. Navbar & sidebar

Global navigation. Two pieces: the **top navbar** (identity, search, account)
and the **left sidebar rail** (primary destinations).

### 6.1 Top navbar

#### Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│ LOGO    [ 🔍 search… ]              🔔   ┌─────────────────┐ │
│                                          │ ◯ Name  handle ▾│ │
│                                          └─────────────────┘ │
└──────────────────────────────────────────────────────────────┘
  brand    flexible center             actions    account chip
```

- **Sticky**, full width, fixed height (`~76px`), above everything (`z-30`).
- **Glass surface** — semi-transparent + backdrop blur — so content scrolls
  *under* it legibly. A hairline bottom border.
- Three zones:
  - **Brand** (left) — logo, links home.
  - **Search** (center) — `flex-1` with a sane `max-width` so it doesn't sprawl
    on wide screens. Collapses to an icon on mobile.
  - **Actions** (right, `ml-auto`) — notification bell, then the account chip.

```tsx
<header className="sticky top-0 z-30 h-[76px] border-b border-border
                   bg-surface-1/80 backdrop-blur-xl">
  <div className="mx-auto flex h-full max-w-[1400px] items-center
                 gap-4 px-4 md:gap-6 md:px-6 lg:px-8">
    <Logo />
    <div className="min-w-0 flex-1 md:max-w-[560px]"><SearchBox /></div>
    <div className="ml-auto flex items-center gap-2 md:gap-3">
      <NotificationBell />
      <AccountChip />          {/* trigger for §7 dropdown */}
    </div>
  </div>
</header>
```

#### The account chip

The dropdown *trigger* is itself a small pill: avatar + (on desktop) first name
+ handle + a chevron. On mobile it collapses to just the avatar.

```tsx
<button className="flex items-center gap-2 rounded-full border border-border
                   bg-surface-1 py-1 pl-1 pr-1 hover:bg-surface-2 md:pr-3">
  <Avatar src={avatar} className="h-9 w-9 rounded-full" />
  <span className="hidden items-center gap-2 md:flex">
    <span className="text-sm font-semibold text-heading">{firstName}</span>
    <span className="text-[11px] text-muted">{handle}</span>
    <ChevronDown size={14} />
  </span>
</button>
```

### 6.2 Left sidebar rail

#### Anatomy — the hover-expand rail

```
 collapsed (~68px)        expanded (~232px, on hover/lock)
┌────┐                   ┌──────────────────────┐
│ ▢  │                   │ ▢  Home              │
│ ▢  │                   │ ▢  Explore           │
│ ▣  │ ◀ active           │ ▣  Events       ◀──  │ active
│ ▢  │                   │ ▢  Messages          │
│ ▢  │                   │ ▢  Settings          │
└────┘                   └──────────────────────┘
   ▸ lock chevron protruding from the right edge
```

- **Collapsed by default** to a thin icon rail (~68px). Width is the only thing
  the page layout has to budget for.
- **Expands on hover** to show labels (~232px), overlaying content — it does not
  reflow the page.
- A **lock toggle** (a chevron protruding from the right edge) pins it open;
  the choice persists (e.g. `localStorage`) and is broadcast so the layout can
  react.
- **Nav items** are `40×40` icon pills. The active item is filled (accent
  gradient); the rest are transparent with a hover surface.
- Hidden entirely on mobile — its destinations move into the §7 dropdown or a
  bottom bar.

```tsx
<aside className={cn(
  'fixed left-0 top-[76px] bottom-0 hidden flex-col gap-1 border-r border-border',
  'bg-surface-1/80 backdrop-blur-xl px-3 py-4 transition-[width] md:flex',
  expanded ? 'w-[232px]' : 'w-[68px]'
)}>
  {items.map((it) => (
    <Link key={it.id} href={it.href}
      className={cn(
        'flex h-10 items-center gap-3 rounded-xl px-2.5 transition-all',
        it.active
          ? 'bg-gradient-to-br from-accent to-accent-dim text-white'
          : 'text-muted hover:bg-surface-2'
      )}>
      <it.icon className="h-5 w-5 shrink-0" />
      {expanded && <span className="text-sm font-medium">{it.label}</span>}
    </Link>
  ))}
</aside>
```

### Rules for navigation

- Navbar is glass + sticky + `z-30`. Content scrolls under it.
- Search owns the flexible center but is capped — never let it sprawl edge to
  edge on desktop.
- The sidebar's *collapsed* width is the contract with the page layout; the
  expanded state overlays and must not reflow content.
- Active state is filled accent in both navbar-adjacent and sidebar contexts —
  one selected-state language across the whole app.
- Drive nav items from a **config array**, not hardcoded JSX. Adding a
  destination should be a one-line data change (see §6.3).

### 6.3 Navigation is config-driven

Every nav surface — sidebar, account dropdown, settings tabs — renders from a
typed array. The component is generic; the array is the content.

```ts
interface NavItem {
  id: string | number;
  label: string;          // visible text
  href: string;           // route
  icon: IconComponent;    // leading icon
  description?: string;   // for dropdown rows (§7)
  adminOnly?: boolean;    // gates visibility + restyles (see §7)
}
```

Keep these arrays in a dedicated config module. New destination = new array
entry; no layout code changes.

---

## 7. Dropdown & popover menus

Floating panels anchored to a trigger: the account menu, overflow (`⋯`) menus,
notification popovers. The reference is the **account dropdown**.

### Anatomy — the rich account menu

```
                          ┌────────────────────────────────┐
              (trigger ▾) │ ◯  Display Name          ☀/☾   │  ← identity header
                          │    email@…                     │
                          │    @handle                     │
                          ├────────────────────────────────┤  ← divider
                          │ ▢  My Tickets                   │
                          │    See tickets you ordered      │  ← icon + label +
                          │ ▢  Inventory                    │     description rows
                          │    See purchased assets         │
                          │ ▢  Settings                     │
                          │    Account info and widgets     │
                          │ ▢  Management          [Admin]  │  ← gated row, restyled
                          ├────────────────────────────────┤
                          │ ⎋  Logout                       │  ← destructive footer
                          │    Logout of your account       │
                          └────────────────────────────────┘
```

A rich dropdown has **three regions**:

1. **Identity header** — avatar + name + email/handle, plus a quick toggle
   (theme switch) tucked top-right.
2. **Item rows** — each row is *icon badge + label + one-line description*. The
   description is what lifts this above a plain menu: every option self-explains.
3. **Footer** — separated by a divider, holds the destructive/terminal action
   (Logout) styled in a warning color.

### Skeleton

```tsx
<MenuItems className="absolute right-0 top-full z-50 mt-3 w-[320px]
                     overflow-hidden rounded-2xl border border-border
                     bg-surface-1/95 backdrop-blur-2xl shadow-ambient">
  {/* 1 — identity */}
  <div className="flex items-start gap-3 px-5 pb-4 pt-5">
    <Avatar src={avatar} className="h-11 w-11 rounded-full ring-2 ring-accent/30" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-heading">{name}</p>
      <p className="truncate text-xs text-muted">{email}</p>
    </div>
    <ThemeToggle />
  </div>

  <div className="border-t border-border" />

  {/* 2 — rows (config-driven, §6.3) */}
  <div className="py-2">
    {items.map((i) => (
      <Link key={i.id} href={i.href}
        className={cn(
          'flex items-center gap-3 px-5 py-2.5 transition-all',
          i.adminOnly ? 'hover:bg-rose-500/[0.06]' : 'hover:bg-surface-2'
        )}>
        <span className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg',
          i.adminOnly ? 'bg-rose-500/10 text-rose-500' : 'bg-accent/10 text-accent'
        )}>
          <i.icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-heading">{i.label}</p>
          <p className="truncate text-xs text-muted">{i.description}</p>
        </div>
        {i.adminOnly && <Badge>Admin</Badge>}
      </Link>
    ))}
  </div>

  <div className="border-t border-border" />

  {/* 3 — destructive footer */}
  <button className="flex w-full items-center gap-3 px-5 py-3 hover:bg-rose-500/[0.06]">
    <LogOut className="text-rose-500" size={18} />
    <div className="text-left">
      <p className="text-sm font-semibold text-heading">Logout</p>
      <p className="text-xs text-muted">Logout of your account</p>
    </div>
  </button>
</MenuItems>
```

### Rules for menus

- A dropdown is a **glass card** (§3.0) that floats — same surface language,
  `z-50`, generous backdrop blur, `overflow-hidden` so children clip to the
  radius.
- **Every row gets a description.** A bare label list is fine for a 3-item
  overflow menu; a primary navigation menu earns the extra line.
- Each row leads with an **icon badge** (tinted square), matching §3.1.
- **Gated rows restyle, don't just hide.** An admin-only row uses a *different
  accent* (e.g. rose) for its icon badge + hover, and carries a small `Admin`
  badge — the menu communicates privilege, not just access.
- Destructive actions live in a divider-separated footer, in a warning color.
- Anchor with `right-0 top-full mt-3` for right-aligned triggers; flip for
  left-aligned ones. Use an accessible menu primitive (focus trap, arrow keys,
  escape-to-close) — don't hand-roll it.

---

## 8. List rows & feeds

Long vertical lists of repeating items: notifications, activity, search
results. The reference is the **notifications feed**.

### Anatomy — the notification row

```
┌──────────────────────────────────────────────────────────────┐
│ ◯   POST · LIKE · 4 DAYS AGO                  [ VIEW ▸ ]  ⋯  │
│ av  @user liked your post                                     │
└──────────────────────────────────────────────────────────────┘
  │     │            │                              │        │
avatar  meta eyebrow  primary text          action btn   overflow
        (type·time)
```

A list row is a horizontal strip — *not* a card. It has **no surface of its
own**; rows are separated by hairline dividers or tight spacing, and the row
*itself* lights up a surface only on hover.

```tsx
<li className="flex items-center gap-3 rounded-xl px-3 py-3
              transition-colors hover:bg-surface-1">
  <Avatar src={row.avatar} className="h-9 w-9 shrink-0 rounded-full" />
  <div className="min-w-0 flex-1">
    <p className="text-[10px] uppercase tracking-wide text-muted">
      {row.type} · {row.timeAgo}
    </p>
    <p className="truncate text-sm text-heading">{row.text}</p>
  </div>
  <Button size="sm" variant="ghost">View</Button>
  <OverflowMenu />
</li>
```

### The feed page layout

The notifications screen pairs the feed with a **left summary rail**:

```
┌──────────────┬───────────────────────────────────┐
│ SUMMARY RAIL │  FEED                             │
│              │                                   │
│  ┌────┐┌────┐│  ─ LAST 7 DAYS ─────────          │
│  │ 28 ││ 0  ││  row                              │
│  │TOTL││UNRD││  row                              │
│  └────┘└────┘│  row                              │
│              │  …                                │
│ [⚙ Settings] │                                   │
└──────────────┴───────────────────────────────────┘
```

- **Summary rail** — §3.2 stat cards (totals, unread count) + a shortcut to the
  relevant settings page.
- **Feed** — rows grouped under date eyebrows (`LAST 7 DAYS`, `EARLIER`), with
  infinite scroll.

### Rules for lists

- Rows are **not cards** — no per-row surface at rest. Surface appears on hover
  only. This keeps a list of 50 items calm.
- Lead with an avatar/icon, end with an action and/or overflow menu; the middle
  flex-grows and truncates.
- Carry a **meta eyebrow** (type · timestamp) above the primary text — same
  eyebrow device as everywhere else.
- Group long feeds under date/category eyebrows.
- Distinguish unread (e.g. a tinted row background or a leading dot) from read.
- Pair a feed with a stat summary rail when the page is *about* the feed
  (a dedicated Notifications/Activity page); skip the rail when the feed is
  embedded in a larger screen.

---

## 9. Pattern template

Copy this block to document a new layout, page, or component. Keep the numbered
heading so the index (top of file) stays ordered.

```markdown
## N. <Pattern name>

One sentence: what this is and the problem it solves.

### Anatomy

(An ASCII sketch of the structure, with each zone labeled and its role noted.)

### When to use

- Use it for …
- Don't use it for … (point to the pattern that fits instead)

### Skeleton

​```tsx
// The minimal, copy-able JSX. Use generic token names:
// surface-0/1/2, accent, accent-dim, muted, heading, border, glow.
​```

### Variants

- <Variant> — how it differs and when to reach for it.

### Rules

- Hard constraints. What must always / never be true.
- Responsive behavior: how it reflows below `sm` / `md`.
- The 4 interaction states if it's interactive (rest / hover / selected / disabled).
```

### Checklist before adding a pattern

- [ ] Does an existing pattern already cover this? Extend it instead of forking.
- [ ] Does it reuse the base surfaces, eyebrow, icon badge, and spacing scale?
- [ ] Does it reflow sensibly on mobile (§0.8)?
- [ ] Are all 4 interaction states defined (§0.7)?
- [ ] Is its content config-driven where it repeats (§6.3)?
- [ ] Added a row to the index table at the top of this file?

---

## Quick reference

| Building…              | Reach for | Key move |
|------------------------|-----------|----------|
| A new screen           | §1 + §2   | Shell → header → sections |
| An on/off setting      | §3.1      | icon badge + label + trailing switch; tint the whole card |
| A KPI / number         | §3.2      | one number, large; color-coded icon badge |
| A thing with an image  | §3.3      | fixed aspect cover; whole card is one link |
| 2–4 view switches      | §4.1      | pill control; selected = filled |
| Many view switches     | §4.2      | scroll-snap strip with edge bleed |
| A preferences screen   | §5        | header → tab strip → grouped sections; masters + matrix |
| A fine-grained toggle grid | §5.4  | CSS grid on desktop, inline chips on mobile — one component |
| Global navigation      | §6        | glass navbar + hover-expand rail; config-driven |
| A contextual menu      | §7        | glass panel; icon + label + description rows |
| A long repeating list  | §8        | rows, not cards; surface on hover only |

> When in doubt, return to §0. Every pattern here is just those nine principles
> applied to a specific shape.
