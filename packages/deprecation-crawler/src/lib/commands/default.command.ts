import { getConfig } from '../config';
import { checkout } from '../tasks/checkout';
import { crawl } from '../tasks/crawl';
import { addVersion } from '../tasks/add-version';
import { addGroups } from '../tasks/add-groups';
import { generateOutput } from '../tasks/generate-output';
import { updateRepository } from '../tasks/update-repository';
import { commitChanges } from '../tasks/commit-changes';
import { getVersion, run } from '../utils';
import { CrawledRelease } from '../models';
import { YargsCommandObject } from '../cli/model';
import { DEFAULT_COMMAND_NAME } from '../cli';

export const defaultCommand: YargsCommandObject = {
  command: DEFAULT_COMMAND_NAME,
  description: 'Run default processors',
  module: {
    handler: () => {
      getConfig().then((config) => {
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
      });
    },
  },
};
