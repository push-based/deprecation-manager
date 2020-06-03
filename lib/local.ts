import { crawlDeprecations } from "./crawler";
import { checkout } from "./checkout";
import { CrawlConfig } from "./models";
import { normalize } from "path";
import {
  addCommentToRepository,
  generateMarkdown,
  generateRawJson,
} from "./output-formatters/";

(async () => {
  const config: CrawlConfig = {
    gitTag: "master",
    outputDirectory: "./deprecations",
    tsConfigPath: normalize("..\\..\\..\\rxjs\\src\\tsconfig.base.json"),
  };
  const tagDate = await checkout(config);

  const deprecations = crawlDeprecations(config);

  addCommentToRepository(config, deprecations);
  generateMarkdown(config, deprecations, { tagDate });
  generateRawJson(config, deprecations, { tagDate });
})();
