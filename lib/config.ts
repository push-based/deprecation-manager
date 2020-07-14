import { normalize } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { prompt } from "enquirer";
import { format, resolveConfig } from "prettier";
import { CrawlConfig } from "./models";

const REPO_CONFIG_PATH = "./deprecation-crawler.config.json";

export async function getConfig(): Promise<CrawlConfig> {
  const repoConfigFile = readFile(REPO_CONFIG_PATH) || "{}";
  const repoConfig = JSON.parse(repoConfigFile);

  const userConfig: CrawlConfig = await prompt([
    {
      type: "input",
      name: "gitTag",
      message: `What git tag do you want to crawl?`,
      initial: process.argv.slice(2)[0] || "master",
      skip: !!process.argv.slice(2)[0],
    },
    {
      type: "input",
      name: "outputDirectory",
      message: "What's the output directory?",
      initial: repoConfig.outputDirectory || "./deprecations",
      skip: !!repoConfig.outputDirectory,
    },
    {
      type: "input",
      name: "tsConfigPath",
      message:
        "What's the location of the ts config file? (leave empty to crawl all files)",
      format(value) {
        return value ? normalize(value) : "";
      },
      initial: repoConfig.tsConfigPath,
      skip: !!repoConfig.tsConfigPath || !!repoConfig.excludeGlob,
    },
  ]);

  if (!userConfig.tsConfigPath) {
    const globAnswer: { excludeGlob: string } = await prompt([
      {
        type: "input",
        name: "excludeGlob",
        message: `Glob to exclude files or folders (default ignores node_modules and path in .gitignore)`,
        initial: repoConfig.excludeGlob,
        skip: !!repoConfig.tsConfigPath || !!repoConfig.excludeGlob,
      },
    ]);

    userConfig.excludeGlob = globAnswer.excludeGlob
      ? [
          ...getDefaultGlob(),
          ...globAnswer.excludeGlob.split(" ").map((p) => p.trim()),
        ].filter(Boolean)
      : [];
  }

  const config = { groups: [], ...repoConfig, ...userConfig };
  updateRepoConfig(config);
  return config;
}

export function updateRepoConfig(config: CrawlConfig) {
  const prettiedConfig = format(JSON.stringify(config), {
    parser: "json",
    ...resolveConfig.sync("./"),
  });

  writeFileSync(REPO_CONFIG_PATH, prettiedConfig);
}

function getDefaultGlob() {
  let ignore = ["!./node_modules/**"];
  const gitignore = readFile("./.gitignore");
  ignore.push(
    // remove empty entries and comments
    ...gitignore.split(/\r?\n/).filter((p) => p && !p.startsWith("#"))
  );
  return ["./**/*{.ts,.js}", ...ignore];
}

function readFile(path: string) {
  if (existsSync(path)) {
    return readFileSync(path, "utf-8");
  }
  return "";
}
