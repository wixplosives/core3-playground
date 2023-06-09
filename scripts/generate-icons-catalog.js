import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const vscodeIconsRepo = "git@github.com:vscode-icons/vscode-icons.git";
const publicIconsRoot = new URL("../public/icons/", import.meta.url);
const iconsCatalogPath = new URL("../src/helpers/icons-catalog.ts", import.meta.url);
const vscodeIconsRoot = new URL("../vscode-icons/", import.meta.url);
const svgIconsRoot = new URL("icons/", vscodeIconsRoot);
const vscodeManifestPath = new URL("dist/src/vsicons-icon-theme.json", vscodeIconsRoot);

if (!fs.existsSync(vscodeIconsRoot)) {
  spawnSyncSafe("git", ["clone", vscodeIconsRepo, "--depth", "1"]);
}

spawnSyncSafe("npm", ["i"], { cwd: vscodeIconsRoot });
spawnSyncSafe("npm", ["run", "build"], { cwd: vscodeIconsRoot });

const {
  iconDefinitions,
  file,
  folder,
  folderExpanded,
  rootFolder,
  rootFolderExpanded,
  folderNames,
  folderNamesExpanded,
  fileExtensions,
  fileNames,
  languageIds,
} = JSON.parse(fs.readFileSync(vscodeManifestPath, "utf8"));

const usedIcons = new Set();

function remapIdsToNames(catalogRecord) {
  for (const [key, value] of Object.entries(catalogRecord)) {
    if (typeof value === "string") {
      const iconName = path.parse(iconDefinitions[value].iconPath).name;
      catalogRecord[key] = iconName;
      usedIcons.add(iconName);
    } else if (typeof value === "object") {
      remapIdsToNames(value);
    }
  }
}

const catalog = {
  file,
  folder,
  folderExpanded,
  rootFolder,
  rootFolderExpanded,

  folderNames,
  folderNamesExpanded,
  fileExtensions,
  fileNames,
};

const { languages } = await import(new URL("out/src/iconsManifest/languages.js", vscodeIconsRoot));
for (const [lanaguageName, { ids, defaultExtension }] of Object.entries(languages)) {
  if (lanaguageName === defaultExtension || lanaguageName === ids) {
    fileExtensions[defaultExtension] ??= languageIds[lanaguageName];
  }
}
for (const [lanaguageName, { ids, defaultExtension }] of Object.entries(languages)) {
  const allLanguageIds = typeof ids === "string" ? [lanaguageName, ids] : [lanaguageName, ...ids];
  for (const languageId of allLanguageIds) {
    fileExtensions[defaultExtension] ??= languageIds[languageId];
  }
}

remapIdsToNames(catalog);

fs.rmSync(publicIconsRoot, { recursive: true, force: true });
fs.mkdirSync(publicIconsRoot, { recursive: true });

for (const iconName of usedIcons) {
  const iconFileName = `${iconName}.svg`;
  fs.copyFileSync(new URL(iconFileName, svgIconsRoot), new URL(iconFileName, publicIconsRoot));
}
const catalogTs = `export interface IconsCatalog {
  file: string;
  folder: string;
  folderExpanded: string;
  rootFolder: string;
  rootFolderExpanded: string;
  folderNames: Record<string, string>;
  folderNamesExpanded: Record<string, string>;
  fileExtensions: Record<string, string>;
  fileNames: Record<string, string>;
}

export const iconsCatalog: IconsCatalog = ${JSON.stringify(catalog, null, 2)};\n`;

fs.writeFileSync(iconsCatalogPath, catalogTs);
fs.rmSync(vscodeIconsRoot, { recursive: true, force: true });
spawnSyncSafe("npx", ["prettier", "./src/helpers/icons-catalog.ts", "--write"]);

function spawnSyncSafe(cmd, cmdArgs = [], options) {
  const { status } = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: true, ...options });
  if (status !== 0) {
    throw new Error(`Error while executing: ${[cmd, ...cmdArgs].join(" ")}`);
  }
}
