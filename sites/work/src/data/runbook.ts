import { z } from "zod";
import { loadContent, required } from "./load";
import { allSeats, depts, type Seat } from "./crew";

/**
 * The show-day runbook demo. Reads content/runbook.yaml, checks it, and works
 * out everything countable — so the card, the figures and the timeline can
 * never disagree with the cue sheet.
 */
const clock = z
  .string({ required_error: "is required — a time like \"13:05\"" })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'must be a 24-hour time in quotes, like "13:05"' });
const seatId = required("A seat id");

const schema = z.object({
  page: z.object({
    title: required("A page title"),
    summary: required("A one-line summary for the project card"),
    dek: required("A dek under the title"),
    note: required("The demo note"),
    dayIntro: required("The line above the day timeline"),
    callIntro: required("The line above the caller"),
    sheetIntro: required("The line above the cue sheet"),
    breakIntro: required("The line above the failure plays"),
    beforeDoors: required("The before-doors label"),
    afterDoors: required("The after-doors label"),
    notes: z.array(required("Each note")).default([]),
  }),
  event: z.object({
    name: required("An event name"),
    room: required("A room"),
    inRoom: z.number({ invalid_type_error: "must be a number" }),
    online: z.number({ invalid_type_error: "must be a number" }),
  }),
  authority: z.object({ before: seatId, after: seatId }),
  doors: clock,
  phases: z
    .array(z.object({ name: required("A phase name"), start: clock, end: clock, owner: seatId, what: required("What happens") }))
    .min(1, { message: "needs at least one phase" }),
  cues: z
    .array(
      z.object({
        id: required("A cue name"),
        at: clock,
        segment: required("A segment"),
        standby: required("A standby line"),
        go: required("A go line"),
        seats: z.array(seatId).min(1, { message: "needs at least one seat" }),
      })
    )
    .min(1, { message: "needs at least one cue" }),
  plays: z
    .array(z.object({ when: required("What goes wrong"), then: required("What happens next"), owner: seatId }))
    .default([]),
});

const data = loadContent("runbook.yaml", schema) as z.output<typeof schema>;

function problem(lines: string[]): never {
  throw new Error(["", "PROBLEM IN content/runbook.yaml", "", ...lines, ""].join("\n"));
}

/* Every seat named here has to exist on the crew map. */
const seatById = new Map<string, Seat>(allSeats.map((s) => [s.id, s]));
const named: [string, string][] = [
  ["authority › before", data.authority.before],
  ["authority › after", data.authority.after],
  ...data.phases.map((p) => [`phase "${p.name}" › owner`, p.owner] as [string, string]),
  ...data.cues.flatMap((c) => c.seats.map((s) => [`cue ${c.id} › seats`, s] as [string, string])),
  ...data.plays.map((p) => [`play "${p.when}" › owner`, p.owner] as [string, string]),
];
const unknown = named.filter(([, id]) => !seatById.has(id));
if (unknown.length) {
  problem([
    ...unknown.map(([where, id]) => `  • ${where}: "${id}" isn't a seat on the crew map.`),
    "",
    `Seats that exist (from crew.yaml): ${[...seatById.keys()].join(", ")}`,
  ]);
}
const dupes = data.cues.map((c) => c.id).filter((id, i, all) => all.indexOf(id) !== i);
if (dupes.length) problem([`Two cues share the name ${[...new Set(dupes)].join(", ")}. Every cue needs its own.`]);

export const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
for (const p of data.phases) {
  if (mins(p.end) <= mins(p.start)) problem([`Phase "${p.name}" ends (${p.end}) before it starts (${p.start}).`]);
}
for (let i = 1; i < data.cues.length; i++) {
  if (mins(data.cues[i]!.at) < mins(data.cues[i - 1]!.at)) {
    problem([`Cue ${data.cues[i]!.id} (${data.cues[i]!.at}) comes before ${data.cues[i - 1]!.id} (${data.cues[i - 1]!.at}). List cues in running order.`]);
  }
}

export const runbook = data;
export const seat = (id: string) => seatById.get(id)!;

/** Seat → its department colour, for the small colour bar on each chip. */
export const seatColor = new Map<string, string>(depts.flatMap((d) => d.seats.map((s) => [s.id, d.color] as [string, string])));

/** Seats that work at least one cue, in crew-map order. */
const used = new Set(data.cues.flatMap((c) => c.seats));
export const cueSeats = allSeats.filter((s) => used.has(s.id));

const dayStart = Math.min(...data.phases.map((p) => mins(p.start)));
const dayEnd = Math.max(...data.phases.map((p) => mins(p.end)));
const first = mins(data.cues[0]!.at);
const last = mins(data.cues[data.cues.length - 1]!.at);

export const runbookStats = {
  cues: data.cues.length,
  seats: cueSeats.length,
  doors: data.doors,
  dayStart,
  dayEnd,
  /** Minutes from the first cue to the last. */
  showMinutes: last - first,
  cuesBySeat: new Map(cueSeats.map((s) => [s.id, data.cues.filter((c) => c.seats.includes(s.id)).length])),
};

/** Position on the day, as a percentage of load-in → end of strike. */
export const pct = (t: string) => ((mins(t) - dayStart) / (dayEnd - dayStart)) * 100;
export const hourMarks = (() => {
  const out: string[] = [];
  for (let m = Math.ceil(dayStart / 60) * 60; m <= dayEnd; m += 60) out.push(`${String(m / 60).padStart(2, "0")}:00`);
  return out;
})();
