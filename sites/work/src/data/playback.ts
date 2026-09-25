import { z } from "zod";
import { loadContent, required } from "./load";

/**
 * The playback-prep demo. Reads content/playback.yaml, checks that it agrees
 * with itself, and works out everything countable — so the card, the queue,
 * the library and the rundown can never disagree about what's ready.
 */
const dur = z
  .string()
  .regex(/^\d{1,2}:[0-5]\d$/, { message: 'must be a length in quotes, like "2:10"' });
const kv = z.object({ k: required("A label"), v: required("A value") });

const schema = z.object({
  page: z.object({
    title: required("A page title"),
    summary: required("A one-line summary for the project card"),
    dek: required("A dek under the title"),
    note: required("The demo note"),
    pipelineIntro: required("The line above the pipeline"),
    queueIntro: required("The line above the queue"),
    libraryIntro: required("The line above the library"),
    qcIntro: required("The line above QC"),
    rundownIntro: required("The line above the rundown"),
    formatsIntro: z.string().default("One master, cut for every screen and feed."),
    deskIntro: z.string().default("This is the desk. Click through it the way the operator would."),
    notes: z.array(required("Each note")).default([]),
  }),
  show: z.object({ name: required("A show name"), venue: required("A venue"), machine: required("The playback machine") }),
  spec: z.array(kv).min(1, { message: "needs at least one line" }),
  stages: z
    .array(z.object({ id: required("A stage id"), name: required("A stage name"), tool: required("A tool"), what: required("What the stage does"), cmd: z.string().optional() }))
    .min(1, { message: "needs at least one stage" }),
  specs: z.array(z.object({ id: required("A spec id"), name: required("A spec name"), v: required("The spec line") })).min(1, { message: "needs at least one spec" }),
  formats: z
    .array(
      z.object({
        id: required("A format id"),
        group: z.enum(["screen", "social"], { errorMap: () => ({ message: "must be exactly one of: screen, social" }) }),
        name: required("A format name"),
        w: z.number().int().positive(),
        h: z.number().int().positive(),
        spec: required("The format's spec"),
        use: required("What it's for"),
      })
    )
    .min(1, { message: "needs at least one format" }),
  segments: z.array(z.object({ id: required("A segment id"), name: required("A segment name") })).min(1),
  assets: z
    .array(
      z.object({
        id: required("An asset id"),
        title: required("A title"),
        kind: z.enum(["video", "audio", "gfx"], { errorMap: () => ({ message: "must be exactly one of: video, audio, gfx" }) }),
        segment: required("A segment id"),
        source: required("Where it came from"),
        file: required("A file name"),
        duration: dur.optional(),
        done: z.number().int().min(0),
        state: z.enum(["ready", "running", "hold", "queued"], { errorMap: () => ({ message: "must be exactly one of: ready, running, hold, queued" }) }),
        note: z.string().optional(),
        in: required("What arrived"),
        out: z.string().optional(),
        checks: z
          .array(kv.extend({ result: z.enum(["pass", "manual", "fail", "na"], { errorMap: () => ({ message: "must be exactly one of: pass, manual, fail, na" }) }) }))
          .default([]),
      })
    )
    .min(1, { message: "needs at least one asset" }),
  cues: z.array(z.object({ id: required("A cue name"), asset: required("An asset id"), does: required("What the operator does") })).min(1),
  package: z.object({
    folder: required("The show folder"),
    tree: z.array(z.object({ name: required("A folder name"), what: required("What's in it") })).min(1),
    contents: z.array(required("Each item")).min(1),
  }),
});

const data = loadContent("playback.yaml", schema) as z.output<typeof schema>;

function problem(lines: string[]): never {
  throw new Error(["", "PROBLEM IN content/playback.yaml", "", ...lines, ""].join("\n"));
}

const N = data.stages.length;
const segIds = new Set(data.segments.map((s) => s.id));
const issues: string[] = [];

