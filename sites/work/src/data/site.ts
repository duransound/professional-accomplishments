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
});

export const site = loadContent("site.yaml", schema);
