/**
 * The crew map. Production titles don't travel outside the industry, so each
 * seat carries its translation into a technology organization.
 *
 * `status` is load-bearing and must stay accurate — an overclaim here is the
 * kind a single interview question exposes. Confirmed with Ian 2026-08-31.
 */
export type SeatStatus = "led" | "held" | "adjacent";

export interface Seat {
  id: string;
  title: string;
  status: SeatStatus;
  /** One line: what this seat owns. */
  what: string;
  /** What the work actually looks like during a show. */
  room: string;
  /** The closest analogue in a technology org. <strong> marks the job title. */
  reads: string;
}

export interface Dept {
  name: string;
  seats: Seat[];
}

export const statusLabel: Record<SeatStatus, string> = {
  led: "Led or owned",
  held: "Held personally",
  adjacent: "Worked alongside",
};

export const depts: Dept[] = [
  {
    name: "Program & content",
    seats: [
      {
        id: "resm",
        title: "Regional Event Studio Manager",
        status: "led",
        what: "Owns a portfolio of rooms across a region — the budget, the standard, and the partners who keep them working.",
        room: "Decides what every studio in the region must be capable of, funds it, and holds vendor teams to it. Answerable for a room in São Paulo behaving exactly like a room in the Bay Area, so a traveling executive program never has to care which one it landed in.",
        reads: "<strong>Regional workplace technology manager.</strong> Portfolio ownership with budget and vendor accountability attached. Of everything on this chart, the seat that transfers most directly.",
      },
      {
        id: "pm",
        title: "Program Management",
        status: "led",
        what: "Owns the portfolio of programs rather than any single show.",
        room: "Intake criteria, scheduling across venues, staffing models, vendor contracts, and a budget that spans a year of events instead of one night.",
        reads: "<strong>Program manager</strong>, unchanged. Same job, different vocabulary — which is exactly the problem this page exists to solve.",
      },
      {
        id: "tp",
        title: "Technical Producer",
        status: "held",
        what: "Owns the technical plan for a show, its budget, and the people who execute it.",
        room: "Turns what the producer wants into gear, crew, lead times, and a number. Present through rehearsal to catch what the plan missed while there is still time to fix it.",
        reads: "<strong>Technical program manager.</strong> The cleanest one-to-one on this whole chart — scope, budget, dependencies, and a delivery date that does not move.",
      },
      {
        id: "prod",
        title: "Producer",
        status: "adjacent",
        what: "Owns the outcome. Decides what the show is and whether it worked.",
        room: "Sets content and rehearsal priorities, and makes the calls that trade scope against time. Talks to the client, not to the rack.",
        reads: "<strong>Product owner.</strong> Accountable for the thing, not the mechanism.",
      },
      {
        id: "sm",
        title: "Stage Manager / Show Caller",
        status: "held",
        what: "Owns time and sequence once the show is running.",
        room: "Calls every cue — “standby camera two… take two.” Holds the entire sequence in their head and communicates continuously without editorializing.",
        reads: "<strong>Incident commander.</strong> Status on a fixed cadence under real pressure, and no drama in the voice.",
      },
    ],
  },
  {
    name: "Audio",
    seats: [
      {
        id: "a1",
        title: "A1 — Audio Lead",
        status: "held",
        what: "Owns everything anyone hears.",
        room: "Designs the audio system, sets gain structure, and mixes the show live. One person, one mix, and no second take.",
        reads: "<strong>Domain lead or principal engineer.</strong> Sole technical owner of a subsystem, making irreversible calls in real time.",
      },
      {
        id: "a2",
        title: "A2 — Audio Assistant",
        status: "held",
        what: "The A1's hands in the room.",
        room: "Mics talent, coordinates wireless frequencies, runs cable, and fixes the problem while the show keeps going around them.",
        reads: "<strong>Site reliability or field engineer.</strong> Diagnosing live, without taking the service down to do it.",
      },
      {
        id: "rf",
        title: "RF & Comms Coordinator",
        status: "held",
        what: "Owns the spectrum and the intercom.",
        room: "Coordinates wireless frequencies so nothing steps on anything else, and keeps crew communications working when they matter most.",
        reads: "<strong>Network engineer.</strong> A finite shared resource, allocated in advance so nobody collides at the worst moment.",
      },
    ],
  },
  {
    name: "Video",
    seats: [
      {
        id: "td",
        title: "Technical Director",
        status: "held",
        what: "Executes the show live on the switcher.",
        room: "Every cut and every transition, in real time, on the producer's call. There is no undo.",
        reads: "<strong>Release engineer at the moment of deploy.</strong> Irreversible actions, executed calmly, with everyone watching.",
      },
      {
        id: "v1",
        title: "Video Engineer (V1)",
        status: "held",
        what: "Owns signal integrity.",
        room: "Shades and matches cameras so ten sources look like one show, and handles routing, formats, and conversion between them.",
        reads: "<strong>Platform or quality engineer.</strong> Consistency across heterogeneous inputs nobody else wants to think about.",
      },
      {
        id: "cam",
        title: "Camera Operator",
        status: "held",
        what: "Owns the frame.",
        room: "Composes and operates, taking direction while anticipating the shot that will be asked for next.",
        reads: "<strong>Individual contributor executing to spec</strong>, with enough judgment to be trusted off-script.",
      },
      {
        id: "gfx",
        title: "Graphics Operator",
        status: "held",
        what: "Owns everything on screen that isn't a camera.",
        room: "Builds lower thirds, titles, and slide playback, then triggers them live on cue.",
        reads: "<strong>Design operations.</strong> An asset pipeline plus live execution against it.",
      },
      {
        id: "pb",
        title: "Playback Operator",
        status: "held",
        what: "Rolls recorded content on cue.",
        room: "Owns the media, its formats, and hitting the frame exactly when the call comes.",
        reads: "<strong>Content operations.</strong>",
      },
    ],
  },
  {
    name: "Systems & delivery",
    seats: [
      {
        id: "bcast",
        title: "Broadcast / Streaming Engineer",
        status: "held",
        what: "Owns delivery to everyone who isn't in the room.",
        room: "Encoders, bonded connections, platform endpoints, and the bitrate math that keeps a stream stable for an audience you cannot see.",
        reads: "<strong>Infrastructure or DevOps.</strong> The pipeline between what is produced and who receives it.",
      },
      {
        id: "ops",
        title: "Studio Operations",
        status: "led",
        what: "Owns readiness between shows.",
        room: "Preventative maintenance, spares strategy, and room certification. The unglamorous work that makes “it just works” true on the day.",
        reads: "<strong>Workplace technology or IT operations.</strong> Judged entirely by the absence of failures.",
      },
      {
        id: "sd",
        title: "Systems Designer",
        status: "adjacent",
        what: "Designs the room before there is a room.",
        room: "Signal flow drawings, rack elevations, and as-built documentation. Decides what a space will be capable of for the next decade.",
        reads: "<strong>Solutions architect.</strong> The same drawings in different notation.",
      },
      {
        id: "ld",
        title: "Lighting Director",
        status: "adjacent",
        what: "Owns what the camera sees.",
        room: "Designs and operates lighting for the room and for the lens at once — two requirements that routinely disagree.",
        reads: "<strong>Specialist domain lead</strong> balancing competing non-negotiables.",
      },
    ],
  },
];

export const allSeats: Seat[] = depts.flatMap((d) => d.seats);
export const defaultSeat = "resm";

/** Counted, never typed — the page's headline number can't drift from the data. */
export const seatCount = {
  total: allSeats.length,
  worked: allSeats.filter((s) => s.status !== "adjacent").length,
  get adjacent() {
    return this.total - this.worked;
  },
};
