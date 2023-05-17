import git, { type PromiseFsClient } from "isomorphic-git";
import http from "isomorphic-git/http/web";

export async function cloneGitRepo(fs: PromiseFsClient, repoUrl: string): Promise<void> {
  await git.clone({
    fs,
    http,
    dir: "/",
    corsProxy: "https://cors.isomorphic-git.org",
    url: repoUrl,
    singleBranch: true,
    depth: 1,
  });
}
