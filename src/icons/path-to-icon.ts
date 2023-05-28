import defaultFile from "./vscode-icons/default_file.svg";
import defaultFolder from "./vscode-icons/default_folder.svg";
import fileTypeCss from "./vscode-icons/file_type_css.svg";
import fileTypeEslint from "./vscode-icons/file_type_eslint.svg";
import fileTypeGit from "./vscode-icons/file_type_git.svg";
import fileTypeHtml from "./vscode-icons/file_type_html.svg";
import fileTypeJs from "./vscode-icons/file_type_js.svg";
import fileTypeJsMap from "./vscode-icons/file_type_jsmap.svg";
import fileTypeJson from "./vscode-icons/file_type_json.svg";
import fileTypeLicense from "./vscode-icons/file_type_license.svg";
import fileTypeMarkdown from "./vscode-icons/file_type_markdown.svg";
import fileTypeNode from "./vscode-icons/file_type_node.svg";
import fileTypeNpm from "./vscode-icons/file_type_npm.svg";
import fileTypePrettier from "./vscode-icons/file_type_prettier.svg";
import fileTypeReactjs from "./vscode-icons/file_type_reactjs.svg";
import fileTypeReactts from "./vscode-icons/file_type_reactts.svg";
import fileTypeTestts from "./vscode-icons/file_type_testts.svg";
import fileTypeTsconfig from "./vscode-icons/file_type_tsconfig.svg";
import fileTypeTypescript from "./vscode-icons/file_type_typescript.svg";
import fileTypeTypescriptdef from "./vscode-icons/file_type_typescriptdef.svg";
import fileTypeWebpack from "./vscode-icons/file_type_webpack.svg";
import folderTypeComponent from "./vscode-icons/folder_type_component.svg";
import folderTypeDist from "./vscode-icons/folder_type_dist.svg";
import folderTypeHook from "./vscode-icons/folder_type_hook.svg";
import folderTypeSrc from "./vscode-icons/folder_type_src.svg";
import folderTypeTest from "./vscode-icons/folder_type_test.svg";

const gitNames = new Set([".gitattributes", ".gitconfig", ".gitignore", ".gitmodules", ".gitkeep"]);

export function fileNameToIcon(fileName: string): string {
  if (fileName === "package.json") {
    return fileTypeNpm;
  } else if (fileName === ".nvmrc") {
    return fileTypeNode;
  } else if (fileName.endsWith(".tsx")) {
    return fileName.endsWith(".spec.tsx") ? fileTypeTestts : fileTypeReactts;
  } else if (fileName.endsWith(".d.ts")) {
    return fileTypeTypescriptdef;
  } else if (fileName.endsWith(".ts")) {
    return fileName.endsWith(".spec.ts") ? fileTypeTestts : fileTypeTypescript;
  } else if (fileName.startsWith("webpack.config") && fileName.endsWith(".js")) {
    return fileTypeWebpack;
  } else if (fileName.startsWith("tsconfig") && fileName.endsWith(".json")) {
    return fileTypeTsconfig;
  } else if (fileName.startsWith(".eslintrc") || fileName === ".eslintignore") {
    return fileTypeEslint;
  } else if (fileName.startsWith(".prettierrc") || fileName === ".prettierignore") {
    return fileTypePrettier;
  } else if (fileName === "LICENSE" || fileName === "LICENSE.md") {
    return fileTypeLicense;
  } else if (gitNames.has(fileName)) {
    return fileTypeGit;
  } else if (fileName.endsWith(".js")) {
    return fileTypeJs;
  } else if (fileName.endsWith(".json")) {
    return fileTypeJson;
  } else if (fileName.endsWith(".css")) {
    return fileTypeCss;
  } else if (fileName.endsWith(".jsx")) {
    return fileTypeReactjs;
  } else if (fileName.endsWith(".md")) {
    return fileTypeMarkdown;
  } else if (fileName.endsWith(".html")) {
    return fileTypeHtml;
  } else if (fileName.endsWith(".js.map")) {
    return fileTypeJsMap;
  }
  return defaultFile;
}

export function directoryNameToIcon(directoryName: string): string {
  if (directoryName === "components") {
    return folderTypeComponent;
  } else if (directoryName === "src") {
    return folderTypeSrc;
  } else if (directoryName === "hooks") {
    return folderTypeHook;
  } else if (directoryName === "test") {
    return folderTypeTest;
  } else if (directoryName === "dist") {
    return folderTypeDist;
  }
  return defaultFolder;
}
