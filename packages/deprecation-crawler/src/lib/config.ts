import { normalize } from 'path';
import { prompt } from 'enquirer';
import { glob } from 'glob';
import { CrawlConfig } from './models';
import {
  CRAWLER_CONFIG_PATH,
  TSCONFIG_PATH,
  DEPRECATIONS_OUTPUT_DIRECTORY,
} from './constants';
import { readFile, updateRepoConfig, git } from './utils';
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
  const tagChoices = sortTags(await getGitHubBranches(), await getGitHubTags());
  const intialTag = await initialTag(tagChoices);

  const userConfig: CrawlConfig = await prompt([
    {
      type: 'select',
      name: 'gitTag',
      message: `What git tag do you want to crawl?`,
      skip: argTagGiven as any,
      // @NOTICE: by using choices here the initial value has to be typed as number.
      initial: intialTag,
      choices: tagChoices,
    },
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

function sortTags(tags: string[], branches: string[]): string[] {
  // remove any duplicates
  const tagsAndBranches = [...new Set([...branches, ...tags])];
  return tagsAndBranches.sort(innerSort);

  function innerSort(a: string, b: string): number {
    const normalizedA = normalizeSemverIfPresent(a);
    const normalizedB = normalizeSemverIfPresent(b);

    return (
      ((/[A-Za-z]/.test(normalizedA) as unknown) as number) -
        ((/[A-Za-z]/.test(normalizedB) as unknown) as number) ||
      (normalizedA.toUpperCase() < normalizedB.toUpperCase()
        ? 1
        : normalizedA.toUpperCase() > normalizedB.toUpperCase()
        ? -1
        : 0)
    );
  }

  function normalizeSemverIfPresent(str: string): string {
    const regex = /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/;
    const potentialVersionNumber =
      str[0].toLowerCase() === 'v' ? str.slice(1) : str;
    return regex.test(potentialVersionNumber) ? potentialVersionNumber : str;
  }
}

export async function getGitHubTags(): Promise<string[]> {
  const branches = await git(['tag']);
  return (
    branches
      .trim()
      .split('\n')
      // @TODO remove ugly hack for the `*` char of the current branch
      .map((i) => i.split('* ').join(''))
      .sort()
  );
}

export async function getGitHubBranches(): Promise<string[]> {
  const branches = await git(['branch']);
  return (
    branches
      .trim()
      .split('\n')
      // @TODO remove ugly hack for the `*` char of the current branch
      .map((i) => i.split('* ').join(''))
      .sort()
  );
}

async function initialTag(tags: string[]) {
  const currentBranchOrTag = (
    (await git(['branch', '--show-current'])) ||
    (await git(['describe', ' --tags --exact-match']))
  ).trim();
  if (tags.includes(currentBranchOrTag)) {
    return tags.indexOf(currentBranchOrTag);
  }

  if (tags.includes('main')) {
    return tags.indexOf('main');
  }

  if (tags.includes('master')) {
    return tags.indexOf('master');
  }

  return 0;
}
