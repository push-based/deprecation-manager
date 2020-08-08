import { stripIndent } from 'common-tags';
import { getConfig } from './config';
import { CrawledRelease } from './models';
import { crawlDeprecations } from './crawler';
import { checkout } from './checkout';
import { addGrouping } from './processors/grouping';
import { addUniqueKey } from './processors/unique';
import {
  addCommentToRepository,
  generateMarkdown,
  generateRawJson,
} from './output-formatters/';
import { askToSkip, concat, tap, git, sandBoxMode } from './utils';
import { DEFAULT_COMMIT_MESSAGE } from './constants';
import { logError } from './log';

(async () => {
  await guardAgainstDirtyRepo();

  const config = await getConfig();
  const date = await checkout(config);
  const deprecations = await crawlDeprecations(config);

  const crawledRelease: CrawledRelease = {
    version: config.gitTag,
    date,
    deprecations,
  };

  const processors = [
    // Crawling Phase
    concat([
      async (): Promise<CrawledRelease> => ({
        ...crawledRelease,
        deprecations: await addUniqueKey(config, crawledRelease.deprecations),
      }),
      tap((r: CrawledRelease) =>
        generateRawJson(config, r.deprecations, { tagDate: r.date })
      )
    ]),
    // Repo Update
    askToSkip(
      'Repo Update?',
      tap((r: CrawledRelease) => addCommentToRepository(config, r.deprecations))
    ),
    // Grouping Phase
    askToSkip(
      'Grouping?',
      concat([
        async (r: CrawledRelease) => ({
          ...r,
          deprecations: await addGrouping(config, r.deprecations),
        }),
        tap((r: CrawledRelease) =>
          generateRawJson(config, r.deprecations, { tagDate: r.date })
        ),
        tap((r: CrawledRelease) => {
          return Promise.resolve(updateMd(config, r.deprecations));
        })
      ])
    ),
    // Formatting Phase
    askToSkip(
      'Markdown?',
      tap((r: CrawledRelease) =>
        generateMarkdown(config, r.deprecations, { tagDate: date })
      )
    ),
    askToSkip(
      'Do you want to commit the updates to the codebase?',
      tap((_) => commitChanges(config.commitMessage))
    ),
  ];

  // Run all processors
  concat(processors)(crawledRelease);
})();

async function guardAgainstDirtyRepo() {
  if (sandBoxMode()) {
    return;
  }
  const isDirty = await git(['status', '-s']);
  if (isDirty) {
    logError(
      stripIndent`
        Repository should be clean before we ruid links can be added.
        Commit your local changes or stash them before running the deprecation-crawler.
      `
    );
    process.exit(1);
  }
}

async function commitChanges(commitMessage = DEFAULT_COMMIT_MESSAGE) {
  if (sandBoxMode()) {
    return;
  }
  await git(['add', '.']);
  await git(['commit', `-m "${commitMessage}"`]);
}
