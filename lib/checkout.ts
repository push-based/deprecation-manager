import * as cp from "child_process";
import { CrawlConfig } from "./models";

export async function checkout(config: CrawlConfig) {
  await git([`checkout`, config.gitTag]);
  const date = await git([`log -1 --format=%ai ${config.gitTag}`]);
  return date.replace("\r\n", '').replace("\n", '');
}

function git(args: string[]): Promise<string> {
  return cmd("git", args);
}

function cmd(command: string, args: string[]): Promise<string> {
  return exec(command, args);
}

function exec(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(command + " " + args.join(" "), (err, stdout) => {
      if (err) {
        return reject(err);
      }

      resolve(stdout.toString());
    });
  });
}
