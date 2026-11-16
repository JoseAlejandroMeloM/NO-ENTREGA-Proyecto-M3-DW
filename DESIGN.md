---
name: Conecta Negocio
description: Sales, stock and suppliers for neighborhood stores and their distributors.
colors:
  primary: "#0f766e"
  primary-dark: "#115e59"
  primary-deep: "#0b3f3b"
  primary-soft: "#d5efe9"
  accent: "#f59e0b"
  accent-soft: "#fef3c7"
  canvas: "#faf8f5"
  surface: "#ffffff"
  neutral-100: "#f3f0eb"
  neutral-200: "#e6e2db"
  neutral-300: "#d3cec5"
  neutral-500: "#6e6960"
  neutral-600: "#57524a"
  neutral-700: "#423e38"
  neutral-900: "#1d1b18"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  stat:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
rounded:
  control: "8px"
  card: "12px"
  sheet: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    textColor: "{colors.primary-dark}"
    rounded: "{rounded.control}"
  button-ghost-hover:
    backgroundColor: "{colors.primary-soft}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "16px"
  nav-item-active:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
  tab-selected:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-dark}"
    rounded: "{rounded.control}"
---

# Design System: Conecta Negocio

Tokens live in `client/src/index.css` (`@theme`); components in `client/src/components/`; the shell in `client/src/layouts/`. The frontmatter above mirrors those values: when they disagree, the code wins and this file is updated.

## Overview

**Creative North Star: "The Tidy Counter"**

A well-kept shop counter: everything within reach, nothing decorative in the way, and warm enough that it is clearly somebody's own place. The users are owners, clerks and cashiers of neighborhood stores, on a laptop behind the counter or on a phone, often with a customer waiting. The interface has to be read in a glance and trusted with money.

So the system is restrained: warm paper neutrals, one deep teal that carries the brand and every primary action, and amber kept for the few things that need attention. The shop's own name is the first thing in the top bar. Identity comes from the teal sidebar, the two-circle mark and the display face on titles, not from decoration inside the work area.

**Key Characteristics:**
- Warm, not gray: neutrals are tinted toward paper, never blue-gray.
- Teal means "act" or "you are here"; amber means "look at this".
- Numbers are heroes: big, tabular, never decorated.
- Familiar patterns (sidebar, top bar, tables, tabs) so nobody has to learn the tool.
- Same behavior on a 375 px phone: bottom bar, sheets, 44 px tap targets.

## Colors

Deep teal and amber on warm paper.

