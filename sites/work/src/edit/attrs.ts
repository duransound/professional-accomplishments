/**
 * Mark a piece of YAML-backed text as editable on the page.
 *
 *   <p {...ed("site.yaml", "pitch")}>{site.pitch}</p>
 *
 * Returns nothing outside the dev server, so the published HTML carries no
 * edit attributes at all. `block` lets return start a new line (no fields
 * use it yet); `html` is for fields stored as HTML, like the lens summaries.
 */
const DEV = import.meta.env.DEV;

export function ed(file: string, path: string, opts: { block?: boolean; html?: boolean } = {}) {
  if (!DEV) return {};
  return {
    "data-edit": `y:${path}`,
    "data-file": file,
    ...(opts.block ? {} : { "data-mode": "inline" }),
    ...(opts.html ? { "data-fmt": "html" } : {}),
  };
}
