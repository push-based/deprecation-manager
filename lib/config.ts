import { normalize } from "path";
import { prompt } from "enquirer";
import { CrawlConfig } from "./models";
import { REPO_CONFIG_PATH } from "./constants";
import { readFile, updateRepoConfig } from "./utils";

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
      initial: repoConfig.tsConfigPath || './tsconfig.json',
      skip: !!repoConfig.tsConfigPath || !!repoConfig.excludeGlob,
    },
  ]);

  if (!userConfig.tsConfigPath) {
    const globAnswer: { excludeGlob: string } = await prompt([
      {
        type: "input",
        name: "excludeGlob",
        message: `Glob to exclude files or folders (default ignores node_modules and path in .gitignore)`,
        initial: repoConfig.excludeGlob ? repoConfig.excludeGlob.join(" ") : "",
        skip: !!repoConfig.tsConfigPath || !!repoConfig.excludeGlob,
      },
    ]);

    userConfig.excludeGlob = globAnswer.excludeGlob
      ? [...globAnswer.excludeGlob.split(" ").map((p) => p.trim())].filter(
          Boolean
        )
      : [];
  }

  const config = { groups: [], ...repoConfig, ...userConfig };
  updateRepoConfig(config);
  return config;
}
