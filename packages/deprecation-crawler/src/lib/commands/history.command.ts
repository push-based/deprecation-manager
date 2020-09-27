import { CrawledRelease, Deprecation, GitTag } from '../models';
import {
  getCurrentBranchOrTag,
  git,
  readRepoConfig,
  run,
  semverSort,
  updateRepoConfig,
  writeRawDeprecations,
} from '../utils';
import { YargsCommandObject } from '../cli/model';
import { checkout } from '../tasks/checkout';
import { crawl } from '../processors/crawl';
import { addVersion } from '../tasks/add-version';
import { prompt } from 'enquirer';
import { ensureCleanGit } from '../tasks/ensure-clean-git';
import * as cfgQuestions from '../tasks/ensure-config';
import { getTagChoices } from '../tasks/ensure-git-tag';

export const historyCommand: YargsCommandObject = {
  command: 'history',
  description: 'Crawls for deprecations in previous versions',
  module: {
    handler: async (argv) => {
      if (argv.verbose) console.info(`run history as a yargs command`);
      let config = readRepoConfig();
      const isInitialized = Object.keys(config).length > 0;
      if (!isInitialized) {
        config = {
          ...(await cfgQuestions
            .ensureDeprecationUrl(config)
            .then(cfgQuestions.ensureDeprecationComment)
            .then(cfgQuestions.ensureGroups)
            .then(cfgQuestions.ensureFormatter)
            .then(cfgQuestions.ensureOutputDirectory)
            .then(cfgQuestions.ensureIncludeGlob)
            .then(cfgQuestions.ensureExcludeGlob)
            // defaults should be last as it takes user settings
            .then(cfgQuestions.ensureConfigDefaults)),
        };
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
        const tasks = [checkout, crawl, addVersion, ensureCleanGit];
        const initial = {
          version: tag,
          tag: tag,
          // are used to only log new deprecations
          // will be overwritten after crawl
          deprecations: deprecations,
        } as CrawledRelease;
        const release = (await run(tasks, config)(initial)) as CrawledRelease;
        deprecations.push(...release.deprecations);
      }

      await git.checkout(current);

      const sortedDeprecations = semverSort(
        deprecations,
        false,
        (d: Deprecation) => d.version
      );

      const uniqueDeprecations = [
        ...new Map(sortedDeprecations.map((r) => [r.ruid, r])).values(),
      ];
      writeRawDeprecations(uniqueDeprecations, config);
      if (!isInitialized) {
        updateRepoConfig(config);
      }
    },
  },
};
