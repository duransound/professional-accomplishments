# Editing the site

Everything you'd ever want to change lives in **one folder**:

```
sites/work/content/
├── site.yaml         your name, contact details, search description
├── lenses.yaml       the four framings + all the resume bullets
├── experience.yaml   jobs and education
├── crew.yaml         the crew map — every seat and its tech-title translation
├── kit.yaml          the "Hands on" tags
└── notes/            blog posts, one Markdown file each
```

You never need to touch anything outside this folder to change words.

## Seeing your changes

Open a Terminal window and leave this running:

```sh
cd ~/Projects/duran-web
npm run dev
```

Go to the address the terminal prints next to **Local**. Now edit any file above, hit save, and the page
updates by itself. No refresh, no rebuild. `Ctrl-C` in that window stops it.

## Three rules that cover almost everything

**1. Indentation is the structure.** Lines that line up belong together.
Use spaces, never tabs. If you copy a block, keep its indentation identical
to its neighbours.

**2. Long text goes under a `>`.** Like this:

```yaml
what: >
  Owns everything anyone hears. You can write as many lines as you like
  underneath, and they get joined into one paragraph.
```

This is not decoration — it's what lets you write naturally. Text under a `>`
can contain colons, quotes, dashes, anything, and nothing will break. **When in
doubt, use `>`.**

**3. Anything starting with `#` needs quotes.** Colours especially:

```yaml
color: "#C2372A"     # correct
color: #C2372A       # broken — YAML reads this as a comment
```

## Common changes

**Reword a resume bullet** — `lenses.yaml`. Find the lens, find the bullet,
rewrite the text under its `- >`.

**Change which framing loads first** — `lenses.yaml`, the `default:` line at the
top. Set it to whichever role type you're most actively going for.

**Add a job** — `experience.yaml`. Copy an existing block, keep the
indentation. Give it either a `note:` (fixed paragraph) or a `lensKey:`
(bullets that change with the lens), not both.

**Fix a crew seat's description** — `crew.yaml`. Find the seat, edit `what`
or `room`.

**Change what a seat is called in tech terms** — `crew.yaml`, the
`reads-title` field. Just the job title, no sentence. It is what the
**vocabulary switch** in the masthead shows in place of `short`, so keep it
under about 20 characters too or the labels collide.

**Add a crew seat** — copy a whole seat block into the right department. It
needs `id`, `title`, `short`, `reads-title`, `status`, `what`, `room`, plus the
three zone-plate fields below. Keep both `short` and `reads-title` under about
20 characters or labels collide on the diagram. The station appears
automatically and the "worked N of M" sentence recounts itself.

**The three zone-plate fields** — every seat also carries:

- `zone` — which zone the body is actually in during a show. Must match an `id`
  in the `zones` block at the top of the file, or the build stops and tells you
  which ids would have worked. Use `program` for a role with no show-time
  position at all.
- `visibility` — `immediate`, `delayed` or `invisible`. How long it takes
  anyone to notice the seat is empty. This is the argument the plate makes, so
  it is worth being honest: `immediate` means the room notices, `delayed` means
  it turns up in the recording, `invisible` means months.
- `consequence` — one or two sentences on what actually goes wrong when nobody
  is in the seat. Written as plain cause and effect, not as a warning.
- `contested` — optional, and only for a seat whose placement is genuinely
  arguable. It renders as a note on the seat panel. An honest one reads better
  than a confident wrong one.

**Move a zone, or add one** — the `zones` block at the top of `crew.yaml`.
`plan` is `[x, y, width, depth]` in floor-grid units and `lift` is riser
height; the isometric is computed from those, and seats pack into their zone in
the order they appear under `departments`. Nothing on the plate is positioned
by hand, so adding a seat moves the drawing correctly. A zone nobody sits in
renders as NO SEAT ASSIGNED — that hole is counted, not typed.

**Edit on the page** — the easy way to change wording anywhere on the site.
Run `npm run dev`, open any page (the homepage, a project), and click **Edit
text** in the bottom-right corner. Click any sentence and type; press **Save**
or ⌘S. The page reloads showing the change and stays in edit mode. Each edit
is written back into the file it came from — `site.yaml`, `lenses.yaml`,
`experience.yaml`, `kit.yaml`, `crew.yaml`, or a case study — and only the
lines you changed move.

- The summary and job bullets change with the lens buttons. Press a lens to
  edit its version. The same goes for the masthead switch: flip it to edit the
  technology-vocabulary titles.
- On the crew map, click a station to open its panel, then edit its text.
  The two counted sentences, the legend, the view buttons, the zone list
  (open "Every zone and who sits there") and the panel labels are editable
  too. Words like "seventeen" in those sentences are grey chips — they are
  counted from the seats, so write around them. Labels drawn inside the map
  itself (seat codes, zone names on the floor) follow the text you edit in
  the zone list and the seat panels.
- Links, emails, ids, colours, dates and statuses can't be changed on the page
  — those stay in the files.

- Numbers that are worked out from the data appear as grey locked chips while
  editing. Rewrite the sentence around them — they can't be typed over, which
  is what keeps the prose and the scorecard in agreement.
- Return makes a new paragraph in body text. In titles, headings and list
  items it does nothing; those stay one line.
- ⌘B and ⌘I work in case studies and the lens summaries. Pasting always comes in as plain text.
- If the file was changed somewhere else after the page loaded, the save is
  refused and asks you to reload, so an old tab can't overwrite newer text.
- The edit button and the save endpoint exist only under `npm run dev`. Neither
  is in the published site.

What edit mode can't change: numbers, room scores, adding or removing a
finding. Those live in the header of
`content/case-studies/<name>.md`, above the closing `---`.

**Write a note** — add a file to `content/notes/`:

```markdown
---
title: What show calling taught me about status reporting
date: 2026-09-14
summary: One sentence, shown in the list on the homepage.
draft: true
---

Your writing here, in normal Markdown.
```

`draft: true` means it doesn't get published at all — no page, no URL. Delete
that line when it's ready.

## If you break something

You'll get a message naming the file and the field, like:

```
PROBLEM IN content/crew.yaml

1 thing needs fixing:

  • departments › "Audio" › seats › "A1 — Audio Lead" › status
      must be exactly one of: led, held, adjacent
```

Fix it and save. The page reloads by itself. Nothing is damaged in the
meantime — a broken file just stops the page rendering until it's valid.

## Two things not to hand-edit

**The seat count.** "Of the seventeen seats below, I have personally worked
fourteen" counts itself from `crew.yaml`. There is no number to update.

**`status` values.** `led`, `held`, `adjacent` — exactly those three words.
They decide whether a station is drawn solid or dashed, and they feed the
count. This is the one field where being wrong is costly: an overclaim here is
the kind a single interview question exposes.

## Link previews

When a page is shared on LinkedIn, in an email or a text, the preview card is
a 1200×630 image from `sites/work/public/og/` — one for the homepage and one
per project. They are pictures, so they don't update themselves: if a
project's title or headline numbers change, ask Claude to regenerate the
card. A new project needs its own card, or it falls back to the homepage one.
