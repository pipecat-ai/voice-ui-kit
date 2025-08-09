import fs from "fs";
import path from "path";
import postcss from "postcss";
import prefixer from "postcss-prefix-selector";
import tailwindcss from "@tailwindcss/postcss";

async function buildCSS() {
  try {
    // Read the source CSS file
    const sourceCssPath = path.resolve(process.cwd(), "src/index.css");
    const sourceCss = fs.readFileSync(sourceCssPath, "utf-8");

    // Process with Tailwind CSS
    const result = await postcss([
      tailwindcss({
        content: ["./src/**/*.{js,ts,jsx,tsx}"],
        prefix: "vkui",
      }),
    ]).process(sourceCss, { from: sourceCssPath });

    // Write main CSS file
    const cssPath = path.resolve(process.cwd(), "dist/voice-ui-kit.css");
    fs.writeFileSync(cssPath, result.css);

    // Process with prefixer for scoped version
    const scopedResult = await postcss([
      prefixer({
        prefix: ".vkui-root",
      }),
    ]).process(result.css, { from: undefined });

    const scopedCssPath = path.resolve(
      process.cwd(),
      "dist/voice-ui-kit-scoped.css",
    );
    fs.writeFileSync(scopedCssPath, scopedResult.css);

    console.log("✅ CSS build complete");
  } catch (error) {
    console.error("❌ CSS build failed:", error);
  }
}

buildCSS();
