import { Base64 } from "js-base64";
import { wixUnpkgURL } from "../constants";

export function createBase64DataURI(value: string | Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${typeof value === "string" ? Base64.encode(value) : Base64.fromUint8Array(value)}`;
}

export function unpkgUrlFor(packageName: string, packageVersion: string, pathInPackage: string): URL {
  return new URL(`${packageName}@${packageVersion}/${pathInPackage}`, wixUnpkgURL);
}
