import { prompt } from 'enquirer';
import { CrawlConfig } from '../models';
import { readFile } from '../utils';
import * as path from 'path';

export async function ensureDeprecationUrlConfig(
  config: CrawlConfig
): Promise<CrawlConfig> {
  const userConfig: CrawlConfig = await prompt([
    {
      type: 'input',
      name: 'deprecationLink',
      message: "What's the deprecation link to the docs?",
      initial: config.deprecationLink || getSuggestionsFormPackageJson(config),
      skip: !!config.deprecationLink,
    },
  ]);

  return {
    ...config,
    ...userConfig,
  };
}

export function getSuggestionsFormPackageJson(config: CrawlConfig): string {
  const pkg = JSON.parse(
    readFile(path.join(path.dirname(config.tsConfigPath), 'package.json')) ||
      '{}'
  );
  let url = '';
  if (pkg.homepage) {
    url = pkg.homepage;
  } else if (pkg.repository && pkg.repository.url) {
    url = pkg.repository.url;
  }

  return url + '/deprecations';
}
