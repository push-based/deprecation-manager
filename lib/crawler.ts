import path from "path";
import fs from "fs";
import * as cp from "child_process";
import {
  CrawlConfig,
  FoundDeprecation,
  CrawledRelease,
  CrawledDeprecation,
  NodeTypes,
} from "./models";
import { lint } from "./linter";

export async function crawl(cfg: CrawlConfig) {
  if (!ensureDirExists(cfg.localePath, () => process.chdir(cfg.localePath))) {
    await git([`clone ${cfg.gitHubUrl} .`]);
  }

  const output = [] as [string, string, FoundDeprecation[]][];
  const tagsString = await git([
    `log --tags --simplify-by-decoration --pretty="%d;%ci"`,
  ]);
  const tagsWithDate = tagsString
    .split("\n")
    .filter(Boolean)
    .slice(0, 3)
    .concat(` (tag: master);new Date()`);

  for (const tagWithDate of tagsWithDate) {
    // for example,  (tag: 6.3.0);2018-08-30 07:50:27 -0700
    const tag = tagWithDate.substring(7, tagWithDate.indexOf(")"));
    const date = tagWithDate.split(";")[1];

    console.log(`[${tag}] Checkout`);
    await git([`checkout`, tag]);
    // give it a little bit time.., exceptions like "process in use" might occur otherwise
    await wait(5000);

    console.log(`[${tag}] Lint`);
    const hits = lint();

    output.push([tag, date, hits]);
  }

  const outputContent: CrawledRelease[] = output.map(
    ([version, date, deprecations], index) => {
      let [_v, _d, previousDeprecations] = output[index - 1] || [];
      previousDeprecations = previousDeprecations || [];
      const newDeprecations: CrawledDeprecation[] = deprecations
        .map((d) => ({
          name: d.name,
          type: d.type as NodeTypes,
          deprecationMsg: d.deprecationMsg,
          sourceLink: `${cfg.gitHubUrl}/blob/${version}/${d.filename}#${d.lineNumber}`,
          isKnownDeprecation: previousDeprecations.some(
            (p) =>
              p.name === d.name &&
              p.filename === d.filename &&
              p.lineNumber === d.lineNumber
          ),
        }))
        .filter((d) => !d.isKnownDeprecation)
        .map(({ isKnownDeprecation: _, ...msg }) => msg);

      return {
        version,
        date,
        numberOfDeprecations: deprecations.length,
        numberOfNewDeprecations: newDeprecations.length,
        deprecations: newDeprecations,
      };
    }
  );

  ensureDirExists(path.dirname(cfg.outputFile));
  fs.writeFileSync(cfg.outputFile, JSON.stringify(outputContent, null, 4));
}

export function cmd(command: string, args: string[]): Promise<string> {
  return exec(command, args);
}

export function git(args: string[]): Promise<string> {
  return cmd("git", args);
}

export function exec(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(command + " " + args.join(" "), (err, stdout) => {
      if (err) {
        return reject(err);
      }

      resolve(stdout.toString());
    });
  });
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function ensureDirExists(dir: string, effect = () => {}) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    effect();
    return false;
  }

  effect();
  return true;
}
