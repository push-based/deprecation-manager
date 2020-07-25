import { normalize } from "path";
import { prompt } from "enquirer";
import { glob } from "glob";
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
      type: "select",
      name: "tsConfigPath",
      message: "What's the location of the ts config file?",
      choices: findTsConfigFiles(),
      format(value) {
        return value ? normalize(value) : "";
      },
      initial: repoConfig.tsConfigPath || "./tsconfig.json",
      skip: !!repoConfig.tsConfigPath,
    },
  ]);

  const config = { groups: [], ...repoConfig, ...userConfig };
  updateRepoConfig(config);
  return config;
}

export function findTsConfigFiles() {
  const tsConfigs = glob.sync("**/*tsconfig*.json");
  return tsConfigs;
}
