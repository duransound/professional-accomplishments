/**
 * Where every editable piece of a case study sits in its Markdown file.
 *
 * The page renders one block at a time and tags each with an address; the
 * dev-only edit mode sends changed text back with that address, and the save
 * handler re-parses the file and replaces exactly that span. Nothing else in
 * the file is touched, so an edit can never reformat a paragraph you didn't
 * change.
 *
 * Addresses:
 *   s:<Section>:<n>        the nth paragraph or list in a ## section
 *   s:<Section>:<n>:<k>    the kth item of that list
 *   f:<ref>:title          a finding's title, after "### F-01 · "
 *   f:<ref>:<n>            the nth paragraph or list inside that finding
 *   f:<ref>:<n>:<k>        a list item inside a finding
 */

export type Kind = "p" | "ul" | "marker";
export interface Span { start: number; end: number }
export interface Item extends Span { addr: string; text: string }
export interface Block extends Span { addr: string; kind: Kind; text: string; items: Item[] }
export interface FindingBlocks { ref: string; titleAddr: string; title: string; titleSpan: Span; blocks: Block[] }
export interface SectionBlocks { name: string; blocks: Block[]; findings: FindingBlocks[] }
export type Doc = Record<string, SectionBlocks>;

interface Line { text: string; start: number; end: number }

const LIST = /^[-*]\s+/;
const HEAD3 = /^###\s+(\S+)(\s*[·—–:|-]\s*)?(.*)$/;

function toLines(body: string): Line[] {
  const out: Line[] = [];
  let pos = 0;
  for (const text of body.split("\n")) {
    out.push({ text, start: pos, end: pos + text.length });
    pos += text.length + 1;
  }
  return out;
}

function chunk(lines: Line[]): Line[][] {
  const groups: Line[][] = [];
  let cur: Line[] = [];
  for (const l of lines) {
    if (l.text.trim() === "") { if (cur.length) groups.push(cur); cur = []; }
    else cur.push(l);
  }
  if (cur.length) groups.push(cur);
  return groups;
}

function makeBlock(body: string, ls: Line[], addr: string): Block {
  const first = ls[0]!, last = ls[ls.length - 1]!;
  if (ls.length === 1 && first.text.trim() === "<!-- status-table -->") {
    return { addr: "", kind: "marker", start: first.start, end: last.end, text: "", items: [] };
  }
  if (LIST.test(first.text)) {
    const items: Item[] = [];
    let cur: { start: number; end: number } | null = null;
    for (const l of ls) {
      const m = l.text.match(LIST);
      if (m) {
        if (cur) items.push({ addr: `${addr}:${items.length}`, ...cur, text: body.slice(cur.start, cur.end) });
        cur = { start: l.start + m[0].length, end: l.end };
      } else if (cur) cur.end = l.end;
    }
    if (cur) items.push({ addr: `${addr}:${items.length}`, ...cur, text: body.slice(cur.start, cur.end) });
    return { addr, kind: "ul", start: first.start, end: last.end, text: body.slice(first.start, last.end), items };
  }
  return { addr, kind: "p", start: first.start, end: last.end, text: body.slice(first.start, last.end), items: [] };
}

export function parseDoc(body: string): Doc {
  const lines = toLines(body);
  const heads = lines.map((l, i) => (l.text.startsWith("## ") ? i : -1)).filter((i) => i >= 0);
  const doc: Doc = {};
  heads.forEach((h, hi) => {
    const name = lines[h]!.text.slice(3).trim();
    const content = lines.slice(h + 1, heads[hi + 1] ?? lines.length);
    const section: SectionBlocks = { name, blocks: [], findings: [] };
    let current: FindingBlocks | null = null;
    let sN = 0;

    const place = (ls: Line[]) => {
      if (current) {
        const n = current.blocks.filter((b) => b.kind !== "marker").length;
        current.blocks.push(makeBlock(body, ls, `f:${current.ref}:${n}`));
      } else {
        const b = makeBlock(body, ls, `s:${name}:${sN}`);
        if (b.kind !== "marker") sN++;
        section.blocks.push(b);
      }
    };

    for (const group of chunk(content)) {
      let rest = group;
      while (rest.length) {
        const m = rest[0]!.text.match(HEAD3);
        if (m) {
          const line = rest[0]!;
          const title = m[3] ?? "";
          const titleStart = line.end - title.length;
          current = {
            ref: m[1]!, titleAddr: `f:${m[1]}:title`, title: title.trim(),
            titleSpan: { start: titleStart, end: line.end }, blocks: [],
          };
          section.findings.push(current);
          rest = rest.slice(1);
          continue;
        }
        place(rest);
        rest = [];
      }
    }
    doc[name] = section;
  });
  return doc;
}

/** Every address in the file, mapped to the span it occupies and how to write it back. */
export function addressMap(doc: Doc): Map<string, Span & { inline: boolean }> {
  const map = new Map<string, Span & { inline: boolean }>();
  const addBlocks = (blocks: Block[]) => {
    for (const b of blocks) {
      if (b.kind === "p") map.set(b.addr, { start: b.start, end: b.end, inline: false });
      if (b.kind === "ul") for (const it of b.items) map.set(it.addr, { start: it.start, end: it.end, inline: true });
    }
  };
  for (const s of Object.values(doc)) {
    addBlocks(s.blocks);
    for (const f of s.findings) {
      map.set(f.titleAddr, { ...f.titleSpan, inline: true });
      addBlocks(f.blocks);
    }
  }
  return map;
}

/**
 * Replace the text at each address, leaving every other byte of the body as
 * it was. Paragraph edits may contain blank lines (you pressed return, so it
 * becomes two paragraphs); inline edits — titles, list items — are one line.
 */
export function applyBodyEdits(body: string, edits: { addr: string; text: string }[]): string {
  const map = addressMap(parseDoc(body));
  const spans = edits.map((e) => {
    const s = map.get(e.addr);
    if (!s) throw new Error(`Nothing at "${e.addr}" in this file — it may have changed since the page loaded.`);
    const clean = s.inline
      ? e.text.replace(/\s+/g, " ").trim()
      : e.text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!clean) throw new Error(`"${e.addr}" would be left empty. Delete text in the file itself if you mean to remove a whole block.`);
    return { ...s, text: clean };
  }).sort((a, b) => b.start - a.start);
  for (let i = 1; i < spans.length; i++) {
    if (spans[i]!.end > spans[i - 1]!.start) throw new Error("Two edits overlap. Save one, then the other.");
  }
  let out = body;
  for (const s of spans) out = out.slice(0, s.start) + s.text + out.slice(s.end);
  return out;
}
