import { setup } from '../processors/setup';
import { checkout } from '../tasks/checkout';
import { addVersion } from '../tasks/add-version';
import { addGroups } from '../tasks/add-groups';
import { generateOutput } from '../tasks/generate-output';
import { updateRepository } from '../tasks/update-repository';
import { commitChanges } from '../tasks/commit-changes';
import { getVersion, run } from '../utils';
import { CrawledRelease } from '../models';
import { YargsCommandObject } from '../cli/model';
import { DEFAULT_COMMAND_NAME } from '../cli';
import { crawl } from '../processors/crawl';

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
            addGroups,
            generateOutput,
            updateRepository,
            commitChanges,
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