### Primary
- **Counter Teal** (`primary` #0f766e): primary buttons, links, selected controls, focus rings.
- **Counter Teal, pressed** (`primary-dark` #115e59): hover of primary buttons; text on teal tints.
- **Awning Teal** (`primary-deep` #0b3f3b): the sidebar and the auth brand panel. The only large colored surface.
- **Mint Wash** (`primary-soft` #d5efe9): selected tab, active bottom-bar item, hover of ghost buttons, unread rows.

### Secondary
- **Marigold** (`accent` #f59e0b): the unread badge, the active sidebar icon, ratings, low-stock signals. Never a text color on white; text on Marigold is near-black.
- **Marigold Wash** (`accent-soft` #fef3c7): background for warning notes.

### Neutral
- **Paper** (`canvas` / `slate-50` #faf8f5): page background, table header fill, row hover.
- **White** (#ffffff): cards, fields, top bar, bottom bar.
- **Warm line** (`slate-200` #e6e2db, `slate-300` #d3cec5): card borders and dividers; field and secondary-button borders.
- **Ink** (`slate-900` #1d1b18) for text, **Soft ink** (`slate-600` #57524a, `slate-500` #6e6960) for secondary text. `slate-500` is the lightest text allowed (5.4:1 on white).

The neutral utilities are still called `slate-*` in the code; `index.css` overrides their values with this warm ramp so every screen shares it.

### Status colors (meaning is fixed)
Orders: pending neutral, accepted blue, shipped amber, delivered green, rejected / cancelled red. Stock: OK green, low amber, out red. Always through `Badge` (tinted fill + hairline ring of the same hue).

### Named Rules
**The One Teal Surface Rule.** Inside the app, deep teal fills the sidebar and the auth panel and nothing else; in the work area teal appears only on actions and selection. The landing page is the exception: its hero and closing band are deep teal, with white (`secondary`) and outline (`inverse`) buttons on top.

**The Marigold Is A Signal Rule.** If amber is on screen, something needs attention. It is never used to decorate.

## Typography

**Display Font:** Bricolage Grotesque (with Inter, system-ui)
**Body Font:** Inter (with system-ui)

**Character:** Inter does all the work: labels, tables, numbers. Bricolage Grotesque adds a friendly, slightly hand-set voice to the wordmark, page titles and the shop's name, which is where the product should feel like a place and not a template.

### Hierarchy
- **Display** (600, 2.25rem, 1.1): the statement on the auth panel. Marketing pages may go larger.
- **Headline** (600, 1.5rem): the page title, one per screen, through `PageHeader` (`h1` gets the display face from the base styles).
- **Title** (600, 1.125rem, Inter): card and section titles, modal titles.
- **Body** (400, 0.875rem): everything else. Prose stays under 75ch.
- **Label** (500, 0.75rem): field hints, table headers (uppercase), badges, bottom-bar labels (0.6875rem).
- **Stat** (600, 1.875rem, tabular): the big number in `StatCard`.

### Named Rules
**The Tabular Money Rule.** Any amount or quantity uses tabular figures (`tabular-nums`; tables get it by default) so columns line up.

**The Display Stays Outside Rule.** Bricolage is for the wordmark, `h1` and the organization name. Never in buttons, labels, tables or numbers.

## Layout

- **Shell** (`AppLayout`): 240 px teal sidebar + sticky 64 px top bar from 768 px up. Below 768 px the sidebar is replaced by a fixed bottom bar: up to five destinations, or four plus "More" (a sheet with the rest).
- **Content**: max width 72rem, 32 px side padding on desktop, 16 px on phones; 24 px top. Pages are a vertical stack with 16 px between blocks (`space-y-4`), 24 px between sections.
- **Auth** (`AuthLayout`): brand panel (5/11) + form (6/11) from 1024 px; form only below.
- **Spacing scale**: Tailwind's 4 px base. 8–12 px inside a control group, 16 px card padding, 24–32 px between groups.
- **Mobile**: no horizontal page scroll at 375 px; tables scroll inside their card; controls grow to 44 px and 16 px text on touch screens.

## Elevation & Depth

Mostly flat: surfaces are separated by a 1 px warm border and a barely-there shadow. Real shadows are reserved for things that float.

### Shadow Vocabulary
- **Card** (`shadow-card`: `0 1px 2px rgb(29 27 24 / .05), 0 1px 1px rgb(29 27 24 / .03)`): every `card`.
- **Raised** (`shadow-raised`: `0 6px 16px -4px rgb(29 27 24 / .1), 0 2px 4px -2px rgb(29 27 24 / .06)`): hover of a linked card.
- **Overlay** (`shadow-overlay`: `0 20px 44px -10px rgb(29 27 24 / .22), 0 6px 14px -6px rgb(29 27 24 / .1)`): dropdowns, sheets, modals.

### Motion
- One curve for anything that answers the user: `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)`. 160 ms by default (all `transition-*` utilities), 300 ms for sheets and modals.
- Buttons press to `scale(0.97)`. Popovers grow from the corner they are attached to. Things enter with opacity + a small move; they leave instantly.
- Motion shows a state change or gives feedback. No page-load choreography, nothing on keyboard-driven actions.
- `prefers-reduced-motion` turns all of it off (global rule in `index.css`).
- Two utilities cover almost every case. `appear`: something that was not on the page before (an alert, an inline form, a cart line, the sale confirmation) fades in with a 6 px rise in 200 ms. `pop`: a counter that just changed (unread badge, quantity on a POS tile) grows from 70% in 180 ms; remount it with `key={value}`.
- What never animates: route changes, tabs, table rows, filters, dropdown items, charts, and anything opened from the keyboard. They are used all day; motion there only adds delay.

## Shapes

Soft but not bubbly. Controls (buttons, fields, tabs, nav items) 8 px; cards and popovers 12 px; sheets and modals 16 px; badges, avatars and the bottom-bar indicator are pills. Borders are always 1 px. Icons are Lucide, 2 px stroke, 16–20 px, always next to a text label except the bell, close and log-out-on-phones buttons (which carry `aria-label`s).

## Components

### Buttons (`Button`, `ButtonLink`)
- **Shape:** 8 px radius, 40 px tall (44 px on touch), `sm` 32 px, `lg` 48 px for the POS.
- **Primary:** Counter Teal fill, white label. One per view.
- **Secondary:** white, warm border. **Ghost:** teal label, Mint Wash on hover. **Danger:** red fill, only for destructive actions.
- **States:** hover darkens, press scales to 0.97, focus shows the 2 px teal ring, `loading` shows a spinner and disables, disabled is 55% opacity.
- `ButtonLink` is the same look on a router link (page-header actions, quick actions).

### Badges (`Badge`)
- Pill, 12 px medium text, tinted fill with a hairline ring. Tones: neutral, info, warning, success, danger. Use the wrappers (`OrderStatusBadge`, `StockBadge`, `MethodBadge`) so meaning stays consistent.

### Cards / Containers (`card` utility, `StatCard`)
- **Corner:** 12 px. **Background:** white on Paper. **Border:** 1 px `slate-200`. **Shadow:** Card.
- **Padding:** 16 px (20 px for forms); table cards have none and scroll sideways.
- `StatCard`: label, big tabular number (tone: default, primary, warning, info), optional hint and link; a linked card lifts on hover.
- Never nest a card in a card.

### Inputs / Fields (`TextField`, `SelectField`, `field` utility)
- White, 1 px `slate-300` border, 8 px radius, 40 px tall. Label above (14 px medium), hint or error below (12 px).
- **Focus:** teal border + 3 px soft teal ring. **Error:** red border, red ring on focus, message linked with `aria-describedby`. **Disabled:** `slate-100` fill.
- Raw `<input>`, `<select>` and `<textarea>` in filters and tables use the `field` class; selects get the shared chevron.

### Navigation (`AppLayout`, `layouts/nav.ts`)
- **Sidebar:** Awning Teal; items 14 px medium in mint-tinted white, grouped under small uppercase section labels. Active item: lighter teal pill, white label, Marigold icon.
- **Top bar:** white, the organization name in the display face, user and role below; bell, initials, log out on the right.
- **Bottom bar (phones):** white, icon + 11 px label; the active icon sits on a Mint Wash pill.
- Focus rings on teal surfaces are Marigold.

### Page patterns
- `PageHeader`: title, one line of context, actions on the right.
- `FilterBar`: a card row of search + selects above a list.
- `Tabs`: pill tabs in one scrolling row (selected = Mint Wash).
- `Pagination`: Previous / "Page 2 of 5" / Next; hidden with one page.
- `EmptyState`: icon in a neutral circle, one sentence, optional next step.
- `Modal`: native `<dialog>`; bottom sheet on phones, centered card from 640 px.
- `FormAlert`: red-tinted banner with an icon, `role="alert"`.

## Do's and Don'ts

### Do:
- **Do** start every screen with `PageHeader` and put its single primary action there.
- **Do** use the `card` and `field` utilities instead of repeating border / radius / background classes.
- **Do** keep the status colors' meaning (see Colors) and show state with a `Badge`, not with colored text alone.
- **Do** use `tabular-nums` for money and quantities, formatted with `formatCOP`.
- **Do** check every screen at 375 px and with the keyboard before a PR.

### Don't:
- **Don't** use blue-gray neutrals or pure black; use the warm `slate-*` ramp.
- **Don't** put Awning Teal fills, gradients or decoration inside the work area.
- **Don't** use amber for decoration or as text on white.
- **Don't** use the display face in buttons, labels, tables or numbers.
- **Don't** use arrows, check marks or other Unicode glyphs as icons; use Lucide.
- **Don't** add an animation that does not show a state change, and never one longer than 300 ms.
- **Don't** change hooks, routes, role checks or request bodies in a design pass (see `docs/design-brief.md`).
