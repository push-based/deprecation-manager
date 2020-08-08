import { normalize } from 'path';
import { prompt } from 'enquirer';
import { glob } from 'glob';
import { CrawlConfig } from './models';
import { CRAWLER_CONFIG_PATH, TSCONFIG_PATH } from './constants';
import { readFile, updateRepoConfig } from './utils';
import { execSync } from 'child_process';
import { ensureTsConfigPath } from "./tasks/ensure-crawler-tsconfig";

export async function getConfig(): Promise<CrawlConfig> {
  const repoConfigFile = readFile(CRAWLER_CONFIG_PATH) || '{}';
  let repoConfig = JSON.parse(repoConfigFile);
  repoConfig = await ensureTsConfigPath(repoConfig);

  const defaultTag = 'master';
  const tagChoices = [...getGitHubBranches(defaultTag), ...getGitHubTags()];
  const userConfig: CrawlConfig = await prompt([
    {
      type: 'select',
      name: 'gitTag',
      message: `What git tag do you want to crawl?`,
      skip: !!process.argv.slice(2)[0],
      // @NOTICE: by using choices here the initial value has to be typed as number.
      // However, passing a string works :)
      initial:
        ((process.argv.slice(2)[0] as unknown) as number) ||
        ((defaultTag as unknown) as number),
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

  const config = { groups: [], ...repoConfig, ...userConfig };
  updateRepoConfig(config);
  return config;
}

export function findTsConfigFiles(): string[] {
  return  glob.sync('**/*tsconfig*.json', {
    ignore: '**/node_modules/**',
  });
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
