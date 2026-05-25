# DESIGN.md — VIGI-IIAP

## Color strategy: Committed
El verde institucional lleva el 40–60% de la superficie. Oro como segundo rol funcional (alertas, destacados). Lima como acento de biodiversidad en contextos editoriales.

## Palette (OKLCH)
```
--color-forest-950: oklch(17% 0.045 148)   /* #0c1f14 — hero bg */
--color-forest-900: oklch(20% 0.048 148)   /* #122e1d — dark surface */
--color-forest-800: oklch(26% 0.055 148)   /* #1A5632 — primary institucional */
--color-forest-700: oklch(33% 0.062 148)   /* #218842 — primary-light */
--color-forest-600: oklch(42% 0.072 148)   /* #009846 — vivid IIAP */
--color-forest-400: oklch(62% 0.062 148)   /* #33A65E */
--color-forest-200: oklch(83% 0.038 148)   /* #A0D3AB */
--color-forest-100: oklch(90% 0.024 148)   /* #C8E6CE */
--color-forest-50:  oklch(96% 0.010 148)   /* #E8F5EB */

--color-gold-500:   oklch(73% 0.085 68)    /* #F7AC42 — gold principal */
--color-gold-400:   oklch(80% 0.074 72)    /* #F4C87A */
--color-lime-500:   oklch(76% 0.132 122)   /* #B0CB1F — biodiversidad */

--color-surface:    oklch(99.2% 0.004 148) /* #FEFEFE tinted toward forest */
--color-bg:         oklch(97.8% 0.006 148) /* #F8FAF9 warm green tint */
--color-bg-alt:     oklch(95.5% 0.008 148) /* #EDF2F0 */
--color-border:     oklch(90% 0.008 148)   /* #E2E8F0 */
--color-text:       oklch(14% 0.008 270)   /* #1A1A2E off-black tinted cool */
--color-text-light: oklch(37% 0.008 250)   /* #4A5568 */
--color-text-muted: oklch(51% 0.006 250)   /* #718096 */
```

## Typography
- **Display/Editorial**: Playfair Display — for section headings, hero titles, large numbers
- **UI/Body**: Source Sans 3 — for labels, body text, navigation, data
- **Scale**: 7xl (hero) → 2xl (section) → xl (card title) → base (body) → sm (label)
- **Minimum contrast ratio**: 4.5:1 on all text (WCAG 2.1 AA)
- **Serif ban in admin/data tables**: Source Sans 3 exclusively for all table/admin content

## Elevation
Three surfaces only:
1. `bg` (#F8FAF9) — page background
2. `surface` (#FEFEFE) — cards, panels
3. `elevated` (white + shadow-card) — modals, dropdowns, toast

## Shadows (OKLCH-tinted)
```
shadow-soft:     0 1px 2px oklch(17% 0.045 148 / 0.05)
shadow-card:     0 4px 6px -1px oklch(17% 0.045 148 / 0.08), 0 2px 4px -1px oklch(17% 0.045 148 / 0.05)
shadow-elevated: 0 10px 15px -3px oklch(17% 0.045 148 / 0.10)
shadow-glow:     0 0 40px oklch(26% 0.055 148 / 0.18)
```

## Radius
Varied intentionally for rhythm (not uniform):
- Full/pill: `9999px` — tags, chips, status dots
- 2xl: `24px` — hero, major containers
- xl: `16px` — modal
- lg: `12px` — cards, panels
- md: `8px` — inputs, small cards
- sm: `4px` — inline chips, tooltips

## Motion
- Enter: `cubic-bezier(0.23, 1, 0.32, 1)` 200–400ms
- Exit: `cubic-bezier(0.55, 0, 1, 0.45)` 120–200ms (faster)
- Button press: `scale(0.97)` 100ms
- Spring hover: `stiffness: 300, damping: 30`
- No `ease-in` on entering elements

## Components

### Buttons
```
Primary: bg-forest-800, text-white, hover:bg-forest-700, active:scale-[0.97]
Secondary: border-forest-300, text-forest-800, hover:bg-forest-50
Ghost: text-text-light, hover:bg-bg-alt
```

### Cards
```
Default: bg-surface, border-border/60, rounded-xl (NOT uniform rounded-2xl everywhere)
Module card: rounded-2xl, no top accent stripe > 2px
Stat card: border-only, no shadow, breathes in open layout
```

### Navigation
```
Sidebar: bg-surface, width 200px fixed
Active pill: bg-forest-800, text-white, layoutId spring animation
Hover: bg-bg-alt transition 150ms ease-out
```
