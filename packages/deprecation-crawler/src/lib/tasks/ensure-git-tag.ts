import { CrawlConfig, CrawledRelease, CrawlerProcess, GitTag } from '../models';
import { prompt } from 'enquirer';
import * as semverHelper from 'semver';
import { getCurrentBranchOrTag, getTags } from '../utils';
import { escapeRegExp, template } from 'lodash';
import { SEMVER_TOKEN } from '../constants';
import * as yargs from 'yargs';
// @TODO get rid of require
import semverRegex = require('semver-regex');

export function ensureGitTag(config: CrawlConfig): CrawlerProcess {
  return async (r: CrawledRelease): Promise<CrawledRelease> => {
    if (!config.tagFormat) {
      throw new Error(
        `tagFormat ${config.tagFormat} invalid check your settings in ${config.configPath}`
      );
    }
    if (!config.tagFormat.includes(SEMVER_TOKEN)) {
      throw new Error(
        `tagFormat ${config.tagFormat} has to include ${SEMVER_TOKEN} as token`
      );
    }

    const currentBranch = await getCurrentBranchOrTag();

    const relevantBranches = await getRelevantTagsFromBranch(
      config.tagFormat,
      currentBranch
    );

    // @TODO move  cli stuff into separate fask
    // Check for tag params from cli command
    const argTagName = (yargs.argv.tag
      ? yargs.argv.tag
      : yargs.argv.t
      ? yargs.argv.t
      : ''
    )
      .toString()
      .trim();

    const cliPassedTag = relevantBranches.find((t) => t.name === argTagName);

    if (argTagName !== '' && !cliPassedTag) {
      throw new Error(
        `Tag name ${argTagName} passed over cli is not in the list of releases.`
      );
    }
    // user passed existing tag name
    else if (argTagName !== '' && cliPassedTag) {
      return {
        // @TODO consider pass the whole object
        tag: relevantBranches.find((t) => t.name === argTagName),
        ...r,
      };
    }
    // user did not pass tag over CLI param
    else {
      const gitTags = await getTagChoices(relevantBranches);
      const tagChoices = cliPassedTag
        ? [cliPassedTag.name]
        : [currentBranch, ...gitTags];

      // select the string value if passed, otherwise select the first item in the list
      const intialTag = cliPassedTag ? cliPassedTag.name : 0;
      const { name }: { name: string } = await prompt([
        {
          type: 'select',
          name: 'name',
          message: `What git tag do you want to crawl?`,
          skip: !!intialTag,
          // @NOTICE: by using choices here the initial value has to be typed as number.
          // However, passing a string works :)
          initial: (intialTag as unknown) as number,
          choices: tagChoices,
        },
      ]);

      return {
        // @TODO consider pass the whole object
        tag: relevantBranches.find((t) => t.name === name) || { name },
        ...r,
      };
    }
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
    template(tagFormat)({ semver: ' ' })
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

function semverSort(semvers: string[], asc: boolean) {
  return semvers.sort(function (v1, v2) {
    const sv1 = semverRegex().exec(v1)[0] || v1;
    const sv2 = semverRegex().exec(v2)[0] || v2;

    return asc
      ? semverHelper.compare(sv1, sv2)
      : semverHelper.rcompare(sv1, sv2);
  });
}

export async function getTagChoices(tags: GitTag[]): Promise<string[]> {
  const sortedTags = semverSort(
    tags.map((gt) => gt.name),
    false
  );
  // remove any duplicates
  return [...new Set([...sortedTags])];
}
