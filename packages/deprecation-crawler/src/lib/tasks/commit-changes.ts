import { CrawlConfig, CrawlerProcess } from '../models';
import { tap, askToSkip, branchHasChanges, git } from '../utils';
import { DEFAULT_COMMIT_MESSAGE } from '../constants';

/**
 * Commit the changes to the target repository
 * Raw output, added ruids to the codebase, formatted output
 */
export function commitChanges(config: CrawlConfig): CrawlerProcess {
  return askToSkip(
    'Do you want to commit the updates to the codebase?',
    tap(async (_) => await commit(config.commitMessage)),
    {
      precondition: async () => await branchHasChanges(),
    }
  );
}

async function commit(commitMessage = DEFAULT_COMMIT_MESSAGE) {
  await git(['add', '.']);
  await git(['commit', `-m "${commitMessage}"`]);
}
