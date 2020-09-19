import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { askToSkip, readRawDeprecations, run } from '../utils';
import { YargsCommandObject } from '../cli/model';
import { group } from '../processors/group';
import { format } from '../processors/format';
import * as cfgQuestions from '../tasks/ensure-config';

export const groupCommand: YargsCommandObject = {
  command: 'group',
  description: 'Run the group processor',
  module: {
    handler: async (argv) => {
      if (argv.verbose) console.info(`run grouping as a yargs command`);
      const config = await {
        ...Promise.resolve({} as CrawlConfig)
          .then(cfgQuestions.ensureOutputDirectory)
          .then(cfgQuestions.ensureFormatter)
          .then(cfgQuestions.ensureGroups),
      };
      const tasks = [
        loadExistingDeprecations,
        group,
        (config: CrawlConfig): CrawlerProcess =>
          askToSkip('Update Formatted Output?', format(config), {
            precondition: async (r) => r.deprecations?.length > 0,
          }),
      ];

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
