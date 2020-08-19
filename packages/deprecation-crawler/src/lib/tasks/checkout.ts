import { CrawlConfig, CrawlerProcess, CrawledRelease } from '../models';
import {
  git,
  concat,
  tap,
  getRemoteUrl,
  getCurrentBranchOrTag,
} from '../utils';
import { ensureGitTag } from './ensure-git-tag';

/**
 * Checkout the desired branch
 * Adds the branch date to the release
 */
export function checkout(config: CrawlConfig): CrawlerProcess {
  return concat([
    ensureGitTag(config),
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
    await git([`checkout`, r.tag]);
  }
}

async function getBranchDate(r: CrawledRelease) {
  const date = await git([`log -1 --format=%ai ${r.tag}`]);
  return date;
}
