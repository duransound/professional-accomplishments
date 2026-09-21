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
});

const schema = z.object({
  page,
  zones: z.array(zone).min(1, { message: "needs at least one zone" }),
  departments: z
    .array(dept)
    .min(1, { message: "needs at least one department" }),
});

const data = loadContent("crew.yaml", schema);

export const crewPage = data.page;

export type SeatStatus = "led" | "held" | "adjacent";
export type Visibility = "immediate" | "delayed" | "invisible";
export type Seat = z.infer<typeof seat>;
export type Dept = z.infer<typeof dept>;
export type Zone = z.infer<typeof zone>;

export const statusLabel: Record<SeatStatus, string> = {
  led: "Led or owned",
  held: "Held personally",
  adjacent: "Worked alongside",
};

/** Ordered worst-first: this is the order the "what goes dark" list uses. */
export const visibilityLabel: Record<Visibility, string> = {
  invisible: "Invisible — noticed in months",
  delayed: "Delayed — noticed in the recording",
  immediate: "Immediate — the room notices",
};
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
