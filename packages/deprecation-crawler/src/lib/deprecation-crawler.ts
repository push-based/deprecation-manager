import { setup } from './processors/setup';
import { CrawledRelease } from './models';
import { stripIndent } from 'common-tags';

import {
  branchHasChanges,
  isCrawlerModeCi,
  run,
  getVersion
} from './utils';
import { logError } from './log';
import { checkout } from './tasks/checkout';
import { crawl } from './processors/crawl';
import { updateRepository } from './tasks/update-repository';
import { addGroups } from './tasks/add-groups';
import { generateOutput } from './tasks/generate-output';
import { commitChanges } from './tasks/commit-changes';
import { addVersion } from './tasks/add-version';

(async () => {
  if (isCrawlerModeCi()) {
    await guardAgainstDirtyRepo();
  }
  const config = await setup();

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
})();

async function guardAgainstDirtyRepo() {
  const isDirty = await branchHasChanges();
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
