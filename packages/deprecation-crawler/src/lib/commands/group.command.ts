import { setup } from '../processors/setup';
import { generateOutput } from '../tasks/generate-output';
import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { readRawDeprecations, run } from '../utils';
import { YargsCommandObject } from '../cli/model';
import { group } from '../processors/group';

export const groupCommand: YargsCommandObject = {
  command: 'group',
  description: 'Run the group processor',
  module: {
    handler: async (argv) => {
      if (argv.verbose) console.info(`run grouping as a yargs command`);
      const config = await setup();
      const tasks = [loadExistingDeprecations, group, generateOutput];

      // Run all processors
      const initial = {} as CrawledRelease;
      return await run(tasks, config)(initial);

      function loadExistingDeprecations(config: CrawlConfig): CrawlerProcess {
        return async (): Promise<CrawledRelease> => {
          const { deprecations } = readRawDeprecations(config);
          return (await { deprecations }) as CrawledRelease;
        };
      }
    },
  },
};
