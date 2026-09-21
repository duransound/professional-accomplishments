import { defineConfig } from "astro/config";
import { editIntegration } from "./src/edit/integration.mjs";

export default defineConfig({
  // Drives canonical URLs, Open Graph URLs and schema.org data.
  // Must match the custom domain attached to the Worker in Cloudflare.
  site: "https://duran.show",
  build: { inlineStylesheets: "auto" },
  // Edit-on-the-page for case studies. Registers a save endpoint on the dev
  // server only — it does not exist in a build or on the published site.
  integrations: [editIntegration()],
});
