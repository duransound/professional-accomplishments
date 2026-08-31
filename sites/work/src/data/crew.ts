import { z } from "zod";
import { loadContent, required } from "./load";

/**
 * status is load-bearing: it decides whether a station is drawn solid or
 * dashed, and it feeds the "worked N of M" count. An overclaim here is the
 * kind a single interview question exposes.
 */
const QUOTE_THE_COLOUR =
  'must be a six-digit hex colour WITH QUOTES AROUND IT, like "#C2372A". ' +
  "Without the quotes, YAML treats the # as the start of a comment and " +
  "throws the colour away.";

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
  seats: z.array(seat).min(1, { message: "needs at least one seat" }),
});

const schema = z.object({
  departments: z
    .array(dept)
    .min(1, { message: "needs at least one department" }),
});

const data = loadContent("crew.yaml", schema);

export type SeatStatus = "led" | "held" | "adjacent";
export type Seat = z.infer<typeof seat>;
export type Dept = z.infer<typeof dept>;

export const statusLabel: Record<SeatStatus, string> = {
  led: "Led or owned",
  held: "Held personally",
  adjacent: "Worked alongside",
};

export const depts = data.departments;
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

/** The first seat listed opens by default. */
export const defaultSeat = allSeats[0]!.id;

/** Counted, never typed — the headline number can't drift from the data. */
export const seatCount = {
  total: allSeats.length,
  worked: allSeats.filter((s) => s.status !== "adjacent").length,
  get adjacent() {
    return this.total - this.worked;
  },
};
