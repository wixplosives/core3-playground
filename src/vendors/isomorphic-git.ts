import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

import git from "isomorphic-git";
import httpClient from "isomorphic-git/http/web";

globalThis.isomorphicGit = {
  git,
  httpClient,
};

declare namespace globalThis {
  let isomorphicGit: {
    git: typeof import("isomorphic-git").default;
    httpClient: typeof import("isomorphic-git/http/web").default;
  };
  let Buffer: typeof import("buffer").Buffer;
}
