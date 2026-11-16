---
name: Terminal Ledger
colors:
  surface: '#111413'
  surface-dim: '#111413'
  surface-bright: '#373a38'
  surface-container-lowest: '#0c0f0e'
  surface-container-low: '#191c1b'
  surface-container: '#1d201f'
  surface-container-high: '#282b29'
  surface-container-highest: '#323534'
  on-surface: '#e1e3e1'
  on-surface-variant: '#bacbb9'
  inverse-surface: '#e1e3e1'
  inverse-on-surface: '#2e3130'
  outline: '#859585'
  outline-variant: '#3b4a3d'
  surface-tint: '#00e475'
  primary: '#75ff9e'
  on-primary: '#003918'
  primary-container: '#00e676'
  on-primary-container: '#00612e'
  inverse-primary: '#006d35'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#a9f5d2'
  on-tertiary: '#003827'
  tertiary-container: '#8dd8b6'
  on-tertiary-container: '#096045'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#62ff96'
  primary-fixed-dim: '#00e475'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005226'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#a6f2cf'
  tertiary-fixed-dim: '#8bd6b4'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#111413'
  on-background: '#e1e3e1'
  surface-variant: '#323534'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  tabular-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.02em
  tabular-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  tabular-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.625rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system establishes a high-density, low-latency visual language engineered for high-throughput logistics, automated document parsing, and institutional invoice settlement. The aesthetic targets financial engineers, operations leads, and system administrators who demand maximal data observability without visual clutter or sluggish decorative overhead.

The interface draws directly from high-contrast terminal environments and institutional fintech consoles (Bloomberg Terminal, early automated clearinghouse tooling, and UNIX-style CLI dashboards), refined into a modern web paradigm. Depth is communicated strictly through surface layering, sharp luminance steps, and hairline borders rather than soft, ambient blur filters or whimsical gradients. The product feels immediate, calculated, immutable, and engineered with the utmost precision.

## Colors

The palette operates on a strict pitch-black, graphite, and neon-emerald chromatic discipline. 

- **Canvas & Underlays:** Grounded in Pitch Black (`#070908`) with a primary operational background of Deep Obsidian (`#0C0F0E`).
- **Surfaces & Cards:** Defined by Dark Graphite Tier 1 (`#121614`) for high-level groupings and Tier 2 (`#181E1B`) for active rows, hovered states, and inset telemetry modules.
- **Accents:** Neon Emerald (`#00E676`) is reserved for authoritative interactive calls to action, processing pulses, active state indicators, and successful validation hooks. Cyber Mint (`#10B981`) serves as a stable mid-tone for auxiliary status bars and secondary telemetry. Pale Lime (`#A7F3D0`) provides crisp accenting on dark badges and muted chips.
- **Data & Text Contrast:** Headers, totals, primary values, and line items use Crisp Diamond White (`#F8FAFC`). Metadata, timestamps, table labels, and auxiliary parameters use Pale Slate (`#94A3B8`). Structural borders use a hairline mask (`rgba(255, 255, 255, 0.08)`), transitioning to reactive emerald luminance (`rgba(0, 230, 118, 0.35)`) under focus or selection.

## Typography

Typography prioritizes micro-legibility and column-aligned scan rates under dense data presentation:

- **Primary Interface Font:** Geist handles titles, table column descriptions, system prompts, and configuration forms. Its geometric clarity and tight aperture remain sharp on high-DPI and standard display arrays alike.
- **Monospace Financial Engine:** JetBrains Mono is mandatory for all monetary sums, tracking numbers, VAT calculations, IP addresses, SKU entries, waybill barcodes, and raw status indicators. All numerals MUST render with tabular figures enabled (`font-variant-numeric: tabular-nums`) to ensure vertical alignment down data grids.
- **Labels & Micro-headers:** Set exclusively in uppercase JetBrains Mono with expanded letter tracking to instantly distinguish metadata tags from variable operational inputs.

## Layout & Spacing

The layout operates on a compact 4px baseline grid system calibrated for standard desktop viewports (1440px to 1920px+). 

- **Density:** Screen real estate is treated with zero waste. Vertical row padding within data grids stays locked at 6px to 8px.
- **Architecture:** The interface uses a fixed 240px utility sidebar on the left, a contextual split-pane preview on the right (collapsible from 400px to 640px for live PDF/waybill rendering), and a fluid multi-column operational center.
- **Breakpoints:** 
  - **Desktop Large (>=1440px):** Unrestricted 3-pane workbench (Sidebar, Data Grid/Generator, Real-time Document Renderer).
  - **Desktop Standard (1024px - 1439px):** Inspector drawer switches to an overlay dock. Table columns utilize horizontal scrolling with locked primary identifier columns.
  - **Compact Tablet View (768px - 1023px):** Collapsed navigation rail (56px), single-column execution mode.

