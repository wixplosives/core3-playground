import git from "isomorphic-git";
import http from "isomorphic-git/http/web";
import { type IMemFileSystem } from "./fs/memory-fs";

export async function cloneGitRepo(fs: IMemFileSystem, repoUrl: string): Promise<void> {
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
