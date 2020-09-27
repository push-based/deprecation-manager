import { setup } from '../processors/setup';
import { checkout } from '../tasks/checkout';
import { addVersion } from '../tasks/add-version';
import { updateRepository } from '../tasks/update-repository';
import { askToSkip, getInteractive, getVersion, run } from '../utils';
import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { YargsCommandObject } from '../cli/model';
import { crawl } from '../processors/crawl';
import { group } from '../processors/group';
import { format } from '../processors/format';
import { saveDeprecations } from '../tasks/save-deprecations';

export const defaultCommand: YargsCommandObject = {
  // * is the default command 
  // https://github.com/yargs/yargs/blob/master/docs/advanced.md#default-commands
  command: '*',
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
              getInteractive()
                ? askToSkip('Grouping?', group(config), {
                    precondition: async (r) =>
                      r.deprecations?.some((d) => !d.group),
                  })
                : group(config),
            saveDeprecations,
            (config: CrawlConfig): CrawlerProcess =>
              getInteractive()
                ? askToSkip('Update Formatted Output?', format(config), {
                    precondition: async (r) => r.deprecations?.length > 0,
                  })
                : format(config),
            (config: CrawlConfig): CrawlerProcess =>
              getInteractive()
                ? askToSkip('Update Repository?', updateRepository(config))
                : updateRepository(config),
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
