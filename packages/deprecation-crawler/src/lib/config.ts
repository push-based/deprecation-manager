import { normalize } from 'path';
import { prompt } from 'enquirer';
import { glob } from 'glob';
import { CrawlConfig } from './models';
import {
  CRAWLER_CONFIG_PATH,
  TSCONFIG_PATH,
  DEPRECATIONS_OUTPUT_DIRECTORY,
} from './constants';
import { readFile, updateRepoConfig } from './utils';
import * as yargs from 'yargs';

export async function getConfig(): Promise<CrawlConfig> {
  // Check for path params from cli command
  const argPath = (yargs.argv.path
    ? yargs.argv.path
    : yargs.argv.p
    ? yargs.argv.p
    : ''
  )
    .toString()
    .trim();
  // if no param is given it is '' if param with no value is given it is true
  const argPathGiven = argPath !== 'true' && argPath !== '';
  const crawlerConfigPath = argPathGiven ? argPath : CRAWLER_CONFIG_PATH;

  const repoConfigFile = readFile(crawlerConfigPath) || '{}';
  const repoConfig = JSON.parse(repoConfigFile);

  const tsConfigFiles = findTsConfigFiles();
  if (tsConfigFiles.length === 0) {
    throw Error('We need a tsconfig file to crawl');
  }

  // Check for tag params from cli command
  const argTag = (yargs.argv.tag
    ? yargs.argv.tag
    : yargs.argv.t
    ? yargs.argv.t
    : ''
  )
    .toString()
    .trim();

  // if no param is given it is '' if param with no value is given it is true
  const argTagGiven = argTag !== 'true' && argTag !== '';
  // select the string value if passed, otherwise select the first item in the list
  const gitTag = argTagGiven ? argTag : undefined;

  const userConfig: CrawlConfig = await prompt([
    {
      type: 'input',
      name: 'outputDirectory',
      message: "What's the output directory?",
      initial: repoConfig.outputDirectory || DEPRECATIONS_OUTPUT_DIRECTORY,
      skip: !!repoConfig.outputDirectory,
    },
    {
      type: 'select',
      name: 'tsConfigPath',
      message: "What's the location of the ts config file?",
      choices: findTsConfigFiles(),
      format(value) {
        return value ? normalize(value) : '';
      },
      initial:
        repoConfig.tsConfigPath ||
        tsConfigFiles.find((p) => p === TSCONFIG_PATH) ||
        tsConfigFiles[0],
      skip: !!repoConfig.tsConfigPath || tsConfigFiles.length === 1,
    },
    {
      type: 'input',
      name: 'deprecationComment',
      message: "What's the deprecation keyword to look for?",
      initial: repoConfig.deprecationComment || '@deprecated',
      skip: !!repoConfig.deprecationComment,
    },
    {
      type: 'input',
      name: 'deprecationLink',
      message:
        "What's the deprecation link to the docs (the deprecation ruid will be appended to this)?",
      initial: repoConfig.deprecationLink || 'https://rxjs.dev/deprecations',
      skip: !!repoConfig.deprecationLink,
    },
  ]);

  const config = {
    outputFormatters: ['tagBasedMarkdown', 'groupBasedMarkdown'],
    groups: [],
    configPath: crawlerConfigPath,
    ...repoConfig,
    ...userConfig,
    gitTag,
  };

  updateRepoConfig(config);
  return config;
}

export function findTsConfigFiles() {
  const tsConfigs = glob.sync('**/*tsconfig*.json', {
    ignore: '**/node_modules/**',
  });
  return [
    TSCONFIG_PATH,
    ...tsConfigs.filter((i) => i.indexOf(TSCONFIG_PATH) === -1),
  ];
}
