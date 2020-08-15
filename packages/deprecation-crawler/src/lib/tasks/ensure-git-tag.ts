import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { prompt } from 'enquirer';
import { getCurrentBranchOrTag, git } from '../utils';

export function ensureGitTag(config): CrawlerProcess {
  return async (r: CrawledRelease): Promise<CrawledRelease> => {
    const tagChoices = config.gitTag
      ? [config.gitTag]
      : await sortTags(await getGitHubBranches(), await getGitHubTags());
    // select the string value if passed, otherwise select the first item in the list
    const intialTag = config.gitTag ? config.gitTag : 0;
    const { gitTag }: CrawlConfig = await prompt([
      {
        type: 'select',
        name: 'gitTag',
        message: `What git tag do you want to crawl?`,
        skip: !!config.gitTag,
        // @NOTICE: by using choices here the initial value has to be typed as number.
        // However, passing a string works :)
        initial: (intialTag as unknown) as number,
        choices: tagChoices,
      },
    ]);
    return {
      gitTag,
      ...r,
    };
  };
}

async function sortTags(tags: string[], branches: string[]): Promise<string[]> {
  const currentBranchOrTag = await getCurrentBranchOrTag();

  // remove any duplicates
  const sorted = [...branches, ...tags].sort(innerSort);
  return [...new Set([currentBranchOrTag, ...sorted])];

  function innerSort(a: string, b: string): number {
    const normalizedA = normalizeSemverIfPresent(a);
    const normalizedB = normalizeSemverIfPresent(b);

    return (
      ((/[A-Za-z]/.test(normalizedA) as unknown) as number) -
        ((/[A-Za-z]/.test(normalizedB) as unknown) as number) ||
      (normalizedA.toUpperCase() < normalizedB.toUpperCase()
        ? 1
        : normalizedA.toUpperCase() > normalizedB.toUpperCase()
        ? -1
        : 0)
    );
  }

  function normalizeSemverIfPresent(str: string): string {
    const regex = /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/;
    const potentialVersionNumber =
      str[0].toLowerCase() === 'v' ? str.slice(1) : str;
    return regex.test(potentialVersionNumber) ? potentialVersionNumber : str;
  }
}

async function getGitHubTags(): Promise<string[]> {
  const branches = await git(['tag']);
  return (
    branches
      .trim()
      .split('\n')
      // @TODO remove ugly hack for the `*` char of the current branch
      .map((i) => i.split('* ').join(''))
      .sort()
  );
}

async function getGitHubBranches(): Promise<string[]> {
  const branches = await git(['branch']);
  return (
    branches
      .trim()
      .split('\n')
      // @TODO remove ugly hack for the `*` char of the current branch
      .map((i) => i.split('* ').join(''))
      .sort()
  );
}
