import { getConfig } from "./config";

import { crawlDeprecation, addCommentToCode, generateMarkdown } from "./morph";
import { checkout } from "./checkout";
import { CrawlConfig } from "./models";
import { normalize } from "path";

(async () => {
  const config: CrawlConfig = {
    gitTag: "master",
    outputDirectory: "./deprecations",
    tsConfigPath: normalize(
      "C:\\Users\\tdeschryver\\dev\\forks\\rxjs\\src\\tsconfig.base.json"
    ),
  };
  const tagDate = await checkout(config);

  const deprecations = crawlDeprecation(config);
  addCommentToCode(config, deprecations);
  generateMarkdown(config, deprecations, { tagDate });
})();
