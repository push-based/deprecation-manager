import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import {
  git,
  concat,
  getCurrentBranchOrTag,
  getRemoteUrl,
  tap,
} from '../utils';

/**
 * Checkout the desired branch
 * Adds the branch date to the release
 */
export function checkout(_config: CrawlConfig): CrawlerProcess {
  return concat([
    tap((r) => checkoutBranch(r)),
    async (r): Promise<CrawledRelease> => {
      const date = await getBranchDate(r);
      const remoteUrl = await getRemoteUrl();
      return {
        ...r,
        date,
        remoteUrl,
      };
    },
  ]);
}

async function checkoutBranch(r: CrawledRelease) {
  const currentBranchOrTag = await getCurrentBranchOrTag();
  if (currentBranchOrTag !== r.tag) {
    await git.checkout(r.tag);
  }
}

async function getBranchDate(r: CrawledRelease) {
  const date = await git.log({ from: r.tag }).then((r) => r.latest.date);
  return date;
}
