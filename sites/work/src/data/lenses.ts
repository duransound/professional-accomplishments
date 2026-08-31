import { z } from "zod";
import { loadContent, required } from "./load";

const lens = z.object({
  id: required("A lens id"),
  label: required("A button label"),
  summary: required("A summary"),
  studio: z.array(required("Each bullet")).default([]),
  crew: z.array(required("Each bullet")).default([]),
});

const schema = z
  .object({
    default: required("A default lens id"),
    lenses: z.array(lens).min(1, { message: "needs at least one lens" }),
  })
  .refine((d) => d.lenses.some((l) => l.id === d.default), {
    message:
      'the "default" at the top of the file must match the id of one of the lenses below',
    path: ["default"],
  });

const data = loadContent("lenses.yaml", schema);

export type Lens = z.infer<typeof lens>;
export type LensKey = "studio" | "crew";

export const lenses = data.lenses;
export const defaultLens = data.default;