## Elevation & Depth

Visual hierarchy uses **tonal surface layering paired with crisp 1px hairline perimeter borders**. Ambient drop shadows are strictly prohibited to maintain raw terminal performance and eliminate chromatic contamination.

- **Level 0 (Canvas Base):** Deep Obsidian (`#070908`), unbordered, anchoring global canvas boundaries.
- **Level 1 (Data Surfaces & Tables):** Graphite Base (`#121614`) enclosed by an explicit 1px outline of `rgba(255, 255, 255, 0.08)`.
- **Level 2 (Active Panels, Modals, Flyouts):** Graphite Raised (`#181E1B`) bordered with `rgba(255, 255, 255, 0.14)`.
- **Selected / Focused States:** Surface color holds while the border switches to an authoritative 1px hairline of `rgba(0, 230, 118, 0.40)` complemented by a tight, non-diffuse outline glow (`box-shadow: 0 0 0 1px #00E676, 0 0 8px rgba(0, 230, 118, 0.15)`).
- **Dividers & Structural Rules:** Set to 1px hairline rules using `rgba(255, 255, 255, 0.06)`.

## Shapes

The interface embraces an architectural, near-sharp contour profile (`roundedness: 1`). 

- Standard inputs, buttons, table cell wrappers, and system chips feature a strict `0.25rem` (4px) corner radius.
- System dialogs, slide-out document inspector trays, and master container cards scale to `0.375rem` (6px).
- Circles or fully rounded pills are restricted exclusively to operational status pings (e.g., active server heartbeat indicators) with a maximum dimension of 6px × 6px. Sliders and badges maintain rectangular discipline with 2px to 4px corners to avoid consumer-app softness.

## Components

### Buttons
- **Primary Execution (Generate, Authorize, Deploy):** Solid Neon Emerald (`#00E676`) background with Pitch Black (`#070908`) bold monospace text. Hover: `#10B981`. Active: Inset scale down with persistent `#00E676` perimeter glow.
- **Secondary (Export, Filter, Re-index):** Graphite Base (`#121614`) background, Crisp White (`#F8FAFC`) text, 1px border `rgba(255, 255, 255, 0.12)`. Hover: Background `#181E1B`, border `#00E676`.
- **Destructive / Void (Cancel Waybill, Invalidate):** Deep Red Wine base (`#2A0E11`), Crimson text (`#F87171`), 1px border `rgba(248, 113, 113, 0.2)`.

### Inputs & Form Elements
- **Text & Numeric Inputs:** Solid `#0C0F0E` background, 1px hairline `rgba(255, 255, 255, 0.12)` border, monospace numeric entry. Focus: Border shifts to `#00E676` with a zero-offset 1px ring.
- **Validation:** Error states replace the border with `#EF4444`. Success checks display an embedded `#00E676` micro-glyph inline.

### Tabular Ledger & Lists
- **Data Table:** Header row features `#0C0F0E` background, upper-case Slate (`#94A3B8`) JetBrains Mono text, bottom 1px border `rgba(255, 255, 255, 0.1)`. Row elements feature alternating row tone shifts (`#121614` vs `#101312`) with an instant hover highlight to `#181E1B` and an emerald left border pip (2px wide, `#00E676`).
- **Totals & Summary Footers:** Fixed baseline border, JetBrains Mono 16px medium text, accented total currency display in `#00E676`.

### Badges & Status Chips
- **Issued / Settled:** Forest Green ground (`#064E3B`), Pale Lime text (`#A7F3D0`), border `1px solid rgba(16, 185, 129, 0.3)`.
- **Pending / In-Transit:** Dark Amber ground (`#382405`), Warm Gold text (`#FCD34D`), border `1px solid rgba(245, 158, 11, 0.3)`.
- **Draft / Unsigned:** Slate ground (`#1E293B`), Pale Slate text (`#94A3B8`), border `1px solid rgba(148, 163, 184, 0.2)`.

### Cards & Telemetry Modules
- High-density information boxes (e.g., VPS RAM/CPU utilization, real-time queue count, VAT calculation breakdowns) are contained in `#121614` with a 1px `rgba(255, 255, 255, 0.08)` border, featuring an uppercase 10px label anchor in the top-left and right-aligned tabular metrics in `#F8FAFC`.