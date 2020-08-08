import { normalize } from 'path';
import { prompt } from 'enquirer';
import { glob } from 'glob';
import { CrawlConfig } from './models';
import { CRAWLER_CONFIG_PATH, TSCONFIG_PATH } from './constants';
import { readFile, updateRepoConfig } from './utils';
import { execSync } from 'child_process';
import * as yargs from "yargs";

export async function getConfig(): Promise<CrawlConfig> {
  const crawlerConfigPath: string = (yargs.argv.path || yargs.argv.p) as string || CRAWLER_CONFIG_PATH;
  const repoConfigFile = readFile(crawlerConfigPath) || '{}';
  const repoConfig = JSON.parse(repoConfigFile);

  const tsConfigFiles = findTsConfigFiles();
  if (tsConfigFiles.length === 0) {
    throw Error('We need a tsconfig file to crawl');
  }

  const argTag = (yargs.argv.tag ? yargs.argv.tag : yargs.argv.t ? yargs.argv.t: '').toString().trim();
  const defaultTag = argTag !== '' ? argTag : 'master';
  const tagChoices = [...getGitHubBranches(defaultTag), ...getGitHubTags()];
  const userConfig: CrawlConfig = await prompt([
    {
      type: 'select',
      name: 'gitTag',
      message: `What git tag do you want to crawl?`,
      skip: argTag !== '',
      // @NOTICE: by using choices here the initial value has to be typed as number.
      // However, passing a string works :)
      initial: ((defaultTag as unknown) as number),
      choices: tagChoices,
    },
    {
      type: 'input',
      name: 'outputDirectory',
      message: "What's the output directory?",
      initial: repoConfig.outputDirectory || './deprecations',
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
    outputFormatters: ["tagBasedMarkdown", "groupBasedMarkdown"],
    groups: [], ...repoConfig, ...userConfig };
  console.log('config', config);
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

export function getGitHubTags(): string[] {
  return execSync('git tag').toString().trim().split('\n').reverse();
}

export function getGitHubBranches(defaultTag: string): string[] {
  return [
    defaultTag,
    ...execSync('git branch')
      .toString()
      .trim()
      .split('\n')
      // @TODO remove ugly hack for the `*` char of the current branch
      .map((i) => i.split('* ').join(''))
      .filter((v) => v !== defaultTag),
  ].reverse();
}
