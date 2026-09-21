import { z } from "zod";
import { loadContent, required } from "./load";

const schema = z.object({
  name: required("A name"),
  location: required("A location"),
  email: required("An email address").email({
    message: "doesn't look like an email address",
  }),
  linkedin: required("A LinkedIn URL").url({
    message: "must be a full URL starting with https://",
  }),
  linkedinLabel: required("A short LinkedIn label"),
  // The two halves of the masthead role line. The vocabulary switch shows
  // one or the other; both are always rendered.
  roleProduction: required("A role line in production vocabulary").max(52, {
    message: "is too long for the lower third — keep it on one line",
  }),
  roleTechnology: required("A role line in technology vocabulary").max(52, {
    message: "is too long for the lower third — keep it on one line",
  }),
  tagline: required("A tagline"),
  projectsIntro: z.string().optional(),
  pitch: z.string().optional(),
  /** The "Looking for" sheet. Optional in full: no block, no sheet. */
  hire: z
    .object({
      /** roles = hiring first, engagements in a quieter box underneath.
       *  both  = two equal doors side by side: companies first, hiring teams second. */
      layout: z.enum(["roles", "both"], { errorMap: () => ({ message: 'must be "roles" or "both"' }) }).default("roles"),
      label: required("A sheet label"),
      rolesTitle: z.string().optional(),
      offersButton: z.string().optional(),
      offersSubject: z.string().optional(),
      heading: required("A heading"),
      roles: z
        .array(z.object({ title: required("A role title"), line: required("A one-line description") }))
        .min(1, { message: "needs at least one role" }),
      note: z.string().optional(),
      button: required("The button text"),
      subject: required("An email subject line"),
      showOffers: z.boolean().default(true),
      offersTitle: z.string().optional(),
      offers: z
        .array(
          z.object({
            title: required("An offer title"),
            line: required("A one-line description"),
            subject: required("An email subject line"),
            href: z.string().optional(),
          })
        )
        .default([]),
    })
    .optional(),
  /**
   * The status lamp in the masthead. Optional in full — the component renders
   * nothing when it is absent, so an unmaintained "now" line can be removed
   * rather than left to rot. `updated` is required when the block exists,
   * because a status with no date stops being a status.
   */
  now: z
    .object({
      label: required("A label for the status lamp").max(16, {
        message: "is too long for the masthead — one or two words",
      }),
      text: required("What you are working on").max(110, {
        message: "is too long for the masthead — keep it to one sentence",
      }),
      href: z.string().optional(),
      updated: z.coerce.date({
        invalid_type_error: "must be a date like 2026-09-18",
        required_error:
          "is required whenever there is a now block. A status line with no date stops being a status.",
      }),
    })
    .optional(),
});

export const site = loadContent("site.yaml", schema);
