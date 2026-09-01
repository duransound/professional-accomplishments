import { z } from "zod";
import { loadContent, required } from "./load";

/**
 * The CMS writes an empty string for a field left blank, where hand-written
 * YAML simply omits the key. Both mean "not set", so normalise before
 * validating — otherwise clearing a field in the browser breaks the build.
 */
const blank = (v: unknown) => (v === "" || v === null ? undefined : v);

const role = z
  .object({
    years: required("A date range"),
    title: required("A job title"),
    org: z.preprocess(blank, z.string().optional()),
    lensKey: z.preprocess(
      blank,
      z
        .enum(["studio", "crew"], {
          errorMap: () => ({ message: 'must be either "studio" or "crew"' }),
        })
        .optional()
    ),
    note: z.preprocess(blank, z.string().optional()),
    current: z.boolean().default(false),
  })
  .refine((r) => !(r.lensKey && r.note), {
    message:
      'a role can have "lensKey" or "note", but not both — pick whether its bullets change with the lens or stay fixed',
    path: ["lensKey"],
  });

const schema = z.object({
  roles: z.array(role).min(1, { message: "needs at least one role" }),
  education: z.object({
    degree: required("A degree"),
    school: required("A school"),
    note: z.preprocess(blank, z.string().optional()),
  }),
});

const data = loadContent("experience.yaml", schema);

export type Role = z.infer<typeof role>;
export const roles = data.roles;
export const education = data.education;
