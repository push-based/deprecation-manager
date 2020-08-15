import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { prompt } from 'enquirer';
import * as semver from 'semver';
// @TODO get rid of require
import semverRegex = require('semver-regex');
import { getTags, git } from '../utils';
import { GitTag } from '../models';
import { escapeRegExp, template } from 'lodash';

export function ensureGitTag(config): CrawlerProcess {
  return async (r: CrawledRelease): Promise<CrawledRelease> => {
    const currentBranch = await git(['branch --show-current']);
    const relevantBranches = await getRelevantTagsFromBranch(
      `v\${version}`,
      currentBranch
    );
    const tagChoices = config.gitTag
      ? [config.gitTag]
      : await getTagChoices(relevantBranches);
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
      gitTag: relevantBranches.find((t) => t.gitTag === gitTag),
      ...r,
    };
  };
}

export async function getRelevantTagsFromBranch(
  tagFormat: string,
  branch: string
): Promise<GitTag[]> {
  // Generate a regex to parse tags formatted with `tagFormat`
  // by replacing the `version` variable in the template by `(.+)`.
  // The `tagFormat` is compiled with space as the `version` as it's an invalid tag character,
  // so it's guaranteed to no be present in the `tagFormat`.
  const tagRegexp = `^${escapeRegExp(
    template(tagFormat)({ version: ' ' })
  ).replace(' ', '(.+)')}`;

  const relevantBranchTags = await getTags(branch).then((foundTags) =>
    foundTags.reduce((tags, tag) => {
      const [, version] = tag.match(tagRegexp) || [];
      return version && semver.valid(semver.clean(version))
        ? [...tags, { gitTag: tag, version }]
        : tags;
    }, [])
  );

  console.log('found tags for branch %s: %o', branch, relevantBranchTags);
  return relevantBranchTags;
}

function semverSort(semvers: string[], asc: boolean) {
  return semvers.sort(function (v1, v2) {
    const sv1 = semverRegex().exec(v1)[0] || v1;
    const sv2 = semverRegex().exec(v2)[0] || v2;

    return asc ? semver.compare(sv1, sv2) : semver.rcompare(sv1, sv2);
  });
}

export async function getTagChoices(gitTags: GitTag[]): Promise<string[]> {
  const sortedTags = semverSort(
    gitTags.map((gt) => gt.gitTag),
    false
  );
  // remove any duplicates
  return [...new Set([...sortedTags])];

}
