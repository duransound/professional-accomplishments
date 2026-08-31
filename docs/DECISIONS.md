# Decisions

Fuller strategy notes live in the "Update personal website" Claude project
(brainstorm, domain search, crew map, build log). This file is the short version
the repo needs to stand on its own.

## Architecture

**Two domains, one repo.** An artist brand and a program-management resume
undercut each other on a shared front page. Two front doors means each visitor
lands somewhere built for them; one codebase means near-zero extra maintenance.

`milkshakeoneil.com` stays the music door — it carries link equity from the
Spotify, Apple Music, and YouTube artist profiles. The professional site gets
its own domain.

## Domain — DEFERRED

Not yet chosen. Build on temporary `*.pages.dev` URLs and name it once the site
is visible enough to decide against.

Ruled out: plain firstname/lastname (`ianduran.com`, `iduran.com`, and
`ian-duran.com` are all long taken), and the production-vocabulary concept names.

Best remaining lead: **`duranian.com`** — available, and already Ian's LinkedIn
handle. Also available: `housetohalf.com`, `standbyandgo.com`, `cuetocue.io`,
`unitygain.io`, and `ianduran.{io,dev,me,net}`.

Whatever gets picked, register `ianduran.net` (~$12/yr) as a 301 redirect.
A concept domain is a better writing brand but slightly worse at "a recruiter
googles Ian Duran" — mitigated far more by the name in `<title>`, `<h1>`, and
schema.org `Person` data than by the domain string.

## Stack

Astro + Markdown, no CMS. At a few posts a year a CMS is overhead that never
pays for itself. Cloudflare Pages for hosting — free tier covers this many times
over (500 builds/month, unmetered bandwidth), and it consolidates DNS and
registrar in one place.

## Design

Accent is **tally red** — the light that tells you which camera is live. Chosen
because it's the most specific object in Ian's working world and already means
"this one's on." Warm grey paper against blue-biased ink. Familjen Grotesk /
Newsreader / DM Mono. Layout is a technical rider: mono eyebrow labels, hairline
rules, a spec table, a timeline rail.

## The crew map

The strongest idea on the site. Production titles don't travel — outside the
industry nobody knows what an A1 does, which makes eleven years unreadable to
the exact people Ian is trying to reach. The map translates each seat into its
technology-org analogue.

It never argues that the experience transfers. It lays out the translation and
lets the reader conclude it, which is much harder to dismiss.

**Three seats look adjacent but are deliberately separate. Do not collapse them:**

- `pm` — Program Management: the portfolio of *events and programs*
- `resm` — Regional Event Studio Manager: the portfolio of *rooms*, with budget
  and vendor accountability
- `ops` — Studio Operations: readiness *between* shows, the maintenance function

That separation is the argument that Ian operated at three different altitudes.

Statuses (led / held / adjacent) were confirmed by Ian on 2026-08-31 and are
load-bearing. An overclaim here is the kind a single interview question exposes.

## Deliberate omissions

- **Phone number is not on the site**, though it is in the resume data. It
  belongs on a resume sent to a person, not a public page.
- **The sabbatical is stated plainly**, framed as executed long-range planning
  rather than a gap needing an excuse. Three sentences, then stop — length
  signals defensiveness.
- **Hands on names capabilities without explaining them.** The crew map already
  does the explaining; prose there was saying the same thing twice, weaker.
