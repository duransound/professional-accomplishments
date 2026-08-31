# Editing the site

Everything you'd ever want to change lives in **one folder**:

```
sites/work/content/
├── site.yaml         your name, contact details, search description
├── lenses.yaml       the four framings + all the resume bullets
├── experience.yaml   jobs and education
├── crew.yaml         the crew map — every seat and its translation
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

Go to **localhost:4321**. Now edit any file above, hit save, and the page
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

**Add a crew seat** — copy a whole seat block into the right department. It
needs `id`, `title`, `short`, `status`, `what`, `room`. Keep `short`
under about 20 characters or labels collide on the diagram. The station appears
automatically and the "worked N of M" sentence recounts itself.

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
