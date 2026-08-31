# Reskinning a site

The two sites are visually independent. They share exactly one stylesheet —
`packages/theme/src/reset.css` — which contains no colours and no fonts.

| To change the look of | Edit |
| --- | --- |
| The professional site | `sites/work/src/styles/brand.css` |
| Milkshake O'neil | `sites/music/src/styles/brand.css` |

Components reference tokens, never literal colours, so replacing the values at
the top of a brand file re-skins the whole site.

## The professional site runs THE PLATE SYSTEM

Rev A, issued 2026-08-31. Full illustrated guide:
<https://claude.ai/code/artifact/57015fc9-1d81-4c02-a52e-514bd8c429a1>
Summary lives in the project at `claude/style-guide.md`.

CAD drafting crossed with comic ink printing. A plate is both the sheet you
draw on and the thing you print from, so **every section is a bounded,
numbered sheet** — 4 px border, sheet number in a black corner box, callout
tag in the label rail, a rule at pen weight separating rail from drawing area,
and a titleblock at the foot of the page.

The music site is **not** on this system yet. That is an open question, not an
oversight.

## The token contract

Two sets, and the split is the whole thing.

```
INK — theme-independent. Everything that sits on a plate.
  --paper --surface --sunk        stock, vellum, newsprint
  --ink --ink-mid --ink-soft      type and keyline, descending emphasis
  --rule --rule-soft              hairline dividers
  --tally --tally-wash            spot 1, program / live
  --held --held-wash              spot 2, audio green, reused for "held"
  --focus                         spot 4, systems blue — the focus ring only
  --f-display --f-body --f-mono   the three typefaces
  --lw-hair … --lw-edge           six ISO 128 pen widths
  --lift --lamp                   the only two shadows
  --gutter --rail --max --plate-pad --plate-gap

PAGE — the desk the plates lie on, the margins, off-plate copy.
  --page --page-ink --page-dim --grid-line
```

`--draft-*` still exists and RouteMap still uses it, but under this system the
whole page is a drafting plate, so those tokens are now **aliases onto the ink
set**. The rule they encode is unchanged: anything inside `.diagram` uses
`--draft-*`, never the page tokens.

## Five rules that will bite otherwise

**1. The site is light only, and that is the design.** There is no
`prefers-color-scheme` block and no `data-theme` handling — do not add one. A
schematic printed on dark paper is not a thing; the four route colours only
read correctly on light ground, which is why the plate was never allowed to
invert even when a dark mode existed. All dark was left to change was the desk
behind the sheets, and a dark desk under bright sheets is glare, not
atmosphere. `color-scheme: light` on `:root` is load-bearing — it keeps
scrollbars and form controls light for a viewer whose OS is dark. A dark
treatment would be a redesign of the ink set, not a token override.

**2. `.wrap` and `.section-grid` are the same element.** The markup is
`<div class="wrap section-grid">`. `::before` on that element is the sheet
number; the rail rule therefore has to be `::after`. Attaching a second
`::before` silently renders the sheet number inside the rail rule — it looks
like a rendering glitch, not a CSS mistake, and greps will not find it.

**3. Amber is fill and line only, never text.** `#D89A2C` is the Video route
colour and measures **2.17:1** on stock — it fails at any size. Line labels in
the crew map are therefore set in keyline black; the 9 px route stroke beside
them carries the colour. Tally red (4.80:1) and bay green (4.52:1) pass on
stock but not on the newsprint panel, so keep them off `--sunk`.

**4. Don't delete `[hidden] { display: none !important }` from the reset.** The
browser's own rule is a bare attribute selector, so any class setting `display`
defeats it. Both interactive sections toggle state with `hidden`.

**5. Nothing has a corner radius.** Zero everywhere, chips and buttons
included. The single exception is `.tally-dot`, which is round because it is a
light and not a box.

## One shadow, and it has no blur

`--lift` — `4px 4px 0 var(--ink)`, hard. Only on things you can press: hover
moves 2 px and halves it, active moves 4 px and collapses it.

That is the whole list. A plate sits flat on the desk, held by its border, not
by a shadow. `--lamp` used to exist as a soft glow lifting a lit sheet off a
dark desk; dropping dark mode removed the only reason for a blurred shadow to
be in the system, which puts it back to the one shadow it always wanted.

## The three instruments

The Plate System bans the usual ways of making a page pop, so the ones that
shipped are mechanisms, not effects.

- **The vocabulary switch** (`Masthead.astro`). One control retitles the crew
  map and the role line between production and technology vocabulary. Both
  title sets are **server-rendered**; the switch only sets `data-vocab` on
  `<html>` and CSS shows one. Nothing rewrites text, and with JS off the
  production vocabulary renders. Data is `reads-title` in `crew.yaml`.
- **The tally rail** (`Rail.astro`). Sticky sheet index, one lamp lit. Lamps
  are read out of the DOM — names from each sheet's callout tag — so the rail
  can never disagree with the sheets or their numbering. No rail without JS,
  which is fine: it is a shortcut, not a route.
- **The lower third** (`Masthead.astro`). Name and role, hard-edged, static.
  The one motion is the take: a five-step wipe, once, on load, never on scroll.

Two traps in the switch, both because `.switch-throw` is a `<span>`. A bare
`.switch span` rule clobbers its `position: absolute` and drops it into the
grid as a third cell; and `:nth-of-type()` counts spans, not classes, so the
throw is span 1 and the labels are 2 and 3. **Match the labels by `data-v`,
never by position.** This is the same family as the `.wrap` / `.section-grid`
collision in rule 2 — positional selectors in this codebase are a trap.

## Motion

90–120 ms, linear. Nothing eases, nothing springs, nothing fades in on scroll.
The one animation is `.tally-dot`, and it uses `steps(1, end)` — a tally light
snaps on, it does not glow up.

## Counted, never typed

- **Sheet numbers** come from a CSS counter on `main`, so adding or removing a
  section renumbers the page by itself.
- **`SHEETS 00 – nn`** in the titleblock reads the same counter.
- **`SEATS HELD 14 / 17`** is computed from `crew.yaml`.
- **The rail's lamps** are read from the sheets themselves at run time.

None of these three may be hand-edited. An overclaim in the seat count is the
kind an interview question exposes.

## Fonts

Loaded from Google Fonts in each site's layout — `sites/work/src/layouts/Base.astro`
and `sites/music/src/pages/index.astro`. Changing a typeface means changing both
the `<link>` there and the `--f-*` token in the brand file. Always keep a real
fallback stack after the webfont name.

Three faces, three jobs, and a face never does another's job: **Familjen
Grotesk 700** for the wordmark and callouts (caps), **Newsreader** for prose
(sentence case), **DM Mono 500** for labels, dimensions and the titleblock
(caps). Titles stay in sentence case on purpose — caps are reserved for the
wordmark, section callouts and mono, so the page reads senior rather than
shouted. A fourth face is a bug.

## Checking your work

```sh
npm run dev
```

There is one theme, so there is no second state to check. Do switch macOS to
dark once after any change to the token block, though — not to see a dark
design, but to confirm the page still renders light and the scrollbars and form
controls come with it. That is what `color-scheme: light` is guarding.

`sites/work/src/styles/brand.css.as-built.bak` is the original "as-built"
direction, two revisions stale now. Nothing imports it. Delete it whenever:
`rm sites/work/src/styles/brand.css.as-built.bak`
