import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { applyEdits, applyYamlEdits } from "./apply.ts";

/**
 * Edit-on-the-page, for `npm run dev` only.
 *
 * astro:server:setup runs for the dev server and never for a build, so this
 * endpoint does not exist on the published site. It only answers requests
 * from this machine, only writes the content files named in TARGET, and
 * refuses a save if any file changed after the page loaded — so a stale tab
 * can't quietly overwrite newer text. A save that touches several files
 * checks all of them first and writes none unless every one is good.
 */
const TARGET = /^(case-studies\/[a-z0-9-]+\.md|[a-z0-9-]+\.yaml)$/;
/** @param {string} s */
export const hashOf = (s) => createHash("sha1").update(s).digest("hex");

/** @returns {import('astro').AstroIntegration} */
export function editIntegration() {
  let root = process.cwd();
  return {
    name: "duran-edit",
    hooks: {
      "astro:config:done": ({ config }) => { root = fileURLToPath(config.root); },
      "astro:server:setup": ({ server }) => {
        server.middlewares.use("/__edit/save", async (req, res) => {
          /** @param {number} code @param {object} body */
          const send = (code, body) => {
            res.statusCode = code;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(body));
          };
          const ip = req.socket.remoteAddress ?? "";
          if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip)) return send(403, { error: "Edits only work from this computer." });
          if (req.method !== "POST") return send(405, { error: "POST only." });
          try {
            const chunks = [];
            for await (const c of req) chunks.push(c);
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            // Older pages send one case-study file; newer ones send a batch.
            const batch = Array.isArray(body.files)
              ? body.files
              : [{ file: `case-studies/${body.file}.md`, base: body.base, edits: body.edits }];
            const writes = [];
            let count = 0;
            for (const { file, base, edits } of batch) {
              if (typeof file !== "string" || !TARGET.test(file)) return send(400, { error: `Bad file name: ${file}` });
              if (!Array.isArray(edits) || !edits.length) continue;
              const p = path.join(root, "content", file);
              const raw = await readFile(p, "utf8");
              if (hashOf(raw) !== base) {
                return send(409, { error: `content/${file} changed after the page loaded. Reload the page and make your edit again.` });
              }
              try {
                writes.push([p, file.endsWith(".md") ? applyEdits(raw, edits) : applyYamlEdits(raw, edits)]);
              } catch (e) {
                return send(422, { error: `content/${file}: ${e instanceof Error ? e.message : String(e)}` });
              }
              count += edits.length;
            }
            if (!count) return send(400, { error: "Nothing to save." });
            for (const [p, next] of writes) await writeFile(p, next, "utf8");
            return send(200, { ok: true, saved: count });
          } catch (e) {
            return send(422, { error: e instanceof Error ? e.message : String(e) });
          }
        });
      },
    },
  };
}
