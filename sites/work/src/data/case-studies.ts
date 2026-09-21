import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import type { Block } from "./md-blocks";

/**
 * Case studies — the arithmetic and the body structure.
 *
 * The files themselves live in content/case-studies/*.md and are loaded as a
 * content collection (see src/content.config.ts). This module does the three
 * things the collection schema can't:
 *
 *   1. Works out every number, so the writing never types one. A sentence
 *      reaches a figure through {{token}}.
 *   2. Splits the Markdown body into its ## sections and its ### findings, and
 *      checks they match the frontmatter — a finding with no writing, or
 *      writing with no finding, fails the build naming both.
 *   3. Renders each piece with the same Markdown pipeline Astro uses for notes.
 */

export type RoomStatus = "down" | "watch" | "ready";
export interface Room { id: string; use: string; score: number; critical: number; weakest: string; daysSince: number }
export interface Week { readiness: number; down: number; watch: number; ready: number; walked: number }
export interface StudyData {
  kind: string; specimen: boolean; issued: Date; title: string; dek: string;
  summaryLine: string; target: number;
  history: Week[]; trendCaption: string;
  meta: { k: string; v: string }[];
  statuses: { key: RoomStatus; name: string; rule: string }[];
  instrumentNote: string;
  rooms: Room[];
  findings: { ref: string; severity: "critical" | "high" | "medium"; rooms: string[] | "all"; problem: string; fix: string; effort?: string }[];
  headings?: Partial<Record<"summary" | "trend" | "walkthrough" | "method" | "scorecard" | "findings" | "plan" | "limits", string>>;
  chartTitle: string; chartCaption: string;
  chart: { name: string; count: number }[];
  plan: { when: string; title: string; capital: boolean; items: { do: string; days?: number; effort?: string }[] }[];
}

/** Score alone never clears Down — a dead one-touch join means no all-hands. */
export function statusOf(r: Room, target: number): RoomStatus {
  if (r.critical > 0 || r.score < 70) return "down";
  if (r.score < target) return "watch";
  return "ready";
}
export const statusLabel: Record<RoomStatus, string> = { down: "Down", watch: "Watch", ready: "Ready" };
/** Status never stands alone as colour — every chip carries a mark and a word. */
export const statusMark: Record<RoomStatus, string> = { down: "■", watch: "▲", ready: "●" };

const round1 = (n: number) => Math.round(n * 10) / 10;

export function derive(s: StudyData) {
  const scores = s.rooms.map((r) => r.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  const st = s.rooms.map((r) => statusOf(r, s.target));
  const count = (k: RoomStatus) => st.filter((x) => x === k).length;
  const chartTotal = s.chart.reduce((a, c) => a + c.count, 0);
  const ranked = [...s.chart].sort((a, b) => b.count - a.count);
  const topTwo = (ranked[0]?.count ?? 0) + (ranked[1]?.count ?? 0);
  return {
    total: s.rooms.length,
    findings: s.findings.length,
    score: Math.round(mean),
    mean: round1(mean),
    median: round1(median),
    down: count("down"),
    watch: count("watch"),
    ready: count("ready"),
    critical: s.rooms.reduce((a, r) => a + r.critical, 0),
    walked: s.rooms.filter((r) => r.daysSince <= 7).length,
    unwalked: s.rooms.filter((r) => r.daysSince > 7).length,
    coverage: Math.round((s.rooms.filter((r) => r.daysSince <= 7).length / s.rooms.length) * 100),
    overdue: s.rooms.filter((r) => r.daysSince > 10).length,
    weeks: s.history.length + 1,
    startScore: s.history[0]?.readiness ?? Math.round(mean),
    startDown: s.history[0]?.down ?? count("down"),
    scoreChange: Math.round(mean) - (s.history[0]?.readiness ?? Math.round(mean)),
    chartTotal,
    chartMax: ranked[0]?.count ?? 0,
    topTwoPct: chartTotal ? Math.round((topTwo / chartTotal) * 100) : 0,
    urgentDays: round1(s.plan.flatMap((p) => p.items).reduce((a, i) => a + (i.days ?? 0), 0)),
    target: s.target,
  };
}
export type Derived = ReturnType<typeof derive>;

function problem(file: string, lines: string[]): never {
  throw new Error(["", `PROBLEM IN content/case-studies/${file}.md`, "", ...lines, "",
    "Fix that file and save — this page will reload by itself.", ""].join("\n"));
}

/** An unknown token fails the build rather than printing {{typo}} to a client. */
export function fill(text: string, d: Derived, file: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
    const v = (d as Record<string, unknown>)[key];
    if (v === undefined) {
      problem(file, [
        `The writing uses {{${key}}}, which is not a figure this page works out.`,
        "", `The ones available are: ${Object.keys(d).join(", ")}`,
      ]);
    }
    return String(v);
  });
}

