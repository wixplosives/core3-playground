/* eslint-disable no-console */
import fs from "node:fs";
import { promisify } from "node:util";
import { deflate as deflateCb } from "node:zlib";
const deflate = promisify(deflateCb);

const bytesInKB = 1024;
const bytesInMB = bytesInKB * 1024;
const distURL = new URL("../dist/", import.meta.url);

await printDirectoryDeep("dist", distURL);

async function printDirectoryDeep(directoryName, directoryURL, padding = 0) {
  console.log(`${directoryName}/`.padStart(padding + directoryName.length + 1));
  for (const item of readdirSyncSorted(directoryURL)) {
    if (item.isFile()) {
      const fileName = item.name;
      const fileURL = new URL(fileName, directoryURL);
      const { compressed, raw } = await fileSizes(fileURL);
      const saved = `${(100 - (compressed / raw) * 100).toFixed(0)}%`;

      const firstColumn = fileName.padStart(padding + 2 + fileName.length).padEnd(28 - padding);
      const secondColumn = humanReadableSize(raw).padEnd(10);
      const thirdColumn = humanReadableSize(compressed).padEnd(10) + ` (${saved} saved)`;

      console.log(`${firstColumn}${secondColumn} -> ${thirdColumn}`);
    } else if (item.isDirectory()) {
      await printDirectoryDeep(item.name, new URL(`${item.name}/`, directoryURL), padding + 2);
    }
  }
}

function* readdirSyncSorted(directoryURL) {
  const directories = [];
  const files = [];
  for (const item of fs.readdirSync(directoryURL, { withFileTypes: true })) {
    if (item.isDirectory()) {
      directories.push(item);
    } else if (item.isFile()) {
      files.push(item);
    }
  }
  directories.sort(sortEntriesByName);
  files.sort(sortEntriesByName);
  yield* directories;
  yield* files;
}

function sortEntriesByName(a, b) {
  return a.name >= b.name ? 1 : -1;
}

async function fileSizes(fileURL) {
  const uncompressedBuffer = fs.readFileSync(fileURL);
  const compressedBuffer = await deflate(uncompressedBuffer);
  return { raw: uncompressedBuffer.byteLength, compressed: compressedBuffer.byteLength };
}

function humanReadableSize(bytes) {
  if (bytes >= bytesInMB) {
    return `${(bytes / bytesInMB).toFixed(2)} MB`;
  } else if (bytes >= bytesInKB) {
    return `${(bytes / bytesInKB).toFixed(2)} KB`;
  } else {
    return `${bytes} bytes`;
  }
}
