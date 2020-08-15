export const DEPRECATIONS_OUTPUT_DIRECTORY = 'deprecations';
export const CRAWLER_CONFIG_PATH = 'deprecation-crawler.config.json';
export const RAW_DEPRECATION_PATH = 'raw-deprecations.json';
export const TSCONFIG_PATH = 'tsconfig.deprecation-crawler.json';
export const DEFAULT_DEPRECATION_MSG_TOKEN = '@deprecated';
export const DEFAULT_COMMIT_MESSAGE =
  'docs(deprecation-manager): sync deprecations';

export const enum CRAWLER_MODES {
  'SANDBOX' = 'SANDBOX_MODE',
}
