import fs from "fs";
import path from "path";
import postcss from "postcss";
import prefixer from "postcss-prefix-selector";
import tailwindcss from "@tailwindcss/postcss";

async function buildCSS() {
  try {
    // Read the source CSS file
    const sourceCssPath = path.resolve(process.cwd(), "src/css/index.css");
    const sourceCss = fs.readFileSync(sourceCssPath, "utf-8");

    const result = await postcss([
      tailwindcss({
        content: ["src/**/*.{js,ts,jsx,tsx}"],
      }),
    ]).process(sourceCss, { from: sourceCssPath });

    // Write main CSS file
    const cssPath = path.resolve(process.cwd(), "dist/voice-ui-kit.css");
    fs.writeFileSync(cssPath, result.css);

    const rawUtilitiesSrc = path.resolve(
      process.cwd(),
      "src/css/utilities.css"
    );
    const rawUtilitiesDist = path.resolve(process.cwd(), "dist/utilities.css");
    if (fs.existsSync(rawUtilitiesSrc)) {
      fs.copyFileSync(rawUtilitiesSrc, rawUtilitiesDist);
    }

    // Process with prefixer for scoped version
    const scopedResult = await postcss([
      prefixer({
        prefix: ".vkui-root",
      }),
    ]).process(result.css, { from: undefined });

    const scopedCssPath = path.resolve(
      process.cwd(),
      "dist/voice-ui-kit-scoped.css"
    );
    fs.writeFileSync(scopedCssPath, scopedResult.css);

    // Process themes
    await buildThemes();

    console.log("✅ CSS build complete");
  } catch (error) {
    console.error("❌ CSS build failed:", error);
  }
}

async function buildThemes() {
  const themesDir = path.resolve(process.cwd(), "src/css/themes");
  const distThemesDir = path.resolve(process.cwd(), "dist/themes");

  // Create dist/themes directory if it doesn't exist
  if (!fs.existsSync(distThemesDir)) {
    fs.mkdirSync(distThemesDir, { recursive: true });
  }

  // Check if themes directory exists
  if (!fs.existsSync(themesDir)) {
    console.log("📁 No themes directory found, skipping theme build");
    return;
  }

  // Read all CSS files in the themes directory
  const themeFiles = fs
    .readdirSync(themesDir)
    .filter((file) => file.endsWith(".css"));

  if (themeFiles.length === 0) {
    console.log("📁 No theme files found, skipping theme build");
    return;
  }

  console.log(`🎨 Processing ${themeFiles.length} theme(s)...`);

  for (const themeFile of themeFiles) {
    const themeName = path.basename(themeFile, ".css");
    const themePath = path.join(themesDir, themeFile);
    const themeContent = fs.readFileSync(themePath, "utf-8");

    try {
      // Process theme with PostCSS (in case it needs any processing)
      const themeResult = await postcss([]).process(themeContent, {
        from: themePath,
      });

      // Write theme file to dist
      const distThemePath = path.join(distThemesDir, `${themeName}.css`);
      fs.writeFileSync(distThemePath, themeResult.css);

      console.log(`  ✅ Built theme: ${themeName}.css`);
    } catch (error) {
      console.error(`  ❌ Failed to build theme ${themeName}:`, error);
    }
  }
}

buildCSS();
