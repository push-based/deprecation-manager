import { setup } from '../processors/setup';
import { YargsCommandObject } from '../cli/model';
import { commitChanges } from '../tasks/commit-changes';
import { readRepoConfig, run } from '../utils';
import { logError } from '../log';
import { CrawledRelease } from '../models';

export const initCommand: YargsCommandObject = {
  command: 'init',
  description: 'Initialize the deprecation crawler',
  module: {
    handler: async (argv) => {
      if (argv.verbose) console.info(`run init as a yargs command`);
      const existingConfig = readRepoConfig();
      const isAlreadyInitialized = Object.keys(existingConfig).length > 0;
      if (isAlreadyInitialized) {
        logError('Deprecation crawler is already initialized.');
        return;
      }
      const config = await setup();
      const tasks = [commitChanges];
      const initial = {} as CrawledRelease;
      run(tasks, config)(initial);
    },
  },
};
