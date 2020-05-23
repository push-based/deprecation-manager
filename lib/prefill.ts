// import { CrawledRelease, RawMigrationReleaseItem, CrawlConfig } from "./models";
// import { fillDeprecation, fillRelease } from "./utils";
// import { promises as fs } from "fs";
// import path from "path";

// export async function prefill(config: CrawlConfig) {
//   const crawledReleases: CrawledRelease[] = await fs
//     .readFile(config.outputFile)
//     .then((buffer) => JSON.parse(buffer.toString()));
//   const filledOutputContent: RawMigrationReleaseItem[] = crawledReleases.map(
//     (r) =>
//       fillRelease(r, {
//         deprecations: r.deprecations.map((d) => fillDeprecation(d as any, {})),
//       })
//   );
//   await fs.writeFile(
//     path.join(
//       path.dirname(config.outputFile),
//       "filled-" + path.basename(config.outputFile)
//     ),
//     JSON.stringify(filledOutputContent, null, 4)
//   );
// }
