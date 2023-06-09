// @ts-check

import fs from "node:fs/promises";
import { build, context } from "esbuild";
import cssModulesPlugin from "esbuild-css-modules-plugin";
import { globalExternals } from "@fal-works/esbuild-plugin-global-externals";
import open, { apps } from "open";

const port = 8000;
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");
const outPath = new URL("../dist/", import.meta.url);
const publicPath = new URL("../public/", import.meta.url);

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  logLevel: "info",
  color: true,
  outdir: "dist",
  format: "esm",
  legalComments: "none",
  bundle: true,
  entryPoints: ["src/main.ts", "src/compilation-worker.ts"],
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
    cssModulesPlugin({ v2: true, v2CssModulesOption: { pattern: "[hash]-[local]" } }),
    globalExternals({
      "monaco-editor": { varName: "monaco", namedExports: ["editor", "Uri", "languages"] },
      // "isomorphic-git": { varName: "isomorphicGit.git" },
      // "isomorphic-git/http/web": { varName: "isomorphicGit.httpClient" },
    }),
  ],
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
  await buildContext.serve({ servedir: "dist", port });
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
    entryPoints: [
      "src/vendors/monaco.ts",
      "src/vendors/monaco-css-worker.ts",
      "src/vendors/monaco-generic-worker.ts",
      "src/vendors/monaco-html-worker.ts",
      "src/vendors/monaco-json-worker.ts",
      /* "src/vendors/isomorphic-git.ts"*/
    ],
    loader: {
      ".ttf": "file",
    },
    minify: !isWatch,
    sourcemap: isWatch,
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
