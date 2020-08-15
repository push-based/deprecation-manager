import { getConfig } from './config';
import { CrawledRelease } from './models';
import { stripIndent } from 'common-tags';
import { branchHasChanges, run } from './utils';
import { logError } from './log';
import { addRuid } from './processors/add-ruid';
import { checkout } from './tasks/checkout';
import { crawl } from './tasks/crawl';
import { updateRepository } from './tasks/update-repository';
import { addGroups } from './tasks/add-groups';
import { generateOutput } from './tasks/generate-output';
import { commitChanges } from './tasks/commit-changes';

(async () => {
  await guardAgainstDirtyRepo();

  const config = await getConfig();

  const tasks = [
    checkout,
    crawl,
    addRuid,
    updateRepository,
    addGroups,
    generateOutput,
    commitChanges,
  ];

  // Run all processors
  const initial = ({} as unknown) as CrawledRelease;
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
