import { writeFileSync } from "fs";
import { basename, join } from "path";
import { CrawlConfig, Deprecation } from "../models";
import { ensureDirExists, EOL, hash } from "../utils";

export function generateMarkdown(
  config: CrawlConfig,
  rawDeprecations: Deprecation[],
  options: { tagDate: string }
) {
  if (rawDeprecations.length === 0) {
    console.log(
      "🎉 All deprecations are resolved, no markdown have to be generated"
    );
    return;
  }

  console.log("📝 Generating markdown");

  const deprecationsByFile = rawDeprecations.reduce((acc, val) => {
    acc[val.path] = (acc[val.path] || []).concat(val);
    return acc;
  }, {} as { [filePath: string]: Deprecation[] });

  const pagesInMd = Object.entries(deprecationsByFile).map(
    ([path, deprecations]) => {
      const sorted = deprecations.sort((a, b) =>
        a.deprecationPos[0] > b.deprecationPos[0] ? 1 : -1
      );

      return [`## ${basename(path)}`, ""]
        .concat(
          sorted.map((deprecation) => {
            return [
              `### ${deprecation.name} (${deprecation.kind}) {" #${hash(
                deprecation.code
              )}}`,
              "",
              stripComment(deprecation.deprecationMessage),
              "",
              "```ts",
              deprecation.code,
              "```",
            ].join(EOL);
          })
        )
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
}

function stripComment(message: string) {
  return message.replace("/**", "").replace("*/", "").replace(/\*/g, "").trim();
}
