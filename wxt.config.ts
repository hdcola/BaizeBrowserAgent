import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  outDir: "output",
  manifest: {
    permissions: ["sidePanel", "storage", "activeTab", "scripting"],
    name: "Baize",
    description: "Baize Browser Agent - Control your browser with Gemini AI",
    action: {},
    side_panel: {
      default_path: "/sidepanel.html",
    },
  },
});
