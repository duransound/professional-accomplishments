import { defineConfig } from "astro/config";

export default defineConfig({
  // Set this once the domain is chosen — it drives canonical URLs and RSS.
  site: "https://example.com",
  build: { inlineStylesheets: "auto" },
});
