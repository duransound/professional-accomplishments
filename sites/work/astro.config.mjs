import { defineConfig } from "astro/config";

export default defineConfig({
  // Drives canonical URLs, Open Graph URLs and schema.org data.
  // Must match the custom domain attached to the Worker in Cloudflare.
  site: "https://duran.show",
  build: { inlineStylesheets: "auto" },
});
