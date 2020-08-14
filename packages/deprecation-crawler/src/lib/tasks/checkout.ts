import { CrawlConfig, CrawlerProcess, CrawledRelease } from '../models';
import {
  git,
  concat,
  tap,
  getCurrentBranchOrTag,
  getRemoteUrl,
} from '../utils';

/**
 * Checkout the desired branch
 * Adds the branch date to the release
 */
export function checkout(config: CrawlConfig): CrawlerProcess {
  return concat([
    tap(async () => await checkoutBranch(config)),
    async (r): Promise<CrawledRelease> => {
      const date = await getBranchDate(config);
      const remoteUrl = await getRemoteUrl();
      return {
        ...r,
        date,
        remoteUrl,
      };
    },
  ]);
}

async function checkoutBranch(config: CrawlConfig) {
  const currentBranchOrTag = await getCurrentBranchOrTag();
  if (currentBranchOrTag !== config.gitTag) {
    await git([`checkout`, config.gitTag]);
  }
}

async function getBranchDate(config: CrawlConfig) {
  const date = await git([`log -1 --format=%ai ${config.gitTag}`]);
  return date;
}
