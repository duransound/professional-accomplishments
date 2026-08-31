# Decisions

Why this repo is shaped the way it is. Strategy and content notes live
elsewhere; this covers the build.

## Two sites, one repo

An artist brand and a program-management resume undercut each other on a shared
front page, so they get separate front doors. One codebase keeps the
maintenance cost near zero and the design language identical.

| Site | Workspace | Domain |
| --- | --- | --- |
| Professional / writing | `sites/work` | not yet set |
| Milkshake O'neil (music) | `sites/music` | milkshakeoneil.com |

## Stack

Astro, static output, Markdown and YAML content, no CMS. At a few posts a year
a CMS is overhead that never pays for itself. Cloudflare Pages for hosting.

## Content is separated from markup

Everything editable is YAML and Markdown in `sites/work/content/`. `src/data/`
holds schemas that read and validate those files — it holds no content itself.
Changing the resume never means opening a component. See `CONTENT.md`.

Validation reports mistakes by file and field name in plain language, and
resolves list positions to names by walking the parsed data. The three failure
modes that actually happen — a bad enum value, an unquoted colour, broken
indentation — were each tested to confirm the message is useful.

## Both interactions render every state server-side

The lens switcher and the crew map render all their states into the HTML and
hide the inactive ones with the `hidden` attribute; the scripts only flip
visibility. Two consequences worth preserving:

1. The page is fully readable with JavaScript disabled.
2. No content is duplicated into a `<script>` tag, so the YAML stays the single
   source of truth.

**This depends on the global `[hidden] { display: none !important }` rule in
`packages/theme/src/base.css`.** The browser's default is a bare attribute
selector, so any class setting `display` silently defeats it — which is exactly
what happened, and one role rendered bullets from two lenses at once.

## The crew map

Departments are lines, seats are stations, all lines terminate at ON AIR.
Solid station = seat held, dashed = worked alongside. Geometry is computed from
`content/crew.yaml`, so adding a seat moves the diagram correctly.

Three seats look adjacent but are deliberately distinct — **do not collapse
them**, the separation is the argument that the same person operated at three
different altitudes:

- `pm` Program Management — the portfolio of *events and programs*
- `resm` Regional Event Studio Manager — the portfolio of *rooms*, with budget
  and vendor accountability
- `ops` Studio Operations — readiness *between* shows, the maintenance function

The "worked N of M seats" figure is computed, never typed.

## The drafting plate

`--draft-*` tokens are theme-independent on purpose. A schematic printed on
dark paper is not a thing, and the route colours only read correctly on light
ground, so in dark mode the drawing sits as a lit plate against the dark page.
Anything inside `.diagram` must use `--draft-*`; using `--ink` there produces an
invisible border in dark mode.

## Deliberate omissions

- **No phone number on the site.** It belongs on a resume sent to a person.
- **Drafts never build.** `getStaticPaths` filters `draft: true`, so an
  unfinished note gets no public URL rather than merely going unlinked.

## Before launch

- [ ] Choose the domain, then set `site:` in both `astro.config.mjs` files
- [ ] Music site: replace the dead sample-pack link — ToneDen shut down in 2024
- [ ] Music site: pull hero and profile images off the current Wix site
- [ ] Unlock `milkshakeoneil.com` in Wix; it carries `clientUpdateProhibited`,
      which blocks nameserver changes until cleared
- [ ] Cancel the Wix plan only after DNS has propagated

## Deploying

Cloudflare Pages, one project per site, both pointed at this repo.

| | Work site | Music site |
| --- | --- | --- |
| Build command | `npm run build:work` | `npm run build:music` |
| Output directory | `sites/work/dist` | `sites/music/dist` |
