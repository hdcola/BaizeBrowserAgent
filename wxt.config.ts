import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  outDir: "output",
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: (env) => ({
    default_locale: "en",
    name: "__MSG_extensionName__",
    description: "__MSG_extensionDescription__",
    permissions:
      env.browser === "safari" ? ["storage"] : ["sidePanel", "storage"],
    action: {
      default_title: "__MSG_extensionName__",
      default_popup: env.browser === "safari" ? "ext_popup.html" : undefined,
      default_icon: {
        "16": "icon/16.png",
        "32": "icon/32.png",
        "48": "icon/48.png",
        "128": "icon/128.png",
      },
    },
  }),
});
