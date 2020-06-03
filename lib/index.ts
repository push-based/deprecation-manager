import { getConfig } from "./config";

import { crawlDeprecations } from "./crawler";
import { checkout } from "./checkout";
import {
  addCommentToRepository,
  generateMarkdown,
  generateRawJson,
} from "./output-formatters/";

(async () => {
  const config = await getConfig();
  const tagDate = await checkout(config);

  const deprecations = crawlDeprecations(config);

  addCommentToRepository(config, deprecations);
  generateMarkdown(config, deprecations, { tagDate });
  generateRawJson(config, deprecations, { tagDate });
})();
