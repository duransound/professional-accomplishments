import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Notes are Markdown files in content/notes/. Anything with draft: true is
 * excluded from the build entirely — it never gets a public URL.
 */
const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    draft: z.boolean().default(false),
  }),
});

/**
 * Case studies are Markdown files in content/case-studies/, published at
 * /projects/<filename>/. The frontmatter holds the data — rows, numbers, short
 * labels. The writing lives in the body as ordinary Markdown under ## headings,
 * so it can be edited in any text editor with the dev server showing the page.
 *
 * The body's structure (which sections exist, whether every finding has its
 * writing) is checked in src/data/case-studies.ts, where the errors can name
 * the file and the heading.
 */
const sev = z.enum(["critical", "high", "medium"], {
  errorMap: () => ({ message: "must be exactly one of: critical, high, medium" }),
});
const caseStudies = defineCollection({
  loader: glob({ pattern: "*.md", base: "./content/case-studies" }),
  schema: z.object({
    kind: z.string().min(1),
    demo: z.boolean({
      required_error:
        "is required. true means this describes no real client and the page will say so; " +
        "false is only for a study a client has agreed to be named in.",
    }),
    issued: z.coerce.date(),
    title: z.string().min(1),
    dek: z.string().min(1),
    summaryLine: z.string().min(1),
    target: z.number(),
    meta: z.array(z.object({ k: z.string(), v: z.string() })).min(1),
    statuses: z
      .array(
        z.object({
          key: z.enum(["down", "watch", "ready"], {
            errorMap: () => ({ message: "must be exactly one of: down, watch, ready" }),
          }),
          name: z.string().min(1),
          rule: z.string().min(1),
        })
      )
      .min(1),
    instrumentNote: z.string().min(1),
    rooms: z
      .array(
        z.object({
          id: z.string().min(1),
          use: z.string().min(1),
          score: z.number().min(0).max(100),
          critical: z.number().int().min(0),
          weakest: z.string().min(1),
          // Days since this room's last walkthrough. Over 7 missed this week;
          // over 10 is overdue.
          daysSince: z.number().int().min(0),
        })
      )
      .min(1),
    findings: z
      .array(
        z.object({
          ref: z.string().min(1),
          severity: sev,
          // Room ids, or "all". Checked against the rooms list in case-studies.ts.
          rooms: z.union([z.array(z.string().min(1)).min(1), z.literal("all")]),
          problem: z.string().min(1),
          fix: z.string().min(1),
          effort: z.string().optional(),
        })
      )
      .min(1),
    // Section headings shown on the page. Each is optional — leave one out
    // and the page uses its default wording.
    headings: z
      .object({
        summary: z.string(), trend: z.string(), walkthrough: z.string(), method: z.string(), scorecard: z.string(),
        findings: z.string(), plan: z.string(), limits: z.string(),
      })
      .partial()
      .default({}),
    // Weeks before this one, oldest first. This week is worked out from the rooms.
    history: z
      .array(
        z.object({
          readiness: z.number().min(0).max(100),
          down: z.number().int().min(0),
          watch: z.number().int().min(0),
          ready: z.number().int().min(0),
          walked: z.number().int().min(0),
        })
      )
      .min(1),
    trendCaption: z.string().min(1),
    // The technician's view. A sample of real checks for the demo; optional.
    walkthrough: z
      .object({
        room: z.string().min(1),
        roomUse: z.string().min(1),
        tech: z.string().min(1),
        pass: z.string().min(1),
        of: z.number().int().min(1),
        checks: z
          .array(
            z.object({
              area: z.string().min(1),
              weight: z.number().min(1),
              label: z.string().min(1),
              critical: z.boolean().default(false),
              state: z.enum(["pass", "flag", "fail", "na"], {
                errorMap: () => ({ message: "must be exactly one of: pass, flag, fail, na — or leave it out for unanswered" }),
              }).optional(),
              note: z.string().optional(),
            })
          )
          .min(1),
      })
      .optional(),
    chartTitle: z.string().min(1),
    chartCaption: z.string().min(1),
    chart: z
      .array(z.object({ name: z.string().min(1), count: z.number().int().min(0) }))
      .min(2),
    plan: z
      .array(
        z.object({
          when: z.string().min(1),
          title: z.string().min(1),
          capital: z.boolean().default(false),
          items: z
            .array(
              z.object({
                do: z.string().min(1),
                days: z.number().optional(),
                effort: z.string().optional(),
              })
            )
            .min(1),
        })
      )
      .min(1),
  }),
});

export const collections = { notes, caseStudies };
