import { writeFileSync } from "fs";
import { basename, join } from "path";
import { CrawlConfig, Deprecation } from "../models";
import { ensureDirExists } from "../utils";
import { EOL } from "os";

export async function generateMarkdown(
  config: CrawlConfig,
  rawDeprecations: Deprecation[],
  options: { tagDate: string }
): Promise<Deprecation[]> {
  if (rawDeprecations.length === 0) {
    console.log(
      "🎉 All deprecations are resolved, no markdown have to be generated"
    );
    return;
  }

  console.log("📝 Generating markdown");

  const deprecationsByGroup = rawDeprecations.reduce((acc, val) => {
    const group = val.group || "";
    acc[group] = (acc[group] || []).concat(val);
    return acc;
  }, {} as { [group: string]: Deprecation[] });

  const pagesInMd = Object.entries(deprecationsByGroup).map(
    ([deprecationGroup, groupedDeprecations]) => {
      const deprecationsByFile = groupedDeprecations.reduce((acc, val) => {
        acc[val.path] = (acc[val.path] || []).concat(val);
        return acc;
      }, {} as { [filePath: string]: Deprecation[] });

      const deprecationsOrdered = Object.entries(deprecationsByFile).map(
        ([path, deprecations]) => {
          const sorted = deprecations.sort((a, b) =>
            a.pos[0] > b.pos[0] ? 1 : -1
          );

          return ["", `### ${basename(path)}`].concat(
            ...sorted.map((deprecation) => {
              return [
                "",
                `#### ${deprecation.name} (${deprecation.kind}) {#${deprecation.uuid}}`,
                "",
                stripComment(deprecation.deprecationMessage),
                "",
                "```ts",
                deprecation.code,
                "```",
              ];
            })
          );
        }
      );

      return [`## ${deprecationGroup}`]
        .concat(...deprecationsOrdered)
        .join(EOL);
    }
  );

  const markdownContent = [
    `# ${config.gitTag} (${options.tagDate})`,
    "",
    ...pagesInMd,
  ].join(EOL);

  ensureDirExists(config.outputDirectory);
  writeFileSync(
    join(config.outputDirectory, `${config.gitTag}.md`),
    markdownContent
  );
  return rawDeprecations;
}

function stripComment(message: string) {
  return message.replace("/**", "").replace("*/", "").replace(/\*/g, "").trim();
}
