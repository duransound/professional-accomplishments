import { z } from "zod";
import { loadContent, required } from "./load";

/**
 * status is load-bearing: it decides whether a station is drawn solid or
 * dashed, and it feeds the "worked N of M" count. An overclaim here is the
 * kind a single interview question exposes.
 *
 * zone and visibility are load-bearing in the same way. zone decides where a
 * seat is drawn on the plate; visibility decides what colour it takes and how
 * the "what goes dark" list orders itself. Both are arguments, not decoration.
 */
const QUOTE_THE_COLOUR =
  'must be a six-digit hex colour WITH QUOTES AROUND IT, like "#C2372A". ' +
  "Without the quotes, YAML treats the # as the start of a comment and " +
  "throws the colour away.";

const VISIBILITY =
  "must be exactly one of: immediate, delayed, invisible — how long it takes " +
  "anyone to notice this seat is empty. immediate means the room notices, " +
  "delayed means it turns up in the recording, invisible means months.";

const seat = z.object({
  id: required("A seat id"),
  title: required("A seat title"),
  short: required("A short label for the diagram").max(24, {
    message:
      "is too long for the diagram — keep it under about 20 characters or labels collide",
  }),
  status: z.enum(["led", "held", "adjacent"], {
    errorMap: () => ({
      message: 'must be exactly one of: led, held, adjacent',
    }),
  }),
  what: required("A one-line description"),
  room: required('An "in the room" description'),
  // Shown in place of `short` when the vocabulary switch is thrown, so it is
  // held to the same length limit — a long title collides at 40 degrees.
  "reads-title": required("A technology-org job title").max(24, {
    message:
      "is too long for the diagram — keep it under about 20 characters or labels collide",
  }),
  // --- the zone plate ---------------------------------------------------
  zone: required("A zone id").describe("must match an id in the zones block"),
  visibility: z.enum(["immediate", "delayed", "invisible"], {
    errorMap: () => ({ message: VISIBILITY }),
  }),
  consequence: required("A sentence saying what goes wrong when this seat is empty"),
  // Only for seats whose placement is genuinely arguable. Rendered as a note
  // on the seat panel — an honest one beats a confident wrong one.
  contested: z.string().min(1).optional(),
});

