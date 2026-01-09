import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "assets", "locales");
const destDir = path.join(rootDir, "public", "_locales");

async function copyLocales() {
  try {
    console.log(`Copying locales from ${srcDir} to ${destDir}...`);
    await fs.copy(srcDir, destDir, { overwrite: true });
    console.log("Locales copied successfully.");
  } catch (err) {
    console.error("Error copying locales:", err);
    process.exit(1);
  }
}

copyLocales();
