import { EOL } from 'os';
import { builtInFormatter } from '../../output-formatters';
import { CRAWLER_CONFIG_PATH } from '../../constants';
import { CrawlConfig } from '../../models';

export async function ensureFormatter(
  config: CrawlConfig
): Promise<CrawlConfig> {
  if (config.outputFormatters.length <= 0) {
    throw new Error(`No formatter registered! ${EOL}
    builtInFormatter: ${Object.keys(builtInFormatter).join(', ')}${EOL}
    Add outputFormatters to ${CRAWLER_CONFIG_PATH}.`);
  }

  const configuredAndExistingFormatter = Object.entries(builtInFormatter)
    // Run only registered formatters
    .filter(([formatterKey]) => config.outputFormatters.includes(formatterKey))
    .map(([formatterKey]) => formatterKey);

  if (configuredAndExistingFormatter.length <= 0) {
    throw new Error(`No registered formatter available! ${EOL}
    registered formatter: ${config.outputFormatters.join(', ')}${EOL}
    Update outputFormatters to ${CRAWLER_CONFIG_PATH} with existing formatters.`);
  }

  const wrongFormatter = configuredAndExistingFormatter.filter(
    (key) => !Object.keys(builtInFormatter).includes(key)
  );
  if (wrongFormatter.length > 0) {
    throw new Error(`Wrong formatter registered! ${EOL}
    Following formatter are not available: ${wrongFormatter.join(', ')}${EOL}
    Available formatters: ${Object.keys(builtInFormatter).join(', ')}${EOL}
    Update outputFormatters to ${CRAWLER_CONFIG_PATH} with correct formatters.`);
  }

  return await {
    ...config,
    outputFormatters: configuredAndExistingFormatter,
  };
}
