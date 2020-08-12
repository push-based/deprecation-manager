import { getConfig } from './config';
import { CrawledRelease } from './models';
import { stripIndent } from 'common-tags';
import { crawlDeprecations } from './crawler';
import { checkout } from './checkout';
import { addCommentToRepository } from './output-formatters';
import { askToSkip, concat, git, sandBoxMode, tap } from './utils';
import { format } from './processors/format';
import { group } from './processors/grouping';
import { crawl } from './processors/crawl';
import { logError } from './log';
import { DEFAULT_COMMIT_MESSAGE } from './constants';

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
    crawl(config),
    // Repo Update
    askToSkip(
      'Repo Update?',
      tap((r) => addCommentToRepository(config, r.deprecations))
    ),
    // Grouping Phase
    askToSkip('Grouping?', group(config)),
    // Formatting Phase
    askToSkip('Update Formatted Output?', format(config)),
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
