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
  tagline: required("A tagline"),
});

export const site = loadContent("site.yaml", schema);
