import { Options } from 'yargs';
import { YargsCommandObject } from './cli/model';
import { groupCommand } from './commands/group.command';
import { defaultCommand } from './commands/default.command';

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
  'next-version': {
    alias: 'n',
    type: 'string',
    description: 'Version of the crawled results',
  },
};

export const COMMANDS: YargsCommandObject[] = [groupCommand, defaultCommand];
