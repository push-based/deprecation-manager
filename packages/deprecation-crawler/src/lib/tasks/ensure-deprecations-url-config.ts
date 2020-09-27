import { prompt } from 'enquirer';
import { CrawlConfig } from '../models';
import { getSiblingPgkJson } from '../utils';

export async function ensureDeprecationUrlConfig(
  config: CrawlConfig
): Promise<CrawlConfig> {
  const userConfig: CrawlConfig = await prompt([
    {
      type: 'input',
      name: 'deprecationLink',
      message: "What's the deprecation link to the docs?",
      initial: config.deprecationLink || getSuggestionsFormPackageJson(),
      skip: !!config.deprecationLink,
    },
  ]);

  return {
    ...config,
    ...userConfig,
  };
}

export function getSuggestionsFormPackageJson(): string {
  const pkg = getSiblingPgkJson('./');
  let url = '';
  if (pkg.homepage) {
    url = pkg.homepage;
  } else if (pkg.repository?.url) {
    url = pkg.repository.url;
  }

  return url + '/deprecations';
}
