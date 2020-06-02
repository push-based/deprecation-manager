import * as fs from "fs";
import * as os from "os";
import * as yargs from "yargs";
import inquirer from "inquirer";
import { CrawlConfig } from "./models";
import { normalize } from "path";

const version = "1";
const configPath = `${os.homedir}/deprecation-crawler.config.${version}.json`;

export async function getConfig(): Promise<CrawlConfig> {
  const staticConfig: CrawlConfig = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath).toString())
    : {};

  const getConfig = (option: string, defaultValue: string) => ({
    [option]: yargs.argv[option] || staticConfig[option] || defaultValue,
  });

  const defaultConfig = {
    ...getConfig("gitTag", "master"),
    ...getConfig("tsConfigPath", "./src/tsconfig.base.json"),
    ...getConfig("outputDirectory", "./deprecations"),
  };

  const questions = [
    {
      type: "input",
      name: "gitTag",
      message: "What git tag do you want to crawl?",
      default: defaultConfig.gitTag,
    },
    {
      type: "input",
      name: "tsConfigPath",
      message: "What's the location of the ts config file?",
      default: defaultConfig.tsConfigPath,
    },
    {
      type: "input",
      name: "outputDirectory",
      message: "What's the output directory?",
      default: defaultConfig.outputDirectory,
    },
  ];

  return inquirer.prompt(questions).then(async (answers) => {
    let config = { ...defaultConfig, ...answers } as CrawlConfig;
    config.tsConfigPath = normalize(config.tsConfigPath);
    fs.writeFileSync(configPath, JSON.stringify(config));
    return config;
  });
}
