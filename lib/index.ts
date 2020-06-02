import { getConfig } from "./config";

import { crawlDeprecation } from "./morph";
import { checkout } from "./checkout";
import {
  addCommentToRepository,
  generateMarkdown,
  generateRawJson,
} from "./output-formatters/";

(async () => {
  const config = await getConfig();
  const tagDate = await checkout(config);

  const deprecations = crawlDeprecation(config);

  addCommentToRepository(config, deprecations);
  generateMarkdown(config, deprecations, { tagDate });
  generateRawJson(config, deprecations, { tagDate });
})();
