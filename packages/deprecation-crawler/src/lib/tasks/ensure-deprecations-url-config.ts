import { prompt } from 'enquirer';
import { CrawlConfig } from '../models';

export async function ensureDeprecationUrlConfig(
  config: CrawlConfig
): Promise<CrawlConfig> {
  const userConfig: CrawlConfig = await prompt([
    {
      type: 'input',
      name: 'deprecationLink',
      message:
        "What's the deprecation link to the docs (the deprecation ruid will be appended to this)?",
      // @TODO consider other default
      initial: 'https://rxjs.dev/deprecations',
      skip: !!config.deprecationLink,
    },
  ]);

  return {
    ...config,
    ...userConfig,
  };
}
