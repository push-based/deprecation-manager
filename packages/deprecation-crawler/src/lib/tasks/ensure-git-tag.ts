import { escapeRegExp, template } from 'lodash';
import * as semver from 'semver';
// @TODO get rid of require
import semverRegex = require('semver-regex');
import { getTags } from '../utils';
import { GitTag } from '../models';

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

export async function getTagChoices(branch: string): Promise<string[]> {
  const tags = await getRelevantTagsFromBranch(`v\${version}`, branch);
  const sortedTags = semverSort(
    tags.map((gt) => gt.gitTag),
    true
  );
  // remove any duplicates
  return [...new Set([branch, ...sortedTags])];
}
