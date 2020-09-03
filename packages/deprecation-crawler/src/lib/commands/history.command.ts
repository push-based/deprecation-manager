import { setup } from '../processors/setup';
import { CrawledRelease, Deprecation } from '../models';
import {
  getCurrentBranchOrTag,
  git,
  run,
  SERVER_REGEX,
  writeRawDeprecations,
} from '../utils';
import { YargsCommandObject } from '../cli/model';
import { checkout } from '../tasks/checkout';
import { crawl } from '../processors/crawl';
import { addVersion } from '../tasks/add-version';
import { prompt } from 'enquirer';
import { existsSync } from 'fs';
import * as semverHelper from 'semver';
import { join } from 'path';
import { RAW_DEPRECATION_PATH } from '../constants';
import { logError } from '../log';
import { commitChanges } from '../tasks/commit-changes';

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
      const tagsSorted = await getTagChoices(tags.all);

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
        const tasks = [checkout, crawl, addVersion, commitChanges];
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

async function getTagChoices(tags: string[]): Promise<string[]> {
  const sortedTags = semverSort(tags, false);
  return [...new Set([...sortedTags])];
}

function semverSort(semvers: string[], asc: boolean) {
  return semvers.sort(function (v1, v2) {
    const sv1 = SERVER_REGEX.exec(v1)[0] || v1;
    const sv2 = SERVER_REGEX.exec(v2)[0] || v2;

    return asc
      ? semverHelper.compare(sv1, sv2)
      : semverHelper.rcompare(sv1, sv2);
  });
}
