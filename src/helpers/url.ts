import { Base64 } from "js-base64";
import mime from "mime";
import { wixUnpkgURL } from "../constants";

export function createBase64DataURI(value: string | Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${typeof value === "string" ? Base64.encode(value) : Base64.fromUint8Array(value)}`;
}

export function unpkgUrlFor(packageName: string, packageVersion: string, pathInPackage: string): URL {
  return new URL(`${packageName}@${packageVersion}/${pathInPackage}`, wixUnpkgURL);
}

export function createBase64DataURIModule(filePath: string, fileContents: Uint8Array) {
  const mimeType = mime.getType(filePath) ?? "application/octet-stream";
  const assetDataURI = createBase64DataURI(fileContents, mimeType);
  const compiledContents = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports.default = ${JSON.stringify(assetDataURI)};\n`;
  return compiledContents;
}
