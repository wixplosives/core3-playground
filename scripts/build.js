// @ts-check

import { globalExternals } from "@fal-works/esbuild-plugin-global-externals";
import { build, context } from "esbuild";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import open, { apps } from "open";

const port = 8000;
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");
const outPath = new URL("../dist/", import.meta.url);
const publicPath = new URL("../public/", import.meta.url);

const alias = {
  "~sass/package.json": fileURLToPath(new URL("../node_modules/sass/package.json", import.meta.url)),
};

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  logLevel: "info",
  color: true,
  outdir: "dist",
  format: "esm",
  legalComments: "none",
  treeShaking: true,
  bundle: true,
  target: "es2022",
  entryPoints: ["src/main.ts", "src/preview.ts", "src/processing-worker.ts", "src/compilation-worker.ts"],
  entryNames: "[name]",
  loader: {
    ".json": "json",
    ".png": "file",
    ".jpeg": "file",
    ".jpg": "file",
    ".svg": "file",
  },
  assetNames: "assets/[name]-[hash]",
  minify: !isWatch,
  sourcemap: isWatch,
  jsx: "automatic",
  jsxDev: isWatch,
  plugins: [
    globalExternals({
      "monaco-editor": { varName: "monaco", namedExports: ["editor", "Uri", "languages"] },
    }),
  ],
  alias,
};

await fs.rm(outPath, { recursive: true, force: true });
await fs.mkdir(outPath, { recursive: true });
await fs.cp(publicPath, outPath, { recursive: true });
if (isWatch) {
  const indexHtmlPath = new URL("index.html", outPath);
  await fs.writeFile(indexHtmlPath, injectReloadScript(await fs.readFile(indexHtmlPath, "utf8")));
}
await buildVendors();

if (isWatch) {
  const buildContext = await context(buildOptions);
  await buildContext.serve({ servedir: "dist", port, cors: { origin: "*" } });
  await buildContext.watch();
  await open(`http://localhost:${port}`, { app: { name: apps.chrome } });
} else {
  await build(buildOptions);
}

async function buildVendors() {
  await build({
    logLevel: "info",
    color: true,
    outdir: "dist/vendors",
    format: "iife",
    legalComments: "none",
    bundle: true,
    target: "es2022",
    entryPoints: [
      "src/vendors/monaco.ts",
      "src/vendors/monaco-css-worker.ts",
      "src/vendors/monaco-generic-worker.ts",
      "src/vendors/monaco-html-worker.ts",
      "src/vendors/monaco-json-worker.ts",
    ],
    loader: {
      ".ttf": "file",
    },
    minify: !isWatch,
    sourcemap: isWatch,
    alias,
  });
}

/**
 * @param {string} html
 */
function injectReloadScript(html) {
  const closeIdx = html.lastIndexOf("</body>");
  const reloadScript = `<script>
      const eventSource = new EventSource("/esbuild");
      eventSource.addEventListener("change", () => {
        eventSource.close();
        location.reload();
      });
    </script>`;
  return closeIdx !== -1 ? `${html.slice(0, closeIdx)}  ${reloadScript}\n  ${html.slice(closeIdx)}` : html;
}
