# Tab Sunset List — visual thesis

## Direction: the sunset almanac

Tab Sunset List uses **generative geometry** to turn an invisible, anxious pile of
browser tabs into a finite daily horizon. Concentric orbits stand for time;
rectangular slips stand for individual tabs; the sun line is the moment a tab
needs a decision. Geometry is useful here, not decorative: every repeated angle,
arc, and tick suggests expiry, movement, and a queue becoming smaller.

The product should feel like a small field instrument rather than a dashboard:
deliberate, tactile, private, and calm. There is no generic gradient hero, stock
photography, glassmorphism, or SaaS-card grid.

## Palette

The light treatment is explicit and primary because review happens during the
workday. The dark popup treatment follows the browser when the system is dark.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| paper / background | `#F3ECDD` | `#171A19` | warm notebook ground / night horizon |
| ink / text | `#172A25` | `#F7F0E1` | evergreen-black, never pure black |
| muted ink | `#58665F` | `#AEB8B1` | supporting copy; ≥ 4.5:1 |
| surface | `#FFF9EC` | `#222724` | tab slips and control planes |
| vermilion / accent | `#B73A29` | `#F2755E` | the setting sun, current decision |
| accent contrast | `#FFF9EC` | `#171A19` | text on accent |
| marigold | `#E7A62C` | `#F0B94C` | scheduled / time markers |
| moss / success | `#23604A` | `#68C49C` | kept and safely stored |
| danger | `#A42B31` | `#FF7A82` | closing or failure |
| line | `#C8BDAA` | `#3C4540` | rules and rings |

Status is always reinforced with words and distinct symbols. Focus uses a 3px
vermilion outline with a paper offset. Surfaces use one-pixel ink rules and hard
2–4px shadows, echoing stacked paper instead of floating generic cards.

## Typography

- Display: `Georgia`, `Iowan Old Style`, `Times New Roman`, serif. The editorial
  curve makes a deadline feel considered instead of alarmist.
- Interface: `Inter`, `Avenir Next`, `Segoe UI`, sans-serif. System-resident only;
  no font download, tracking, or runtime dependency.
- Scale: 13px metadata, 16px body, 20px control heading, 28px section heading,
  clamp(42px, 7vw, 78px) landing headline. Body leading is 1.55 and reading copy
  is capped at 66 characters. Dates and counts use tabular figures.

## Spacing and shape

Spacing follows a 4px unit: 4, 8, 12, 16, 24, 32, 48, 72. The popup is 380px
wide and remains usable down to 320px; the review page and site stack at 680px,
and the landing page is explicitly composed for 390px. Controls are at least
44px tall with 8px between adjacent targets. Corners are restrained (6px), with
circles reserved for suns, countdowns, and decision markers.

## Interaction grammar

- **Tag:** the active tab becomes a paper slip and moves toward a selected orbit.
- **Review:** one due item is primary. Keyboard shortcuts map directly to actions:
  `K` keep, `S` reschedule, `B` bookmark, `C` close; arrow keys move the queue.
- **Resolve:** the chosen slip exits toward its semantic destination, the counter
  decrements, and a local undo ribbon appears after close.
- **Export:** Markdown is a clear file/clipboard outcome, not a cloud action.

Loading uses quiet skeleton lines. Empty states show a clear horizon and one next
step. API errors remain in context, explain what failed, and provide retry. The
landing site has an honest browser-only demo rather than pretending web pages can
read real tabs.

## Motion policy

State changes use 180–240ms opacity and transform transitions. A reviewed tab
slides 12px toward its outcome; the daily count ticks once; the hero's small
orbital markers drift once on initial entrance only. Nothing loops. Under
`prefers-reduced-motion: reduce`, transforms and animated scroll are removed and
state changes become instant opacity swaps. Meaning never depends on motion.

## Asset plan and provenance

### Generated horizon hero

- Use: landing hero; abstract emotional explanation of tabs reaching an expiry
  horizon. It does not depict or imply unavailable product features.
- Art direction / prompt sheet:
  - Subject: a precise geometric sunset made from layered paper tab slips,
    concentric orbital arcs, and a single vermilion disk crossing a horizon.
  - World: tactile desk-almanac abstraction, no device mockup.
  - Materials: cut paper, screenprint ink, subtle fiber grain, crisp edges.
  - Light/lens: flat editorial lighting, orthographic, no photographic depth.
  - Palette words: warm parchment, evergreen ink, vermilion sun, marigold ticks,
    muted moss.
  - Composition: wide landscape, visual weight right of center, generous calm
    negative space on the left, readable at mobile crop.
  - Negative list: no text, no letters, no numbers, no UI screenshots, no people,
    no browser logos, no brand marks, no watermark, no generic gradient, no 3D
    chrome, no neon.
- Final generation prompt: see `assets/src/sunset-horizon.prompt.json`.
- Generator: Azure OpenAI image deployment `factory-image` via the factory
  `/opt/fleet/lib/gen-image.sh` utility.
- Date: 2026-08-27.
- License/provenance: original AI-generated work commissioned for this product;
  reviewed for text artifacts, marks, seams, unintended symbols, and palette fit.
- Delivery: source PNG retained under `assets/src/`; optimized responsive WebP
  renditions ship in the static site and each remains ≤300 KB.

### Authored geometry

Logo, favicon, extension icons, status marks, and small horizon ornaments are
hand-authored SVG/CSS geometry in this repository. They use no outside asset or
icon library. Generated imagery is disclosed in the landing footer.