const dept = z.object({
  name: required("A department name"),
  short: required("A short name for the route line"),
  // Unquoted, YAML reads "#C2372A" as a comment and the value arrives as
  // null — so the type error has to explain the quoting, not just the type.
  color: z
    .string({
      required_error: QUOTE_THE_COLOUR,
      invalid_type_error: QUOTE_THE_COLOUR,
    })
    .regex(/^#[0-9a-fA-F]{6}$/, { message: QUOTE_THE_COLOUR }),
  seats: z.array(seat).min(1, { message: "needs at least one department seat" }),
});

/**
 * plan is [x, y, width, depth] in floor-grid units. The isometric projection
 * is computed from it, and seats are packed into the rectangle in the order
 * they appear under departments — so nothing on this plate is positioned by
 * hand, and adding a seat moves the drawing correctly.
 */
const zone = z.object({
  id: required("A zone id"),
  name: required("A zone name"),
  kind: z.enum(["physical", "detached", "program"], {
    errorMap: () => ({
      message:
        "must be exactly one of: physical, detached, program — detached is the " +
        "floating Remote plate, program means the seat has no show-time position at all",
    }),
  }),
  plan: z
    .tuple([z.number(), z.number(), z.number(), z.number()], {
      invalid_type_error:
        "must be four numbers in square brackets — [x, y, width, depth] in floor-grid units, like [0, 15.5, 8, 6]",
    }),
  lift: z.number({
    invalid_type_error: "must be a number — riser height in floor-grid units, 0 for floor level",
  }),
  perceives: required("A line saying what can be sensed from this zone"),
  reads: required("A workplace-org analogue for this zone"),
});

const page = z.object({
  title: required("A page title"),
  summary: required("A one-line summary for the project card"),
  dek: required("A dek under the page title"),
  note: required("The demo note"),
  intro: required("The paragraph above the drawing"),
  tally: z.string().default(
    "Of the {{total}} seats below, I have personally worked {{worked}}. The remaining {{alongside}} I have scoped, budgeted, and staffed without ever sitting in the chair."),
  thesis: z.string().default(
    "If this crew were short one person, the empty seat nobody notices is the dangerous one. {{invisible}} of the {{total}} fail where no one in the room can see it — and those are the seats that get cut first."),
  labels: z.object({
    groupSeats: z.string().default("Group seats"),
    byRoom: z.string().default("By room"),
    byDepartment: z.string().default("By department"),
    solidHollow: z.string().default("Solid = held · Hollow = worked alongside"),
    contestedKey: z.string().default("Placement contested"),
    seatHeld: z.string().default("Seat held"),
    workedAlongside: z.string().default("Worked alongside"),
    zoneKey: z.string().default("Every zone and who sits there"),
    inTheRoom: z.string().default("In the room"),
    where: z.string().default("Where"),
    ifEmpty: z.string().default("If it's empty"),
    contested: z.string().default("Contested"),
    noShowDaySeat: z.string().default("no seat on show day"),
    noSeat: z.string().default("No seat assigned"),
  }).default({}),
  status: z.object({
    led: z.string().default("Led or owned"),
    held: z.string().default("Held personally"),
    adjacent: z.string().default("Worked alongside"),
  }).default({}),
  visibility: z.object({
    immediate: z.string().default("Immediate — the room notices"),
    delayed: z.string().default("Delayed — noticed in the recording"),
    invisible: z.string().default("Invisible — noticed in months"),
  }).default({}),
});

const schema = z.object({
  page,
  zones: z.array(zone).min(1, { message: "needs at least one zone" }),
  departments: z
    .array(dept)
    .min(1, { message: "needs at least one department" }),
});

const data = loadContent("crew.yaml", schema) as z.output<typeof schema>;

export const crewPage = data.page;

export type SeatStatus = "led" | "held" | "adjacent";
export type Visibility = "immediate" | "delayed" | "invisible";
export type Seat = z.infer<typeof seat>;
export type Dept = z.infer<typeof dept>;
export type Zone = z.infer<typeof zone>;

/** Words live in crew.yaml › page, so they can be edited on the page. */
export const statusLabel: Record<SeatStatus, string> = data.page.status;
export const visibilityLabel: Record<Visibility, string> = data.page.visibility;
export const crewLabels = data.page.labels;
export const visibilityRank: Record<Visibility, number> = {
  invisible: 0,
  delayed: 1,
  immediate: 2,
};

export const depts = data.departments;
export const zones = data.zones;
export const allSeats: Seat[] = depts.flatMap((d) => d.seats);

const duplicates = allSeats
  .map((s) => s.id)
  .filter((id, i, all) => all.indexOf(id) !== i);
if (duplicates.length) {
  throw new Error(
    `\nPROBLEM IN content/crew.yaml\n\nTwo seats share the same id: ${[
      ...new Set(duplicates),
    ].join(", ")}\nEvery seat needs its own id, because that is how a station\nis matched to its description.\n`
  );
}

const dupeZones = zones
  .map((z) => z.id)
  .filter((id, i, all) => all.indexOf(id) !== i);
if (dupeZones.length) {
  throw new Error(
    `\nPROBLEM IN content/crew.yaml\n\nTwo zones share the same id: ${[
      ...new Set(dupeZones),
    ].join(", ")}\nEvery zone needs its own id, because that is how a seat\nfinds the plate it sits on.\n`
  );
}

/**
 * A seat pointing at a zone that isn't declared would silently vanish from the
 * drawing, so it fails the build instead — naming the seat, the bad value, and
 * the list of ids that would have worked.
 */
const zoneIds = new Set(zones.map((z) => z.id));
const orphans = allSeats.filter((s) => !zoneIds.has(s.zone));
if (orphans.length) {
  throw new Error(
    `\nPROBLEM IN content/crew.yaml\n\n` +
      orphans
        .map((s) => `  • "${s.title}" has zone: ${s.zone}, which is not a zone in this file.`)
        .join("\n") +
      `\n\nThe zones declared at the top of the file are:\n  ${[...zoneIds].join(
        ", "
      )}\n\nEither fix the spelling on the seat, or add that zone to the zones block.\n`
  );
}

export const zoneById = new Map(zones.map((z) => [z.id, z]));

/** Seats packed into their zone in the order they appear under departments. */
export const seatsByZone = new Map<string, Seat[]>(
  zones.map((z) => [z.id, allSeats.filter((s) => s.zone === z.id)])
);

export const showZones = zones.filter((z) => z.kind !== "program");
export const programSeats = allSeats.filter(
  (s) => zoneById.get(s.zone)?.kind === "program"
);
export const showSeats = allSeats.filter(
  (s) => zoneById.get(s.zone)?.kind !== "program"
);

/**
 * A zone nobody sits in. Rendered as NO SEAT ASSIGNED, so the hole in the
 * roster stays true when seats move rather than being typed once and forgotten.
 */
export const emptyZones = showZones.filter(
  (z) => (seatsByZone.get(z.id) ?? []).length === 0
);

/** The first seat listed opens by default. */
export const defaultSeat = allSeats[0]!.id;

/** Counted, never typed — the headline number can't drift from the data. */
export const seatCount = {
  total: allSeats.length,
  worked: allSeats.filter((s) => s.status !== "adjacent").length,
  get adjacent() {
    return this.total - this.worked;
  },
  show: showSeats.length,
  program: programSeats.length,
};

/** Also counted: the thesis of the plate is this distribution. */
export const visibilityCount = {
  immediate: allSeats.filter((s) => s.visibility === "immediate").length,
  delayed: allSeats.filter((s) => s.visibility === "delayed").length,
  invisible: allSeats.filter((s) => s.visibility === "invisible").length,
};

/* ---------------------------------------------------------------------------
   Counted words for the page sentences. {{total}} in crew.yaml becomes
   "seventeen" — worked out from the seats, never typed. In the dev server
   each one is a locked chip so edit mode can rewrite around it.
   ------------------------------------------------------------------------ */
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
export const spell = (n: number) => WORDS[n] ?? String(n);

export const crewTokens: Record<string, string> = {
  total: spell(seatCount.total),
  worked: spell(seatCount.worked),
  alongside: spell(seatCount.adjacent),
  invisible: spell(visibilityCount.invisible),
  delayed: spell(visibilityCount.delayed),
  immediate: spell(visibilityCount.immediate),
};

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function crewText(text: string, edit: boolean): string {
  return text.split(/(\{\{\w+\}\})/g).map((part) => {
    const m = part.match(/^\{\{(\w+)\}\}$/);
    if (!m) return escHtml(part);
    const v = crewTokens[m[1]!];
    if (v === undefined) {
      throw new Error(
        `\nPROBLEM IN content/crew.yaml\n\n{{${m[1]}}} isn't a count the page knows.\n` +
        `The ones that work are: ${Object.keys(crewTokens).map((k) => `{{${k}}}`).join(", ")}\n`
      );
    }
    const inner = edit
      ? `<span class="tok" data-tok="${m[1]}" contenteditable="false" title="Counted from the seats. Rewrite around it; it can't be typed over.">${v}</span>`
      : v;
    return `<strong>${inner}</strong>`;
  }).join("");
}
