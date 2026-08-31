# duran-web

Two sites, one repo, one shared design system.

| Site | Workspace | Domain | Status |
| --- | --- | --- | --- |
| Professional / writing | `sites/work` | not yet chosen | building |
| Milkshake O'neil (music) | `sites/music` | milkshakeoneil.com | stub |

## Running it

```sh
npm install          # once, from the repo root
npm run dev          # the work site  → localhost:4321
npm run dev:music    # the music site → localhost:4322
npm run build        # builds both
```

## Layout

```
packages/theme/      design tokens + base styles, shared by both sites
sites/work/
  src/data/          all content lives here — edit these, not the markup
    crew.ts          the crew map: 17 seats and their translations
    lenses.ts        four framings of the same experience
    experience.ts    roles and education
    kit.ts           hands-on capability list
    site.ts          name, contact, tagline
  src/components/    presentation only
  src/content/notes/ Markdown posts
sites/music/         stub
docs/                strategy: brainstorm, domain search, crew map, build log
```

## How the interactions work

Both the lens switcher and the crew map render **every** state server-side and
hide the inactive ones with the `hidden` attribute. The scripts only flip which
element is visible. Two consequences worth preserving:

1. The page works with JavaScript disabled — the default lens and default seat
   are both fully readable.
2. No content is duplicated into a `<script>` tag to be re-rendered on the
   client, so the data files stay the single source of truth.

The seat count in the crew map intro is **computed from the data**, never typed,
so it can't drift when a seat is added.

## Before launch

- [ ] Choose the domain, then set `site:` in both `astro.config.mjs` files
- [ ] Music site: replace the dead ToneDen sample-pack link (ToneDen shut down in 2024)
- [ ] Music site: pull hero/profile images off the current Wix site
- [ ] Unlock `milkshakeoneil.com` in Wix — it carries `clientUpdateProhibited`,
      which blocks nameserver changes until cleared
- [ ] Cancel the Wix plan only after DNS has propagated

## Deploying

Cloudflare Pages, one project per site, both pointed at this repo.

- Build command: `npm run build:work` (or `build:music`)
- Output directory: `sites/work/dist` (or `sites/music/dist`)
