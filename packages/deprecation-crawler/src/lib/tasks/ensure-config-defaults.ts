import { CrawlConfig } from '../models';
import {
  DEFAULT_COMMENT_LINK_TEMPLATE,
  DEFAULT_COMMIT_MESSAGE,
  HEALTH_CHECK_GROUP_NAME,
  SEMVER_TOKEN,
  TAG_FORMAT_TEMPLATE,
  UNGROUPED_GROUP_NAME,
} from '../constants';
import { getSiblingPgkJson, SERVER_REGEX } from '../utils';

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
  let shell = version.split('@');
  let start = '';
  // npm scope style: @ present in version e.g. lib-name@1.0.0
  if (shell.length > 1) {
    start = shell[0] + '@';
    shell.shift();
  }

  const semver = SERVER_REGEX.exec(shell[0])[0] || shell[0];
  // npm scope style: semver can be 1.0.0 or v1.0.0
  shell = shell[0].split(semver);
  return [start, shell[0], `\${${SEMVER_TOKEN}}`, shell[1] || ''].join('');
}
