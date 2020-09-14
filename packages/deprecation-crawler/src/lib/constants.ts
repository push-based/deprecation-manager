import { Options } from 'yargs';
import { YargsCommandObject } from './cli/model';
import { groupCommand } from './commands/group.command';
import { defaultCommand } from './commands/default.command';
import { historyCommand } from './commands/history.command';
import { formatRawJsonCommand } from './commands/format-raw-json.command';
import { initCommand } from './commands/init.command';

export const DEPRECATIONS_OUTPUT_DIRECTORY = 'deprecations';
export const CRAWLER_CONFIG_PATH = 'deprecation-crawler.config.json';
export const SEMVER_TOKEN = `SEMVER_TOKEN`;
export const TAG_FORMAT_TEMPLATE = `\${${SEMVER_TOKEN}}`;
export const COMMENT_LINK_URL_TOKEN = `COMMENT_LINK_URL_TOKEN`;
export const COMMENT_LINK_URL_PARAM_TOKEN = `COMMENT_LINK_URL_PARAM_TOKEN`;
export const DEFAULT_COMMENT_LINK_TEMPLATE = `Details: {@link \${${COMMENT_LINK_URL_TOKEN}}#\${${COMMENT_LINK_URL_PARAM_TOKEN}}}`;
export const RAW_DEPRECATION_PATH = 'raw-deprecations.json';
export const DEFAULT_DEPRECATION_MSG_TOKEN = '@deprecated';
export const DEFAULT_COMMIT_MESSAGE =
  'docs(deprecation-manager): sync deprecations';
export const UNGROUPED_GROUP_NAME = 'ungrouped';
export const HEALTH_CHECK_GROUP_NAME = 'health-check';
export const enum CRAWLER_MODES {
  'SANDBOX' = 'SANDBOX_MODE',
  'CI' = 'CI',
}
export const MD_GROUP_OPENER = '<!-- ruid-groups';
export const MD_GROUP_CLOSER = 'ruid-groups -->';

export const OPTIONS: { [key: string]: Options } = {
  verbose: {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  },
  path: {
    alias: 'p',
    type: 'string',
    description: 'Path to deprecation-crawler.config.json',
  },
  tag: {
    alias: 't',
    type: 'string',
    description: 'Tag to crawler',
  },
  nextVersion: {
    alias: 'n',
    type: 'string',
    description: 'Version of the crawled results',
  },
};

export const COMMANDS: YargsCommandObject[] = [
  initCommand,
  groupCommand,
  historyCommand,
  formatRawJsonCommand,
  defaultCommand,
];
