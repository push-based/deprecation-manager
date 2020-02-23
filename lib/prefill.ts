import { CrawledRelease, RawMigrationReleaseItem } from "./crawled-releases.interface";
import { fillDeprecation, fillRelease } from "./utils";
import { promises as fs } from "fs";
import { Config } from "./config.interface";
import path from "path";

(async () => {
    const cfg: Config = await fs.readFile("./local.config.json").then(buffer => JSON.parse(buffer.toString()));
    const crawledReleases: CrawledRelease[] = await fs.readFile(path.join(cfg.outputPath, cfg.fileName)).then(buffer => JSON.parse(buffer.toString()));
    const filledOutputContent: RawMigrationReleaseItem[] = crawledReleases
      .map(r => fillRelease(r, {
        deprecations: r.deprecations.map(d => fillDeprecation(d as any, {}))
      }));
    await fs.writeFile(path.join(cfg.outputPath,"filled-" + cfg.fileName), JSON.stringify(filledOutputContent, null, 4));
    console.log('prefilled data');
})();
