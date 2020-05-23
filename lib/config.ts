import * as fs from "fs";
import * as yargs from "yargs";
import inquirer from "inquirer";
import { CrawlConfig } from "./models";
import { normalize } from "path";

export async function getConfig(): Promise<CrawlConfig> {
  // const staticConfig: CrawlConfig = fs.existsSync("./crawl.config.local.json")
  //   ? JSON.parse(fs.readFileSync("./crawl.config.local.json").toString())
  //   : {};

  const configOverride: CrawlConfig = {
    // ...staticConfig,
    // ...(yargs.argv.gitHubUrl && { gitHubUrl: yargs.argv.gitHubUrl as string }),
    // ...(yargs.argv.localePath && {
    //   localePath: yargs.argv.localePath as string,
    // }),
    // ...(yargs.argv.outputFile && {
    //   outputFile: yargs.argv.outputFile as string,
    // }),
    ...(yargs.argv.gitTag && { gitTag: yargs.argv.gitTag as string }),
    ...(yargs.argv.outputDirectory && {
      outputDirectory: yargs.argv.outputDirectory as string,
    }),
    ...(yargs.argv.tsConfigPath && {
      tsConfigPath: yargs.argv.tsConfigPath as string,
    }),
  };

  const questions = [
    // {
    //   type: "input",
    //   name: "gitHubUrl",
    //   message: "What's the github URL?",
    //   default: "https://github.com/ReactiveX/rxjs",
    // },
    // {
    //   type: "input",
    //   name: "localePath",
    //   message: "What's the local path of the repository?",
    // },
    // {
    //   type: "input",
    //   name: "outputFile",
    //   message: "Where should we save the results?",
    //   default: "./output/output.json",
    // },
    {
      type: "input",
      name: "gitTag",
      message: "What's git tag to crawl?",
      default: "master",
    },
    {
      type: "input",
      name: "tsConfigPath",
      message: "What's the location of the ts config file?",
      default: "./src/tsconfig.base.json",
    },
    {
      type: "input",
      name: "outputDirectory",
      message: "What's the output directory?",
      default: "./deprecations",
    },
  ].filter((q) => configOverride[q.name] === undefined);

  return inquirer.prompt(questions).then(async (answers) => {
    let config = { ...configOverride, ...answers } as CrawlConfig;
    config.tsConfigPath = normalize(config.tsConfigPath);
    // fs.writeFileSync("./crawl.config.local.json", JSON.stringify(config));
    return config;
  });
}
