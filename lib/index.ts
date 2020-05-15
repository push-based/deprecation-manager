import { getConfig } from "./config";
import { crawl } from "./crawler";
import { prefill } from "./prefill";

(async () => {
  const config = await getConfig();
  await crawl(config);
  await prefill(config);
})();
