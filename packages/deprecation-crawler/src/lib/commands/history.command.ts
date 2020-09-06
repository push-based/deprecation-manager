import { setup } from '../processors/setup';
import { CrawledRelease, Deprecation, GitTag } from '../models';
import {
  getCurrentBranchOrTag,
  git,
  run,
  writeRawDeprecations,
} from '../utils';
import { YargsCommandObject } from '../cli/model';
import { checkout } from '../tasks/checkout';
import { crawl } from '../processors/crawl';
import { addVersion } from '../tasks/add-version';
import { prompt } from 'enquirer';
import { existsSync } from 'fs';
import { join } from 'path';
import { RAW_DEPRECATION_PATH } from '../constants';
import { logError } from '../log';
import { getTagChoices } from '../tasks/ensure-git-tag';

export const historyCommand: YargsCommandObject = {
  command: 'history',
  description: 'Crawls for deprecations in previous versions',
  module: {
    handler: async (argv) => {
      if (argv.verbose) console.info(`run history as a yargs command`);
      const config = await setup();

      const rawDeprecationsPath = join(
        config.outputDirectory,
        `${RAW_DEPRECATION_PATH}`
      );
      if (existsSync(rawDeprecationsPath)) {
        logError(
          'The history command can only be run on a clean repository without existing deprecations'
        );
        return;
      }

      const current = await getCurrentBranchOrTag();
      const tags = await git.tags();
      const tagsSorted = await getTagChoices(
        tags.all.map((t) => ({ name: t } as GitTag))
      );

      const { startingTag }: { startingTag: string } = await prompt([
        {
          type: 'select',
          name: 'startingTag',
          message: 'Select starting tag version',
          choices: [...tagsSorted],
        },
      ]);

      // crawl from oldest to newest to tag the deprecation with the correct version
      // (the version in which the deprecation was introduced)
      const tagsToCrawl = tagsSorted
        .splice(0, tagsSorted.indexOf(startingTag) + 1)
        .reverse();

      const deprecations: Deprecation[] = [];
      for (const tag of tagsToCrawl) {
        const tasks = [checkout, crawl, addVersion];
        const initial = {
          version: tag,
          tag: tag,
        } as CrawledRelease;
        const release = (await run(tasks, config)(initial)) as CrawledRelease;
        deprecations.push(...release.deprecations);
      }

      await git.checkout(current);

      const uniqueDeprecations = [
        ...new Map(deprecations.map((r) => [r.ruid, r])).values(),
      ];
      writeRawDeprecations(uniqueDeprecations, config);
    },
  },
};
