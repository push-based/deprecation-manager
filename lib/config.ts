import * as fs from "fs";
import * as yargs from "yargs";
import inquirer from "inquirer";
import { CrawlConfig } from "./models";

export async function getConfig() {
  const staticConfig: CrawlConfig = fs.existsSync("./crawl.config.local.json")
    ? JSON.parse(fs.readFileSync("./crawl.config.local.json").toString())
    : {};

  const configOverride: CrawlConfig = {
    ...staticConfig,
    ...(yargs.argv.gitHubUrl && { gitHubUrl: yargs.argv.gitHubUrl as string }),
    ...(yargs.argv.localePath && {
      localePath: yargs.argv.localePath as string,
    }),
    ...(yargs.argv.numGoBack && { numGoBack: yargs.argv.numGoBack as number }),
    ...(yargs.argv.outputFile && {
      outputFile: yargs.argv.outputFile as string,
    }),
  };

  const questions = [
    {
      type: "input",
      name: "gitHubUrl",
      message: "What's the github URL?",
      default: "https://github.com/ReactiveX/rxjs",
    },
    {
      type: "input",
      name: "localePath",
      message: "What's the local path of the repository?",
    },
    {
      type: "input",
      name: "outputFile",
      message: "Where should we save the results?",
      default: "./output/output.json",
    },
    {
      type: "input",
      name: "numGoBack",
      message: "What's the number of versions to go back?",
      validate: function (value: string) {
        var valid = !isNaN(parseFloat(value));
        return valid || "Please enter a number";
      },
      filter: Number,
      default: 3,
    },
  ].filter((q) => configOverride[q.name] === undefined);

  return inquirer.prompt(questions).then(async (answers) => {
    const config = { ...configOverride, ...answers } as CrawlConfig;
    fs.writeFileSync("./crawl.config.local.json", JSON.stringify(config));
    return config;
  });
}
