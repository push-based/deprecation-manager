import { CrawlConfig } from '../models';
import {
  DEFAULT_COMMENT_LINK_TEMPLATE,
  DEFAULT_COMMIT_MESSAGE,
  HEALTH_CHECK_GROUP_NAME,
  SEMVER_TOKEN,
  TAG_FORMAT_TEMPLATE,
  UNGROUPED_GROUP_NAME,
} from '../constants';
import {
  getSiblingPgkJson,
  MAJOR_MINOR_SERVER_REGEX,
  MAJOR_SERVER_REGEX,
  SERVER_REGEX,
} from '../utils';

export async function ensureConfigDefaults(
  userConfig: CrawlConfig
): Promise<CrawlConfig> {
  const pkg = getSiblingPgkJson('./');

  return await {
    outputFormatters: [
      'tagBasedMarkdown',
      'groupBasedMarkdown',
      'deprecationIndex',
    ],
    tagFormat: pkg.version
      ? getSuggestedTagFormat(pkg.version)
      : TAG_FORMAT_TEMPLATE,
    commitMessage: DEFAULT_COMMIT_MESSAGE,
    commentLinkFormat: DEFAULT_COMMENT_LINK_TEMPLATE,
    groups: [
      { key: UNGROUPED_GROUP_NAME, matchers: [] },
      {
        key: HEALTH_CHECK_GROUP_NAME,
        matchers: ['\\/\\*\\* *\\' + userConfig.deprecationComment + ' *\\*/'],
      },
    ],
    include: ['./**/*.ts'],
    exclude: ['./**/*.(spec|test|d).ts'],
    // override defaults with user settings
    ...userConfig,
  };
}

export function getSuggestedTagFormat(version: string): string {
  // package@1.2.3, package-1.2.3
  const shell = version.split(/[@-]+[vV]*(?=[0-9])/);

  let start = '';
  // package style: '@' or '-' present in version e.g. lib-name@1.0.0 or lib-name-1.0.0
  if (shell.length > 1) {
    const packageSeparator = version[shell[0].length];
    start = shell[0] + packageSeparator;
    shell.shift();
  }

  let potentialSemver = shell[0];
  let semver;

  // v1.2.3, V1.2.3-alpha.1
  if (potentialSemver[0].toLowerCase() === 'v') {
    start += potentialSemver[0];
    potentialSemver = potentialSemver.slice(1, potentialSemver.length);
  }

  // 1.2.3, 1.2.3-alpha.1, , 1.2.3+alpha.1
  const matchFullSemver = SERVER_REGEX.exec(potentialSemver);

  if (matchFullSemver) {
    semver = matchFullSemver[0];
  }
  const matchMajorMinorSemver = MAJOR_MINOR_SERVER_REGEX.exec(potentialSemver);
  if (matchMajorMinorSemver) {
    semver = matchMajorMinorSemver[0];
  }
  const matchMajorSemver = MAJOR_SERVER_REGEX.exec(potentialSemver);
  if (matchMajorSemver) {
    semver = matchMajorSemver[0];
  }
  if (!semver) {
    throw new Error(
      `Can't suggest tag format for ${version}. Please stick to a semver version format.`
    );
  }

  return [start, `\${${SEMVER_TOKEN}}`].join('');
}
