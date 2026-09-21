import { Document, parseDocument } from "yaml";
import { applyBodyEdits } from "../data/md-blocks";

/**
 * Apply a batch of edits from the page to a case-study file.
 *
 * Body edits go through applyBodyEdits (span replacement). Frontmatter edits
 * go through the yaml Document API, which keeps comments and layout, and are
 * limited to the text fields listed below — the edit mode can change wording,
 * never numbers, structure, or anything the arithmetic depends on.
 */
const FM_ALLOWED = new RegExp(
  "^(" + [
    "title", "dek", "summaryLine", "chartTitle", "chartCaption", "trendCaption", "instrumentNote",
    "headings\\.(summary|trend|walkthrough|method|scorecard|findings|plan|limits)",
    "walkthrough\\.checks\\.\\d+\\.label",
    "findings\\.\\d+\\.(problem|fix)",
    "statuses\\.\\d+\\.rule",
    "plan\\.\\d+\\.(title|when)",
    "plan\\.\\d+\\.items\\.\\d+\\.do",
    "meta\\.\\d+\\.v",
    "rooms\\.\\d+\\.(use|weakest)",
  ].join("|") + ")$"
);

export interface Edit { addr: string; text: string }

export function applyEdits(raw: string, edits: Edit[]): string {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new Error("This file has no frontmatter block at the top.");
  const body = raw.slice(m[0].length);

  const fmEdits = edits.filter((e) => e.addr.startsWith("fm:"));
  const bodyEdits = edits.filter((e) => !e.addr.startsWith("fm:"));

  let head = m[0];
  if (fmEdits.length) {
    const doc = parseDocument(m[1]!);
    for (const e of fmEdits) {
      const path = e.addr.slice(3);
      if (!FM_ALLOWED.test(path)) throw new Error(`"${path}" isn't a field the page can edit.`);
      const text = e.text.replace(/\s+/g, " ").trim();
      if (!text) throw new Error(`"${path}" would be left empty.`);
      doc.setIn(path.split(".").map((p) => (/^\d+$/.test(p) ? Number(p) : p)), text);
    }
    if (doc.errors.length) throw new Error(doc.errors[0]!.message);
    // lineWidth 0 and no flow padding reproduce the file's own layout, so an
    // edit to one field leaves every other line of the header as it was.
    const text = doc.toString({ lineWidth: 0, flowCollectionPadding: false });
    head = `---\n${text.trimEnd()}\n---\n`;
  }
  return head + (bodyEdits.length ? applyBodyEdits(body, bodyEdits) : body);
}

/**
 * Apply edits to one of the site's YAML files (site, lenses, experience, kit,
 * crew). Addresses look like `y:lenses.0.summary`.
 *
 * The page can only replace text that is already text. A field that holds a
 * number, a date, a list or a block can't be touched, and neither can the
 * keys the build or the drawing depends on (ids, statuses, colours, links).
 * The field keeps its style — a folded `>` paragraph stays folded.
 */
const LOCKED_KEYS = new Set([
  "id", "default", "status", "color", "href", "email", "linkedin", "zone", "kind",
  "visibility", "lensKey", "updated", "plan", "lift", "current", "draft", "date",
]);

type Node = { value?: unknown; type?: string; range?: [number, number, number] };

/** One scalar, written the way it would appear after "key: " — quoted only if it must be. */
function flowScalar(text: string): string {
  return new Document(text).toString({ lineWidth: 0 }).trimEnd();
}

/** Re-wrap a folded (>) paragraph at the width the file already uses. */
function foldedBlock(header: string, text: string, indent: string): string {
  const width = Math.max(40, 78 - indent.length);
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && line.length + 1 + word.length > width) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return `${header}\n${lines.map((l) => indent + l).join("\n")}`;
}

export function applyYamlEdits(raw: string, edits: Edit[]): string {
  const doc = parseDocument(raw, { keepSourceTokens: false });
  if (doc.errors.length) throw new Error(doc.errors[0]!.message);
  const splices: { start: number; end: number; text: string }[] = [];
  const wanted: [(string | number)[], string][] = [];

  for (const e of edits) {
    if (!e.addr.startsWith("y:")) throw new Error(`"${e.addr}" isn't an address in this file.`);
    const name = e.addr.slice(2);
    const path = name.split(".").map((p) => (/^\d+$/.test(p) ? Number(p) : p));
    const key = [...path].reverse().find((p) => typeof p === "string") as string | undefined;
    if (key && LOCKED_KEYS.has(key)) throw new Error(`"${key}" isn't a field the page can edit.`);
    const node = doc.getIn(path, true) as Node | undefined;
    if (!node || typeof node.value !== "string" || !node.range) throw new Error(`"${name}" isn't a line of text in this file.`);
    const text = e.text.replace(/\s+/g, " ").trim();
    if (!text) throw new Error(`"${name}" would be left empty.`);
    if (text === node.value.replace(/\s+/g, " ").trim()) continue;

    // Replace only this value's own characters, so every other line of the
    // file — comments, wrapping, blank lines — stays exactly as it was.
    const [start, end] = node.range;
    const src = raw.slice(start, end);
    let out: string;
    if (node.type === "BLOCK_FOLDED" || node.type === "BLOCK_LITERAL") {
      const header = src.split("\n")[0]!.trim().replace(/^\|/, ">");
      const indent = (src.split("\n").find((l, i) => i > 0 && l.trim()) ?? "  ").match(/^\s*/)![0];
      out = foldedBlock(header, text, indent);
      const tail = src.match(/\n*$/)![0];
      out += tail || "";
    } else {
      out = flowScalar(text);
    }
    splices.push({ start, end, text: out });
    wanted.push([path, text]);
  }

  let next = raw;
  for (const s of splices.sort((a, b) => b.start - a.start)) next = next.slice(0, s.start) + s.text + next.slice(s.end);

  // Check the result reads back to exactly what was typed.
  const check = parseDocument(next);
  if (check.errors.length) throw new Error(`The edit would break the file: ${check.errors[0]!.message}`);
  for (const [path, text] of wanted) {
    const v = check.getIn(path);
    if (typeof v !== "string" || v.replace(/\s+/g, " ").trim() !== text) {
      throw new Error(`"${path.join(".")}" didn't save cleanly. Nothing was changed.`);
    }
  }
  return next;
}
