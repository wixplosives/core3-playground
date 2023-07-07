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

const manifest = JSON.parse(fs.readFileSync(vscodeManifestPath, "utf8"));
const { iconDefinitions, languageIds } = manifest;
const usedIcons = new Set();

const catalog = {
  file: manifest.file,
  folder: manifest.folder,
  folderExpanded: manifest.folderExpanded,
  rootFolder: manifest.rootFolder,
  rootFolderExpanded: manifest.rootFolderExpanded,
  folderNames: { ...manifest.folderNames },
  folderNamesExpanded: { ...manifest.folderNamesExpanded },
  fileExtensions: prefixKeysWithDot(manifest.fileExtensions),
  fileNames: { ...manifest.fileNames },
};

function remapIdsToNames(catalogRecord) {
  for (const [key, value] of Object.entries(catalogRecord)) {
    if (typeof value === "string") {
      const iconName = path.parse(iconDefinitions[value].iconPath).name;
      const { remappedIconName, type } = remapIconName(iconName);
      catalogRecord[key] = remappedIconName;
      usedIcons.add({ iconName, remappedIconName, type });
    } else if (typeof value === "object") {
      remapIdsToNames(value);
    }
  }
}

for (const [id, { extensions = [], filenames = [] }] of Object.entries(getBuiltinLanguages())) {
  const languageIcon = languageIds[id];
  if (!languageIcon) {
    continue;
  }
  for (const ext of extensions) {
    catalog.fileExtensions[ext] ??= languageIcon;
  }
  for (const fileName of filenames) {
    catalog.fileNames[fileName] ??= languageIcon;
  }
}

const { languages } = await import(new URL("out/src/iconsManifest/languages.js", vscodeIconsRoot));
const exactMatchLanguageExt = new Set();
for (const [lanaguageName, { defaultExtension }] of Object.entries(languages)) {
  if (languageIds[lanaguageName] && lanaguageName === defaultExtension) {
    catalog.fileExtensions[`.${defaultExtension}`] = languageIds[lanaguageName];
    exactMatchLanguageExt.add(defaultExtension);
  }
}

for (const [lanaguageName, { ids, defaultExtension }] of Object.entries(languages)) {
  if (languageIds[lanaguageName] && lanaguageName === ids && !exactMatchLanguageExt.has(defaultExtension)) {
    catalog.fileExtensions[`.${defaultExtension}`] = languageIds[lanaguageName];
  }
}

for (const [lanaguageName, { ids, defaultExtension }] of Object.entries(languages)) {
  const allLanguageIds = typeof ids === "string" ? [lanaguageName, ids] : [lanaguageName, ...ids];
  for (const languageId of allLanguageIds) {
    if (languageIds[languageId]) {
      catalog.fileExtensions[`.${defaultExtension}`] ??= languageIds[languageId];
    }
  }
}

remapIdsToNames(catalog);

fs.rmSync(publicIconsRoot, { recursive: true, force: true });
fs.mkdirSync(publicIconsRoot, { recursive: true });
fs.mkdirSync(new URL("file/", publicIconsRoot));
fs.mkdirSync(new URL("folder/", publicIconsRoot));

for (const { iconName, remappedIconName, type } of usedIcons) {
  fs.copyFileSync(
    new URL(`${iconName}.svg`, svgIconsRoot),
    new URL(`${type}/${remappedIconName}.svg`, publicIconsRoot),
  );
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
spawnSyncSafe("npx", ["prettier", "./src/helpers/icons-catalog.ts", "--write"]);

fs.rmSync(vscodeIconsRoot, { recursive: true, force: true });

function spawnSyncSafe(cmd, cmdArgs = [], options) {
  const { status } = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: true, ...options });
  if (status !== 0) {
    throw new Error(`Error while executing: ${[cmd, ...cmdArgs].join(" ")}`);
  }
}

function prefixKeysWithDot(record) {
  return Object.fromEntries(Array.from(Object.entries(record), ([key, value]) => [`.${key}`, value]));
}

function remapIconName(iconName) {
  if (iconName.startsWith("file_type_")) {
    return { remappedIconName: iconName.slice("file_type_".length), type: "file" };
  } else if (iconName.startsWith("folder_type_")) {
    return { remappedIconName: iconName.slice("folder_type_".length), type: "folder" };
  } else if (iconName.startsWith("default_")) {
    if (iconName.includes("_folder")) {
      return { remappedIconName: iconName, type: "folder" };
    } else if (iconName.includes("_file")) {
      return { remappedIconName: iconName, type: "file" };
    }
  }
  throw new Error(`unknown icon name structure: ${iconName}`);
}

