import path from "@file-services/path";
import { iconsCatalog } from "./icons-catalog";

const fileIconPath = (iconName: string) => `icons/${iconName}.svg`;

export function fileNameToIcon(fileName: string): string {
  const exactMatch = iconsCatalog.fileNames[fileName];
  if (exactMatch) {
    return fileIconPath(exactMatch);
  }
  const parsedName = path.parse(fileName);
  const innerExtension = path.extname(parsedName.name);
  const combinedExtIcon = innerExtension
    ? iconsCatalog.fileExtensions[innerExtension.slice(1) + parsedName.ext]
    : undefined;
  return fileIconPath(combinedExtIcon ?? iconsCatalog.fileExtensions[parsedName.ext.slice(1)] ?? iconsCatalog.file);
}

const directoryIconPath = (iconName: string) => `icons/${iconName}.svg`;

export function directoryNameToIcon(directoryName: string, isExpanded: boolean): string {
  if (isExpanded) {
    return directoryIconPath(iconsCatalog.folderNamesExpanded[directoryName] ?? iconsCatalog.folderExpanded);
  } else {
    return directoryIconPath(iconsCatalog.folderNames[directoryName] ?? iconsCatalog.folder);
  }
}
