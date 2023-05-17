import defaultFile from "./vscode-icons/default_file.svg";
import fileTypeCss from "./vscode-icons/file_type_css.svg";
import fileTypeReactjs from "./vscode-icons/file_type_reactjs.svg";
import fileTypeReactts from "./vscode-icons/file_type_reactts.svg";
import fileTypeTestts from "./vscode-icons/file_type_testts.svg";
import fileTypeTypescript from "./vscode-icons/file_type_typescript.svg";
import fileTypeTypescriptdef from "./vscode-icons/file_type_typescriptdef.svg";
import fileTypeJs from "./vscode-icons/file_type_js.svg";
import defaultFolder from "./vscode-icons/default_folder.svg";
import folderTypeComponent from "./vscode-icons/folder_type_component.svg";
import folderTypeSrc from "./vscode-icons/folder_type_src.svg";
import folderTypeHook from "./vscode-icons/folder_type_hook.svg";
import folderTypeTest from "./vscode-icons/folder_type_test.svg";
import fileTypeHtml from "./vscode-icons/file_type_html.svg";
import fileTypeWebpack from "./vscode-icons/file_type_webpack.svg";
import folderTypeDist from "./vscode-icons/folder_type_dist.svg";

export function fileNameToIcon(fileName: string): string {
  if (fileName.endsWith(".tsx")) {
    return fileName.endsWith(".spec.tsx") ? fileTypeTestts : fileTypeReactts;
  } else if (fileName.endsWith(".ts")) {
    return fileName.endsWith(".spec.ts") ? fileTypeTestts : fileTypeTypescript;
  } else if (fileName.endsWith(".d.ts")) {
    return fileTypeTypescriptdef;
  } else if (fileName.startsWith("webpack.config") && fileName.endsWith(".js")) {
    return fileTypeWebpack;
  } else if (fileName.endsWith(".js")) {
    return fileTypeJs;
  } else if (fileName.endsWith(".css")) {
    return fileTypeCss;
  } else if (fileName.endsWith(".jsx")) {
    return fileTypeReactjs;
  } else if (fileName.endsWith(".html")) {
    return fileTypeHtml;
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