function getBuiltinLanguages() {
  return {
    plaintext: {
      extensions: [".txt"],
    },
    abap: {
      extensions: [".abap"],
    },
    apex: {
      extensions: [".cls"],
    },
    azcli: {
      extensions: [".azcli"],
    },
    bat: {
      extensions: [".bat", ".cmd"],
    },
    bicep: {
      extensions: [".bicep"],
    },
    cameligo: {
      extensions: [".mligo"],
    },
    clojure: {
      extensions: [".clj", ".cljs", ".cljc", ".edn"],
    },
    coffeescript: {
      extensions: [".coffee"],
    },
    c: {
      extensions: [".c", ".h"],
    },
    cpp: {
      extensions: [".cpp", ".cc", ".cxx", ".hpp", ".hh", ".hxx"],
    },
    csharp: {
      extensions: [".cs", ".csx", ".cake"],
    },
    csp: {},
    css: {
      extensions: [".css"],
    },
    cypher: {
      extensions: [".cypher", ".cyp"],
    },
    dart: {
      extensions: [".dart"],
    },
    dockerfile: {
      extensions: [".dockerfile"],
      filenames: ["Dockerfile"],
    },
    ecl: {
      extensions: [".ecl"],
    },
    elixir: {
      extensions: [".ex", ".exs"],
    },
    flow9: {
      extensions: [".flow"],
    },
    fsharp: {
      extensions: [".fs", ".fsi", ".ml", ".mli", ".fsx", ".fsscript"],
    },
    freemarker2: {
      extensions: [".ftl", ".ftlh", ".ftlx"],
    },
    "freemarker2.tag-angle.interpolation-dollar": {},
    "freemarker2.tag-bracket.interpolation-dollar": {},
    "freemarker2.tag-angle.interpolation-bracket": {},
    "freemarker2.tag-bracket.interpolation-bracket": {},
    "freemarker2.tag-auto.interpolation-dollar": {},
    "freemarker2.tag-auto.interpolation-bracket": {},
    go: {
      extensions: [".go"],
    },
    graphql: {
      extensions: [".graphql", ".gql"],
    },
    handlebars: {
      extensions: [".handlebars", ".hbs"],
    },
    hcl: {
      extensions: [".tf", ".tfvars", ".hcl"],
    },
    html: {
      extensions: [".html", ".htm", ".shtml", ".xhtml", ".mdoc", ".jsp", ".asp", ".aspx", ".jshtm"],
    },
    ini: {
      extensions: [".ini", ".properties", ".gitconfig"],
      filenames: ["config", ".gitattributes", ".gitconfig", ".editorconfig"],
    },
    java: {
      extensions: [".java", ".jav"],
    },
    javascript: {
      extensions: [".js", ".es6", ".jsx", ".mjs", ".cjs"],
      filenames: ["jakefile"],
    },
    julia: {
      extensions: [".jl"],
    },
    kotlin: {
      extensions: [".kt", ".kts"],
    },
    less: {
      extensions: [".less"],
    },
    lexon: {
      extensions: [".lex"],
    },
    lua: {
      extensions: [".lua"],
    },
    liquid: {
      extensions: [".liquid", ".html.liquid"],
    },
    m3: {
      extensions: [".m3", ".i3", ".mg", ".ig"],
    },
    markdown: {
      extensions: [".md", ".markdown", ".mdown", ".mkdn", ".mkd", ".mdwn", ".mdtxt", ".mdtext"],
    },
    mips: {
      extensions: [".s"],
    },
    msdax: {
      extensions: [".dax", ".msdax"],
    },
    mysql: {},
    "objective-c": {
      extensions: [".m"],
    },
    pascal: {
      extensions: [".pas", ".p", ".pp"],
    },
    pascaligo: {
      extensions: [".ligo"],
    },
    perl: {
      extensions: [".pl", ".pm"],
    },
    pgsql: {},
    php: {
      extensions: [".php", ".php4", ".php5", ".phtml", ".ctp"],
    },
    pla: {
      extensions: [".pla"],
    },
    postiats: {
      extensions: [".dats", ".sats", ".hats"],
    },
    powerquery: {
      extensions: [".pq", ".pqm"],
    },
    powershell: {
      extensions: [".ps1", ".psm1", ".psd1"],
    },
    proto: {
      extensions: [".proto"],
    },
    pug: {
      extensions: [".jade", ".pug"],
    },
    python: {
      extensions: [".py", ".rpy", ".pyw", ".cpy", ".gyp", ".gypi"],
    },
    qsharp: {
      extensions: [".qs"],
    },
    r: {
      extensions: [".r", ".rhistory", ".rmd", ".rprofile", ".rt"],
    },
    razor: {
      extensions: [".cshtml"],
    },
    redis: {
      extensions: [".redis"],
    },
    redshift: {},
    restructuredtext: {
      extensions: [".rst"],
    },
    ruby: {
      extensions: [".rb", ".rbx", ".rjs", ".gemspec", ".pp"],
      filenames: ["rakefile", "Gemfile"],
    },
    rust: {
      extensions: [".rs", ".rlib"],
    },
    sb: {
      extensions: [".sb"],
    },
    scala: {
      extensions: [".scala", ".sc", ".sbt"],
    },
    scheme: {
      extensions: [".scm", ".ss", ".sch", ".rkt"],
    },
    scss: {
      extensions: [".scss"],
    },
    shell: {
      extensions: [".sh", ".bash"],
    },
    sol: {
      extensions: [".sol"],
    },
    aes: {
      extensions: [".aes"],
    },
    sparql: {
      extensions: [".rq"],
    },
    sql: {
      extensions: [".sql"],
    },
    st: {
      extensions: [".st", ".iecst", ".iecplc", ".lc3lib"],
    },
    swift: {
      extensions: [".swift"],
    },
    systemverilog: {
      extensions: [".sv", ".svh"],
    },
    verilog: {
      extensions: [".v", ".vh"],
    },
    tcl: {
      extensions: [".tcl"],
    },
    twig: {
      extensions: [".twig"],
    },
    typescript: {
      extensions: [".ts", ".tsx", ".cts", ".mts"],
    },
    vb: {
      extensions: [".vb"],
    },
    wgsl: {
      extensions: [".wgsl"],
    },
    xml: {
      extensions: [
        ".xml",
        ".xsd",
        ".dtd",
        ".ascx",
        ".csproj",
        ".config",
        ".props",
        ".targets",
        ".wxi",
        ".wxl",
        ".wxs",
        ".xaml",
        ".svg",
        ".svgz",
        ".opf",
        ".xslt",
        ".xsl",
      ],
    },
    yaml: {
      extensions: [".yaml", ".yml"],
    },
    json: {
      extensions: [".json", ".bowerrc", ".jshintrc", ".jscsrc", ".eslintrc", ".babelrc", ".har"],
    },
  };
}
