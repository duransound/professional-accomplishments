import { parse } from "yaml";
import { z } from "zod";

/**
 * Content lives in editable YAML under sites/work/content/. This module reads
 * it, checks it against a schema, and — the point of the whole exercise —
 * reports mistakes in language that names the field rather than the stack.
 *
 * Files are read through import.meta.glob so Vite handles them in both dev
 * and build, and the dev server reloads when a content file changes.
 */
const FILES = import.meta.glob("../../content/*.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * Turn a schema path into something you can actually find in the file.
 * Walks the parsed data alongside the path so list positions are reported by
 * their name — 'departments › "Audio" › color' rather than 'item 2'.
 */
function humanPath(path: (string | number)[], raw: unknown): string {
  if (path.length === 0) return "the top level of the file";
  const parts: string[] = [];
  let cursor: any = raw;
  for (const key of path) {
    if (typeof key === "number") {
      const item = Array.isArray(cursor) ? cursor[key] : undefined;
      const name =
        item && typeof item === "object"
          ? item.name ?? item.title ?? item.label ?? item.id
          : undefined;
      parts.push(name ? `"${name}"` : `item ${key + 1}`);
      cursor = item;
    } else {
      parts.push(String(key));
      cursor = cursor && typeof cursor === "object" ? cursor[key] : undefined;
    }
  }
  return parts.join(" › ");
}

function fail(file: string, lines: string[]): never {
  throw new Error(
    [
      "",
      `PROBLEM IN content/${file}`,
      "",
      ...lines,
      "",
      "Fix that file and save — this page will reload by itself.",
      "",
    ].join("\n")
  );
}

export function loadContent<T>(file: string, schema: z.ZodType<T>): T {
  const key = Object.keys(FILES).find((k) => k.endsWith(`/${file}`));
  if (!key) {
    fail(file, [
      `That file is missing. It should sit at sites/work/content/${file}`,
    ]);
  }

  let raw: unknown;
  try {
    raw = parse(FILES[key]!);
  } catch (err) {
    const first = String((err as Error).message).split("\n")[0];
    fail(file, [
      "This file isn't valid YAML, so nothing in it could be read.",
      "",
      `  ${first}`,
      "",
      "The two things that cause this almost every time:",
      "  1. A line indented differently from the lines around it.",
      "     Indentation is meaningful here — use spaces, never tabs.",
      "  2. A value containing a colon followed by a space, which YAML reads",
      "     as a new field. Put that value on its own line under a > marker.",
    ]);
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues;
    fail(file, [
      `${issues.length} thing${issues.length === 1 ? "" : "s"} need${
        issues.length === 1 ? "s" : ""
      } fixing:`,
      "",
      ...issues.map((i) => `  • ${humanPath(i.path, raw)}\n      ${i.message}`),
    ]);
  }
  return result.data;
}

/** Reusable pieces, so the messages stay consistent across files. */
export const required = (what: string) =>
  z.string({ required_error: `${what} is required but missing` }).min(1, {
    message: `${what} can't be empty`,
  });
