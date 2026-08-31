# Reskinning a site

The two sites are visually independent. They share exactly one stylesheet —
`packages/theme/src/reset.css` — which contains no colours and no fonts.

| To change the look of | Edit |
| --- | --- |
| The professional site | `sites/work/src/styles/brand.css` |
| Milkshake O'neil | `sites/music/src/styles/brand.css` |

Nothing else needs touching. Components reference tokens, never literal
colours, so replacing the values at the top of a brand file re-skins the whole
site.

## What a brand file has to define

Every component reads from these. Rename them only if you're prepared to update
the components too.

```
--paper --surface --sunk       page grounds, back to front
--ink --ink-mid --ink-soft     text, in descending emphasis
--rule --rule-soft             borders
--tally --tally-wash           the accent, and a low-opacity version of it
--f-display --f-body --f-mono  the three typefaces
--gutter --rail --max          layout measurements
```

## Three rules that will bite otherwise

**1. Define every colour on bare `:root` first.** The viewer's theme has three
states, not two: an explicit choice stamps `data-theme` on the root element,
but the default "system" setting stamps *nothing*. A colour whose only
definition sits inside a media query or a `[data-theme]` block never applies in
that un-stamped state, and the page renders one theme's text on the other
theme's ground. Dark mode redefines **tokens only**, never component rules.

**2. Don't delete `[hidden] { display: none !important }` from the reset.** The
browser's own rule is a bare attribute selector, so any class setting `display`
defeats it. Both interactive sections toggle state with `hidden`. Without this
rule, one role renders bullets from two lenses at once.

**3. The drafting plate is intentionally not theme-reactive.** `--draft-*` in
the work brand keeps light values in both themes, because a schematic printed
on dark paper is not a thing and the route colours only read correctly on light
ground. Anything inside `.diagram` must use `--draft-*`; using `--ink` there
gives you an invisible border in dark mode.

## Fonts

Loaded from Google Fonts in each site's layout — `sites/work/src/layouts/Base.astro`
and `sites/music/src/pages/index.astro`. Changing a typeface means changing both
the `<link>` there and the `--f-*` token in the brand file. Always keep a real
fallback stack after the webfont name.

## Checking your work

```sh
npm run dev
```

Then look at it in **both** themes — macOS System Settings → Appearance, or
your browser's dev tools. Most theming bugs are invisible in the theme you
happened to be designing in.
