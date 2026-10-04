---
name: SEMS Wireframe System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#44474c'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#75777d'
  outline-variant: '#c5c6cc'
  surface-tint: '#555f70'
  primary: '#212b3a'
  on-primary: '#ffffff'
  primary-container: '#374151'
  on-primary-container: '#a3adc0'
  inverse-primary: '#bdc7db'
  secondary: '#585f6a'
  on-secondary: '#ffffff'
  secondary-container: '#dce3f0'
  on-secondary-container: '#5e6570'
  tertiary: '#282b2d'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e4143'
  on-tertiary-container: '#abadaf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e3f7'
  primary-fixed-dim: '#bdc7db'
  on-primary-fixed: '#121c2a'
  on-primary-fixed-variant: '#3d4757'
  secondary-fixed: '#dce3f0'
  secondary-fixed-dim: '#c0c7d3'
  on-secondary-fixed: '#151c25'
  on-secondary-fixed-variant: '#404752'
  tertiary-fixed: '#e1e2e4'
  tertiary-fixed-dim: '#c5c6c8'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: IBM Plex Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.005em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  table-cell:
    fontFamily: IBM Plex Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  table-header:
    fontFamily: IBM Plex Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  code-score:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
This design system embodies an architectural, precision-focused low-fidelity wireframe aesthetic designed specifically for the Scholarship Evaluation Management System (SEMS). The design eliminates chromatic distraction to focus entirely on administrative workflows, dense tabular data, complex scoring matrices, and candidate evaluation states.

- **Design Philosophy:** Structural functionalism. The visual layer serves purely to delineate content hierarchies, structural boundaries, and procedural task flows.
- **Personality:** Analytical, unbiased, methodical, and utilitarian.
- **Visual Style:** High-precision grayscale wireframe. Depth is communicated strictly through planar shifts, 1px structural framing, and line patterns (solid versus dashed) without atmospheric drop shadows, tinted fills, or glossy gradients.

## Colors
The palette is strictly achromatic and monochrome, calibrated to provide clear visual contrast between actionable, structural, and disabled interfaces:

- **Canvas & Base Surface (`#FFFFFF`):** Primary viewport backdrop for high-contrast scanning.
- **Panel & Container Tier (`#F3F4F6`):** Secondary container fill used for evaluation toolbars, structural sidebars, candidate detail panels, and table header rows.
- **Structural Lines & Outlines (`#9CA3AF`):** The primary boundary token. Applied uniformly across table grids, card perimeters, input borders, and badge contours at `1px solid`.
- **Primary Ink & Emphasis Surfaces (`#374151`):** Applied to primary actions, active navigation anchors, and dominant headers.
- **Muted Text & Inactive Elements (`#6B7280`):** Secondary metadata, breadcrumbs, placeholder text, and structural micro-copy.
- **Disabled State Surface (`#E5E7EB`):** Fill layer paired exclusively with dashed `#9CA3AF` perimeter strokes for inactive triggers and uneditable inputs.

## Typography
Typography is driven by IBM Plex Sans (with systemic Thai glyph parity) across all navigational, form, and data-dense interfaces.

- **Baseline Metrics:** A standard `line-height` of approximately 1.6 (`26px` on `16px` body) ensures optimal legibility during prolonged applicant dossier evaluations.
- **Scale Floor:** Strict accessibility cutoff at `14px`. No typographic token falls below this limit.
- **Tabular Data:** Table rows, cells, and numeric score metrics utilize an explicit `15px` standard paired with tabular lining figures (`font-variant-numeric: tabular-nums`) to preserve optical alignment down evaluation columns.
- **Numeric Scoring:** Rubric inputs and weighted calculated scores use `JetBrains Mono` at `15px` for absolute mechanical clarity.

## Layout & Spacing
The layout follows a structured fluid grid optimized for dual-pane and triple-pane evaluation interfaces (e.g., student application on the left, rubric evaluation matrix on the right).

- **Grid Architecture:** 12-column layout on desktop viewports with a persistent `260px` operational navigation sidebar. The content region operates on `1.5rem` (24px) gutters and `2.5rem` (40px) outer canvas margins.
- **Component Flow:** A 4px/8px incremental spacing scale governs all internal micro-interactions:
  - Form field groupings and metric rows use `space-md` (`1rem`).
  - Form labels and their corresponding input boxes are bound tightly using `space-xs` (`0.25rem`).
  - Section-to-section administrative dividers use `space-xl` (`2rem`).
- **Responsive Adaptations:**
  - **Desktop (>= 1200px):** Multi-column split views; application PDF review panel locked side-by-side with scoring sheets.
  - **Tablet (768px - 1199px):** Sidebar collapses to an icon/compact drawer; rubric evaluation switches to an overlay dock or full tabbed sheet. Margin scales down to `1.5rem`.
  - **Mobile (< 768px):** Stacks all columns vertically; navigation moves to top wireframe menu; horizontal scroll tables wrap in bounded wireframe overflow boxes.

