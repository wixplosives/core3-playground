import path from "@file-services/path";
import { iconsCatalog } from "./icons-catalog";

const fileIconPath = (iconName: string) => `icons/file/${iconName}.svg`;

export function fileNameToIcon(fileName: string): string {
  return fileIconPath(matchFileIcon(fileName) ?? matchFileIcon(fileName.toLowerCase()) ?? iconsCatalog.file);
}

function matchFileIcon(fileName: string): string | undefined {
  const exactMatch = iconsCatalog.fileNames[fileName];
  if (exactMatch) {
    return exactMatch;
  }
  const parsedName = path.parse(fileName);
  const innerExtension = path.extname(parsedName.name);
  return iconsCatalog.fileExtensions[innerExtension + parsedName.ext] ?? iconsCatalog.fileExtensions[parsedName.ext];
}

const directoryIconPath = (iconName: string) => `icons/folder/${iconName}.svg`;

export function directoryNameToIcon(directoryName: string, isExpanded: boolean): string {
  const iconName = isExpanded
    ? (getExactOrLowercase(iconsCatalog.folderNamesExpanded, directoryName) ?? iconsCatalog.folderExpanded)
    : (getExactOrLowercase(iconsCatalog.folderNames, directoryName) ?? iconsCatalog.folder);
  return directoryIconPath(iconName);
}

function getExactOrLowercase<V>(obj: Record<string, V>, key: string): V | undefined {
  return obj[key] ?? obj[key.toLowerCase()];
}
