import { Base64 } from "js-base64";
import mime from "mime";

export function createBase64DataURI(value: string | Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${typeof value === "string" ? Base64.encode(value) : Base64.fromUint8Array(value)}`;
}

export function createBase64DataURIModule(filePath: string, fileContents: Uint8Array) {
  const mimeType = mime.getType(filePath) ?? "application/octet-stream";
  const assetDataURI = createBase64DataURI(fileContents, mimeType);
  const compiledContents = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ${JSON.stringify(assetDataURI)};\n`;
  return compiledContents;
}
