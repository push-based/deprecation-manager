import { getConfig } from "./config";

import { Deprecation } from "./models";
import { crawlDeprecations } from "./crawler";
import { checkout } from "./checkout";

import { addGrouping } from "./processors/grouping";
import { addUniqueKey } from "./processors/unique";
import {
  addCommentToRepository,
  generateMarkdown,
  generateRawJson,
} from "./output-formatters/";

(async () => {
  const config = await getConfig();
  const tagDate = await checkout(config);

  const deprecations = await crawlDeprecations(config);

  // Crawling Phase
  const crawlingPhaseProcessors = [addUniqueKey, addCommentToRepository];
  const processedCrawledDeprecations = (await crawlingPhaseProcessors.reduce(
    async (deps, processor) => await processor(config, await deps),
    Promise.resolve(deprecations)
  )) as Deprecation[];
  await generateRawJson(config, processedCrawledDeprecations, { tagDate });

  // Grouping Phase
  const groupingPhaseProcessors = [addGrouping];
  const processedGroupedDeprecations = (await groupingPhaseProcessors.reduce(
    async (deps, processor) => await processor(config, await deps),
    Promise.resolve(deprecations)
  )) as Deprecation[];
  await generateMarkdown(config, processedGroupedDeprecations, { tagDate });

})();