## Elevation & Depth
In alignment with strict wireframe protocol, this design system operates entirely without shadows, box-shadow projections, blurred overlays, or chromatic elevation filters.

- **Planar Depth:** Hierarchy is established solely through surface layering: Level 0 base canvas (`#FFFFFF`) against Level 1 structural containers (`#F3F4F6`).
- **Stroke System:** Every elevated container, floating modal, dropdown menu, and table is defined by an uncompromising `1px solid #9CA3AF` stroke.
- **Z-Index Layering (Modals and Drawers):** Overlays use an unblurred solid `#FFFFFF` surface enclosed by a `2px solid #374151` structural border, positioned over an opaque dimming mask constructed with a 50% opacity solid gray or fine crosshatch wireframe stipple pattern.

## Shapes
To preserve an authentic blueprint/schematic character, components use subtle, restrained corner shaping:

- **Structural Components (Cards, Panels, Inputs, Tables, Buttons):** Uniformly styled with a tight `0.25rem` (4px) border radius. This subtle softening maintains rigid architectural alignment while distinguishing discrete interface controls from background grid intersections.
- **Status Badges & Pills:** Strictly fully-rounded pills (`border-radius: 9999px`) to immediately set evaluation lifecycle markers apart from rectangular functional buttons and input inputs.

## Components

### Buttons
- **Primary Button:** Background solid `#374151`, text `#FFFFFF`, border `1px solid #374151`, height `40px`, padding `0 16px`, font `label-md`. Focus state displays an outer `2px solid #374151` offset ring.
- **Secondary / Outlined Button:** Background transparent, text `#374151`, border `1px solid #9CA3AF`, height `40px`, padding `0 16px`. Hover state swaps background to `#F3F4F6`.
- **Disabled Button:** Background `#F3F4F6`, text `#9CA3AF`, border `1px dashed #9CA3AF`, cursor `not-allowed`.

### Status Badges (Pills)
All badges utilize an outlined pill shape (`border-radius: 9999px`), `1px solid` border, height `24px`, padding `0 10px`, font `14px` medium (`label-sm`). Distinctions are rendered exclusively via border and typography styling:
- **Draft:** Border `1px dashed #9CA3AF`, text `#6B7280`, background `#FFFFFF`.
- **Open:** Border `1px solid #374151`, text `#374151`, background `#FFFFFF`.
- **Editing:** Border `1px solid #9CA3AF`, text `#374151`, background `#F3F4F6`.
- **Submitted:** Border `1px solid #374151`, text `#FFFFFF`, background `#374151`.
- **Finalized:** Double border (`3px double #374151`), text `#374151`, background `#FFFFFF`.
- **Closed:** Border `1px solid #9CA3AF`, text `#9CA3AF`, background `#FFFFFF` with diagonal line-through or strikethrough text accent.

### Input Fields & Controls
- **Text Inputs & Dropdowns:** Background `#FFFFFF`, border `1px solid #9CA3AF`, height `40px`, padding `0 12px`, typography `body-md`. Focus state uses `1px solid #374151` with no glow. Disabled inputs use background `#F3F4F6` with border `1px dashed #9CA3AF`.
- **Checkboxes & Radios:** `18px x 18px` square or circle with `1px solid #9CA3AF`. Checked state fills the interior with `#374151` displaying a white geometric tick or radio dot.

### Tables (Evaluation & Applicant Lists)
- **Container:** Outer perimeter `1px solid #9CA3AF`, border collapse.
- **Header Row:** Background `#F3F4F6`, bottom border `1px solid #9CA3AF`, typography `table-header` (`15px`, bold), text `#374151`, height `44px`, padding `0 12px`.
- **Body Rows:** Background alternating between `#FFFFFF` and `#FAFAFA` (or solid `#FFFFFF` with cell divider lines `1px solid #E5E7EB`), typography `table-cell` (`15px`), text `#374151`, height `48px`, padding `0 12px`.
- **Row Selected/Active:** Background `#F3F4F6` with a `2px solid #374151` inset left border marker.

### Cards & Evaluation Scoring Panels
- **Standard Card:** Background `#FFFFFF`, border `1px solid #9CA3AF`, padding `space-lg` (24px).
- **Rubric Scoring Criterion Card:** Background `#FFFFFF`, border `1px solid #9CA3AF`. Header bar nested inside with background `#F3F4F6` and bottom border `1px solid #9CA3AF`, padding `12px 16px`. Score tally inputs displayed on the right edge in JetBrains Mono.