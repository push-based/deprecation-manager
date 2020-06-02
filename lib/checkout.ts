import * as cp from "child_process";
import { CrawlConfig } from "./models";

export async function checkout(config: CrawlConfig) {
  const tagsString = await git([
    `log --tags --simplify-by-decoration --pretty="%d;%ci"`,
  ]);

  const tagWithDate = tagsString
    .split("\r\n")
    .filter(Boolean)
    .slice(0, 3)
    .concat(` (tag: master);${new Date().toISOString()}`)
    .map((t) => {
      const tag = t.substring(7, t.indexOf(")"));
      const date = t.split(";")[1];
      return [tag, date.substr(0, 10)];
    })
    .find(([tag]) => tag === config.gitTag);

  if (!tagWithDate) {
    throw new Error(`Tag "${config.gitTag}" not found`);
  }

  await git([`checkout`, config.gitTag]);

  return tagWithDate[1];
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
