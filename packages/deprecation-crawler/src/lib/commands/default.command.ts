import { setup } from '../processors/setup';
import { checkout } from '../tasks/checkout';
import { addVersion } from '../tasks/add-version';
import { generateOutput } from '../tasks/generate-output';
import { updateRepository } from '../tasks/update-repository';
import { askToSkip, getVersion, run } from '../utils';
import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { YargsCommandObject } from '../cli/model';
import { DEFAULT_COMMAND_NAME } from '../cli';
import { crawl } from '../processors/crawl';
import { group } from '../processors/group';

export const defaultCommand: YargsCommandObject = {
  command: DEFAULT_COMMAND_NAME,
  description: 'Run default processors',
  module: {
    handler: (): void => {
      setup()
        .then((config) => {
          const tasks = [
            checkout,
            crawl,
            addVersion,
            (config: CrawlConfig): CrawlerProcess =>
              askToSkip('Grouping?', group(config), {
                precondition: async (r) =>
                  r.deprecations?.some((d) => !d.group),
              }),
            generateOutput,
            updateRepository,
          ];

          // Run all processors
          const initial = {
            version: getVersion(),
          } as CrawledRelease;
          run(tasks, config)(initial);
        })
        .catch((e) => console.error(e));
    },
  },
};
