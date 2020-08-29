import { getConfig } from './config';
import { CrawledRelease } from './models';
import { getVersion, run } from './utils';
import { checkout } from './tasks/checkout';
import { crawl } from './tasks/crawl';
import { updateRepository } from './tasks/update-repository';
import { addGroups } from './tasks/add-groups';
import { generateOutput } from './tasks/generate-output';
import { commitChanges } from './tasks/commit-changes';
import { addVersion } from './tasks/add-version';

(async () => {
  const config = await getConfig();

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
/*
async function guardAgainstDirtyRepo() {
  if (process.env.__CRAWLER_MODE__ === CRAWLER_MODES.SANDBOX) {
    return;
  }
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
*/
