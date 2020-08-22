import { normalize } from 'path';
import { prompt } from 'enquirer';
import { glob } from 'glob';
import { CrawlConfig, CrawlConfigDefaults } from './models';
import {
  CRAWLER_CONFIG_PATH,
  TSCONFIG_PATH,
  DEPRECATIONS_OUTPUT_DIRECTORY,
  DEFAULT_COMMIT_MESSAGE,
  DEFAULT_DEPRECATION_MSG_TOKEN,
  TAG_FORMAT_TEMPLATE,
  UNGROUPED_GROUP_NAME,
  HEALTH_CHECK_GROUP_NAME,
} from './constants';
import { getCliParam, readFile, updateRepoConfig } from './utils';

export async function getConfig(): Promise<CrawlConfig> {
  // Check for path params from cli command
  const argPath = getCliParam(['path', 'p']);
  // if no param is given it is '' if param with no value is given it is true
  const crawlerConfigPath = argPath ? argPath : CRAWLER_CONFIG_PATH;

  const repoConfigFile = readFile(crawlerConfigPath) || '{}';
  const repoConfig = JSON.parse(repoConfigFile);

  const tsConfigFiles = findTsConfigFiles();
  if (tsConfigFiles.length === 0) {
    throw Error('We need a tsconfig file to crawl');
  }

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
      initial: repoConfig.deprecationComment || DEFAULT_DEPRECATION_MSG_TOKEN,
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
    ...getDefaultConfig(userConfig.deprecationComment),
    configPath: crawlerConfigPath,
    ...repoConfig,
    ...userConfig,
    groups: [
      { key: UNGROUPED_GROUP_NAME, matchers: [] },
      {
        key: HEALTH_CHECK_GROUP_NAME,
        matchers: ['\\/\\*\\* *\\' + userConfig.deprecationComment + ' *\\*/'],
      },
    ],
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

export function getDefaultConfig(): CrawlConfigDefaults {
  return {
    outputFormatters: ['tagBasedMarkdown', 'groupBasedMarkdown'],
    tagFormat: TAG_FORMAT_TEMPLATE,
    commitMessage: DEFAULT_COMMIT_MESSAGE,
  } as any;
}