export const SECTIONS = ["Summary", "Method", "Scorecard", "Findings", "Pattern", "Plan", "Limits"] as const;
/** Sections a case study may include but doesn't have to. */
export const OPTIONAL_SECTIONS = ["Walkthrough"] as const;
type SectionName = (typeof SECTIONS)[number] | (typeof OPTIONAL_SECTIONS)[number];

export interface ParsedBody {
  sections: Record<SectionName, string>;
  methodBefore: string;
  methodAfter: string;
  findings: { ref: string; title: string; md: string }[];
}

/**
 * The body is split on its "## " headings. Every section in SECTIONS must be
 * there exactly once, and nothing else may be — a misspelt heading would
 * otherwise vanish from the page without a word.
 */
export function parseBody(body: string, data: StudyData, file: string): ParsedBody {
  const found: Partial<Record<SectionName, string>> = {};
  const unknown: string[] = [];
  const chunks = ("\n" + body).split(/\n## /).slice(1);
  if (!chunks.length) {
    problem(file, ["There is no writing below the frontmatter — no ## headings at all.",
      "", `It needs these, each on its own line: ${SECTIONS.map((s) => "## " + s).join(", ")}`]);
  }
  for (const chunk of chunks) {
    const nl = chunk.indexOf("\n");
    const name = (nl === -1 ? chunk : chunk.slice(0, nl)).trim();
    const text = nl === -1 ? "" : chunk.slice(nl + 1).trim();
    if ((SECTIONS as readonly string[]).includes(name) || (OPTIONAL_SECTIONS as readonly string[]).includes(name)) {
      if (found[name as SectionName] !== undefined) problem(file, [`The heading "## ${name}" appears twice.`]);
      found[name as SectionName] = text;
    } else unknown.push(name);
  }
  const missing = SECTIONS.filter((s) => found[s] === undefined);
  if (unknown.length || missing.length) {
    problem(file, [
      ...(unknown.length ? [`These ## headings aren't sections this page knows: ${unknown.map((u) => `"${u}"`).join(", ")}`] : []),
      ...(missing.length ? [`These sections are missing: ${missing.map((m) => `"## ${m}"`).join(", ")}`] : []),
      "", `The sections are: ${SECTIONS.join(", ")}, plus optionally ${OPTIONAL_SECTIONS.join(", ")}. Check the spelling of the heading.`,
    ]);
  }
  const sections = found as Record<SectionName, string>;

  // Findings: "### F-01 · Title", matched to the frontmatter by ref.
  const findings: ParsedBody["findings"] = [];
  const intro = sections.Findings.split(/\n?### /);
  for (const block of intro.slice(1)) {
    const nl = block.indexOf("\n");
    const head = (nl === -1 ? block : block.slice(0, nl)).trim();
    const m = head.match(/^(\S+)\s*(?:[·—–:|-]\s*)?(.*)$/);
    findings.push({ ref: m?.[1] ?? head, title: (m?.[2] ?? "").trim(), md: nl === -1 ? "" : block.slice(nl + 1).trim() });
  }
  const bodyRefs = findings.map((f) => f.ref);
  const dataRefs = data.findings.map((f) => f.ref);
  const noWriting = dataRefs.filter((r) => !bodyRefs.includes(r));
  const noData = bodyRefs.filter((r) => !dataRefs.includes(r));
  const untitled = findings.filter((f) => !f.title).map((f) => f.ref);
  if (noWriting.length || noData.length || untitled.length) {
    problem(file, [
      ...(noWriting.length ? [`Listed in the frontmatter but with no ### section below: ${noWriting.join(", ")}`] : []),
      ...(noData.length ? [`Written below but missing from the frontmatter findings list: ${noData.join(", ")}`] : []),
      ...(untitled.length ? [`These have no title after the ref: ${untitled.join(", ")}`] : []),
      "", "Each finding needs both: a line in the frontmatter findings list with its ref,",
      "severity and rooms, and a heading below like  ### F-01 · What the finding is",
    ]);
  }

  const [methodBefore, ...rest] = sections.Method.split("<!-- status-table -->");
  return { sections, findings, methodBefore: methodBefore!.trim(), methodAfter: rest.join("").trim() };
}

let processor: Awaited<ReturnType<typeof createMarkdownProcessor>> | undefined;
/** The same pipeline Astro uses for notes, so Markdown behaves identically. */
export async function renderMd(md: string): Promise<string> {
  if (!md.trim()) return "";
  processor ??= await createMarkdownProcessor({ syntaxHighlight: false });
  return (await processor.render(md)).code;
}

/* ---------------------------------------------------------------------------
   View rendering. In the dev server every number that comes from a token is
   drawn as a locked chip, so edit mode can rewrite a sentence around "87"
   without flattening {{score}} into a typed number. The published site gets
   plain text.
   ------------------------------------------------------------------------ */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function chip(key: string, value: string): string {
  return `<span class="tok" data-tok="${key}" contenteditable="false" ` +
    `title="Worked out from the data. Rewrite around it; it can't be typed over.">${value}</span>`;
}

export function viewFill(text: string, d: Derived, file: string, edit: boolean): string {
  const plain = fill(text, d, file); // validates every token either way
  if (!edit) return plain;
  return text.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => chip(k, String((d as Record<string, unknown>)[k])));
}

/** For short frontmatter strings: escaped text, tokens filled or chipped. */
export function inlineHtml(text: string, d: Derived, file: string, edit: boolean): string {
  fill(text, d, file);
  return text.split(/(\{\{\w+\}\})/g).map((part) => {
    const m = part.match(/^\{\{(\w+)\}\}$/);
    if (!m) return esc(part);
    const v = String((d as Record<string, unknown>)[m[1]!]);
    return edit ? chip(m[1]!, v) : esc(v);
  }).join("");
}

export interface ViewBlock { addr: string; kind: "p" | "ul"; html: string; items: { addr: string; html: string }[] }
const stripP = (h: string) => h.trim().replace(/^<p>([\s\S]*)<\/p>$/, "$1");

export async function viewBlocks(blocks: Block[], d: Derived, file: string, edit: boolean): Promise<ViewBlock[]> {
  const out: ViewBlock[] = [];
  for (const b of blocks) {
    if (b.kind === "p") {
      out.push({ addr: b.addr, kind: "p", html: await renderMd(viewFill(b.text, d, file, edit)), items: [] });
    } else if (b.kind === "ul") {
      const items = [];
      for (const i of b.items) items.push({ addr: i.addr, html: stripP(await renderMd(viewFill(i.text, d, file, edit))) });
      out.push({ addr: b.addr, kind: "ul", html: "", items });
    }
  }
  return out;
}

/* ---------------------------------------------------------------------------
   Dashboard pieces.
   ------------------------------------------------------------------------ */

/** Weeks 1..n-1 from history, plus this week worked out from the rooms. */
export function trend(s: StudyData, d: Derived): (Week & { week: number; current: boolean })[] {
  return [
    ...s.history.map((w, i) => ({ ...w, week: i + 1, current: false })),
    { readiness: d.score, down: d.down, watch: d.watch, ready: d.ready, walked: d.walked, week: s.history.length + 1, current: true },
  ];
}

export function roomsFor(f: StudyData["findings"][number], s: StudyData): string[] {
  return f.rooms === "all" ? s.rooms.map((r) => r.id) : f.rooms;
}

/**
 * The checks a schema can't do: every week of history has to account for
 * every room, and every issue has to point at rooms that exist. Both fail the
 * build naming the week or the issue.
 */
export function checkDashboard(s: StudyData, file: string): void {
  const total = s.rooms.length;
  const badWeeks = s.history
    .map((w, i) => ({ i, sum: w.down + w.watch + w.ready, walked: w.walked }))
    .filter((w) => w.sum !== total || w.walked > total);
  const ids = new Set(s.rooms.map((r) => r.id));
  const badRooms = s.findings.flatMap((f) =>
    f.rooms === "all" ? [] : f.rooms.filter((r) => !ids.has(r)).map((r) => `${f.ref} lists ${r}`)
  );
  if (!badWeeks.length && !badRooms.length) return;
  problem(file, [
    ...badWeeks.map((w) =>
      w.sum !== total
        ? `Week ${w.i + 1} in history: down + watch + ready adds up to ${w.sum}, but there are ${total} rooms.`
        : `Week ${w.i + 1} in history: walked is ${w.walked}, more than the ${total} rooms there are.`
    ),
    ...badRooms.map((r) => `${r}, which isn't in the rooms list.`),
    ...(badRooms.length ? ["", `The room ids are: ${[...ids].join(", ")}`] : []),
  ]);
}

/**
 * One walkthrough, scored exactly the way the real board scores it: pass 1,
 * flag half, fail 0, each weighted by its area; N/A and unanswered are left
 * out. A failed show-critical check, or a score under 70, is Down whatever
 * the average. The demo's script uses the same rules on the same data.
 */
export type WalkState = "pass" | "flag" | "fail" | "na";
export function scoreWalk(checks: { weight: number; critical?: boolean; state?: WalkState }[], target: number) {
  let num = 0, den = 0, answered = 0, critFails = 0, fails = 0, flags = 0;
  for (const c of checks) {
    if (!c.state) continue;
    answered++;
    if (c.state === "na") continue;
    num += c.weight * (c.state === "pass" ? 1 : c.state === "flag" ? 0.5 : 0);
    den += c.weight;
    if (c.state === "fail") { fails++; if (c.critical) critFails++; }
    if (c.state === "flag") flags++;
  }
  const score = den ? Math.round((100 * num) / den) : null;
  const status: RoomStatus | null =
    score === null ? null : critFails || score < 70 ? "down" : fails || score < target ? "watch" : "ready";
  return { score, status, answered, total: checks.length, critFails, fails, flags };
}
