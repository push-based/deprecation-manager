import { CrawlConfig, CrawledRelease, CrawlerProcess, GitTag } from '../models';
import { prompt } from 'enquirer';
import * as semverHelper from 'semver';
import {
  getCliParam,
  getConfigPath,
  getCurrentBranchOrTag,
  getTags,
  isCrawlerModeSandbox,
  SERVER_REGEX,
} from '../utils';
import { escapeRegExp, template } from 'lodash';
import { SEMVER_TOKEN } from '../constants';

/**
 * @description
 * returns a function that takes the current release tag and sets the current tag
 * based on the CLI param.
 * If not given the user is asked to select a tag form a list of tags which name is a valid semver
 * tag.
 * @param config
 */
export function ensureGitTag(config: CrawlConfig): CrawlerProcess {
  return async (r: CrawledRelease): Promise<CrawledRelease> => {
    ensureTagFormat(config);

    const currentBranch = await getCurrentBranchOrTag();
    const relevantBranches = await getRelevantTagsFromBranch(
      config.tagFormat,
      currentBranch
    );

    // No tags to select from
    if (relevantBranches.length <= 0) {
      if (isCrawlerModeSandbox()) {
        throw new Error(
          `The branch ${currentBranch} does not contain merged tags in the configured semver format ${
            config.tagFormat
          }.
          Check your tagFormat settings in ${getConfigPath()}.`
        );
      }
    }

    const cliPassedTagName = r.tag || getCliParam(['tag', 't']);
    if (cliPassedTagName !== false) {
      // user passed existing tag name
      return {
        // @TODO consider pass the whole object
        tag: cliPassedTagName,
        ...r,
      };
    }
    // user did not pass tag over CLI param
    else {
      const gitTags = await getTagChoices(relevantBranches);
      const tagChoices = [currentBranch, ...gitTags];

      // select the string value if passed, otherwise select the first item in the list
      const initialTag = currentBranch;
      const { name }: { name: string } = await prompt([
        {
          type: 'select',
          name: 'name',
          message: `What git tag do you want to crawl?`,
          // @NOTICE: by using choices here the initial value has to be typed as number.
          // However, passing a string works :)
          initial: (initialTag as unknown) as number,
          choices: tagChoices,
        },
      ]);

      return {
        // @TODO consider store it as `GitTag`
        tag: name,
        ...r,
      };
    }
  };
}

export function ensureTagFormat(config: CrawlConfig): void {
  if (!config.tagFormat) {
    throw new Error(
      `Tag format ${
        config.tagFormat
      } is invalid. Check your tagFormat settings in ${getConfigPath()}.`
    );
  }
  if (!config.tagFormat.includes(SEMVER_TOKEN)) {
    throw new Error(
      `Tag format ${
        config.tagFormat
      } has to include ${SEMVER_TOKEN} as token. Check your tagFormat settings in ${getConfigPath()}.`
    );
  }
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
    template(tagFormat)({ [SEMVER_TOKEN]: ' ' })
  ).replace(' ', '(.+)')}`;

  const relevantBranchTags = await getTags(branch).then((foundTags): GitTag[] =>
    foundTags.reduce((tags, name) => {
      const [, semver] = name.match(tagRegexp) || [];
      return semver && semverHelper.valid(semverHelper.clean(semver))
        ? [...tags, { name, semver }]
        : tags;
    }, [])
  );

  // @NOTICE: Keep it for verbose flag
  // console.log('found tags for branch %s: %o', branch, relevantBranchTags);
  return relevantBranchTags;
}

export async function getTagChoices(tags: GitTag[]): Promise<string[]> {
  const sortedTags = semverSort(
    tags.map((gt) => gt.name),
    false
  );
  // remove any duplicates
  return [...new Set([...sortedTags])];
}

function semverSort(semvers: string[], asc: boolean) {
  return semvers.sort(function (v1, v2) {
    const sv1 = SERVER_REGEX.exec(v1)[0] || v1;
    const sv2 = SERVER_REGEX.exec(v2)[0] || v2;

    return asc
      ? semverHelper.compare(sv1, sv2)
      : semverHelper.rcompare(sv1, sv2);
  });
}
