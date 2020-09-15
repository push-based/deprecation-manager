import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { readRawDeprecations, run } from '../utils';
import { YargsCommandObject } from '../cli/model';
import { writeRawDeprecationsTask } from '../tasks/write-raw-deprecations';
import * as cfgQuestions from '../tasks/ensure-config';

export const formatRawJsonCommand: YargsCommandObject = {
  command: 'format-raw',
  description: 'Run the formatRawJson processor',
  module: {
    handler: async (argv) => {
      if (argv.verbose) console.info(`run formatRawJson as a yargs command`);
      const config = await {
        ... Promise.resolve({ } as CrawlConfig)
          .then(cfgQuestions.ensureOutputDirectory)
      };

      const tasks = [loadExistingDeprecations, writeRawDeprecationsTask];

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
