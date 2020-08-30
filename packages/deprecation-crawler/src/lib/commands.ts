import * as yargs from "yargs";
import { CommandModule, Options } from "yargs";
import { getConfig } from "./config";
import { addGroups } from "./tasks/add-groups";
import { generateOutput } from "./tasks/generate-output";
import { CrawlConfig, CrawledRelease, CrawlerProcess } from "./models";
import { getVersion, readRawDeprecations, run } from "./utils";
import { checkout } from "./tasks/checkout";
import { crawl } from "./tasks/crawl";
import { addVersion } from "./tasks/add-version";
import { updateRepository } from "./tasks/update-repository";
import { commitChanges } from "./tasks/commit-changes";

export const OPTIONS: { [key: string]: Options } = {
  "verbose": {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging"
  }
};

export const COMMANDS:
  {
    command: string | ReadonlyArray<string>;
    description: string;
    module: CommandModule
  }[] = [
  {
    command: "group",
    description: "Run the group processor",
    module: {
      handler: async (argv) => {
        if (argv.verbose) console.info(`run grouping as a yargs command`);
        const config = await getConfig();
        const tasks = [
          loadExistingDeprecations,
          addGroups,
          generateOutput
        ];

        // Run all processors
        const initial = {} as CrawledRelease;
        return await run(tasks, config)(initial);

        function loadExistingDeprecations(config: CrawlConfig): CrawlerProcess {
          return async (r: CrawledRelease): Promise<CrawledRelease> => {
            const { deprecations } = readRawDeprecations(config);
            return await { deprecations } as CrawledRelease;
          };
        }
      }
    }
  },
  {
    command: "default-command",
    description: "Run default processors",
    module: {
      handler: (argv) => {
        getConfig().then((config) => {
          const tasks = [
            checkout,
            crawl,
            addVersion,
            addGroups,
            generateOutput,
            updateRepository,
            commitChanges
          ];

          // Run all processors
          const initial = {
            version: getVersion()
          } as CrawledRelease;
          run(tasks, config)(initial);
        });
      }
    }
  }
];

export function setupYargsCommands() {
  COMMANDS.forEach((command) => {
    yargs
      .command(command.command, command.description, command.module);
  });
  return yargs;
}
