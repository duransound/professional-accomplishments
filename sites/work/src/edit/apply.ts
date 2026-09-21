import { parseDocument } from "yaml";
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
    "headings\\.(summary|trend|method|scorecard|findings|plan|limits)",
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
