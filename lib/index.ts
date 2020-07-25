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

  await addCommentToRepository(config, deprecations);

  const processors = [addGrouping, addUniqueKey];
  const processedDeprecations = (await processors.reduce(
    async (deps, processor) => await processor(config, await deps),
    Promise.resolve(deprecations)
  )) as Deprecation[];

  const outputs = [generateMarkdown, generateRawJson];
  for (const output of outputs) {
    await output(config, processedDeprecations, { tagDate });
  }
})();