const dupe = (ids: string[]) => ids.filter((id, i, all) => all.indexOf(id) !== i);
for (const d of new Set(dupe(data.assets.map((a) => a.id)))) issues.push(`Two assets share the id ${d}. Every asset needs its own.`);
for (const d of new Set(dupe(data.formats.map((f) => f.id)))) issues.push(`Two formats share the id ${d}. Every format needs its own.`);
for (const d of new Set(dupe(data.cues.map((c) => c.id)))) issues.push(`Two cues share the name ${d}. Every cue needs its own.`);

for (const a of data.assets) {
  const at = `Asset ${a.id} (${a.title})`;
  if (!segIds.has(a.segment)) issues.push(`${at}: segment "${a.segment}" isn't in the segments list.`);
  if (a.done > N) issues.push(`${at}: done is ${a.done}, but there are only ${N} stages.`);
  const open = a.checks.filter((c) => c.result === "manual" || c.result === "fail");
  if (a.state === "ready") {
    if (a.done !== N) issues.push(`${at} is marked ready but has only finished ${a.done} of ${N} stages.`);
    if (!a.checks.length) issues.push(`${at} is marked ready but has no checks.`);
    if (open.length) issues.push(`${at} is marked ready but "${open[0]!.k}" is ${open[0]!.result}. Ready means every check passed.`);
  }
  if (a.state === "queued" && a.done !== 0) issues.push(`${at} is queued but has finished ${a.done} stages. Queued means nothing has started.`);
  if (a.state !== "ready" && a.done === N && !open.length) issues.push(`${a.id} has finished every stage with nothing open. Mark it ready.`);
  if (a.checks.length && !a.out) issues.push(`${at} has checks but no "out" line describing the conformed file.`);
  if (a.state === "hold" && !a.note) issues.push(`${at} is on hold with no note. A hold always says why.`);
  if (a.kind !== "gfx" && !a.duration) issues.push(`${at} needs a duration. Only overlays (gfx) can leave it out.`);
}

const assetById = new Map(data.assets.map((a) => [a.id, a]));
for (const c of data.cues) if (!assetById.has(c.asset)) issues.push(`Cue ${c.id} points at asset "${c.asset}", which isn't in the assets list.`);
if (issues.length) problem(issues.map((i) => `  • ${i}`));

export type Asset = (typeof data.assets)[number];
export const playback = data;
export const asset = (id: string) => assetById.get(id)!;
export const segment = (id: string) => data.segments.find((s) => s.id === id)!;
/** Width ÷ height, reduced: 1920×1080 → "16:9". */
export function ratio(w: number, h: number): string {
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
  const d = g(w, h);
  const r = `${w / d}:${h / d}`;
  return r === "8:5" ? "16:10" : r === "16:3" ? "48:9" : r;
}
export const secs = (d?: string) => (d ? Number(d.split(":")[0]) * 60 + Number(d.split(":")[1]) : 0);
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Per stage cell: done, active (working on it now), stopped (held here), or waiting. */
export function stageCells(a: Asset): ("done" | "active" | "stopped" | "wait")[] {
  return data.stages.map((_, i) => {
    if (i < a.done) return "done";
    if (i === a.done && a.state === "running") return "active";
    if (i === a.done && a.state === "hold") return "stopped";
    return "wait";
  });
}

export const stateLabel = (a: Asset) =>
  a.state === "ready" ? "Ready"
  : a.state === "hold" ? "Hold"
  : a.state === "queued" ? "Queued"
  : a.done < N ? data.stages[a.done]!.name
  : "Checking";

const count = (s: Asset["state"]) => data.assets.filter((a) => a.state === s).length;
const cueAssets = data.cues.map((c) => assetById.get(c.asset)!);

export const playbackStats = {
  assets: data.assets.length,
  stages: N,
  ready: count("ready"),
  hold: count("hold"),
  running: count("running"),
  queued: count("queued"),
  cues: data.cues.length,
  cuesReady: cueAssets.filter((a) => a.state === "ready").length,
  /** Running time of everything that plays on its own (overlays excluded). */
  runSeconds: cueAssets.reduce((t, a) => t + secs(a.duration), 0),
};
