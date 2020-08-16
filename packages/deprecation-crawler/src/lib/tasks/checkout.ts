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
    tap(async (r) => await checkoutBranch(r)),
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
/*
async function checkoutTag(r: CrawledRelease): Promise<void> {
  await git([`checkout tags/${r.tag.name}`]);
}
 */
async function checkoutBranch(r: CrawledRelease) {
  const currentBranchOrTag = await getCurrentBranchOrTag();
  console.log('checkoutBranch', r);
  if (currentBranchOrTag !== r.tag.name) {
    await git([`checkout`, r.tag.name]);
  }
}

async function getBranchDate(r: CrawledRelease) {
  const date = await git([`log -1 --format=%ai ${r.tag.name}`]);
  return date;
}
