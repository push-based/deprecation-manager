import { Project } from "ts-morph";
import { CrawlConfig, Deprecation } from "../models";
import { hash, EOL, DEPRECATIONLINK, DEPRECATION } from "../utils";
import { cwd } from "process";
import { join } from "path";

export function addCommentToRepository(
  config: CrawlConfig,
  rawDeprecations: Deprecation[]
) {
  if (rawDeprecations.length === 0) {
    console.log("🎉 All deprecations are resolved, no changes have to be made");
    return;
  }

  const project = new Project({
    tsConfigFilePath: config.tsConfigPath,
  });

  const deprecationsByFile = rawDeprecations.reduce((acc, val) => {
    acc[val.path] = (acc[val.path] || []).concat(val);
    return acc;
  }, {} as { [filePath: string]: Deprecation[] });

  Object.entries(deprecationsByFile).forEach(([path, deprecations]) => {
    console.log(`🔧 ${path}`);

    let addedPosForText = 0;

    const sorted = deprecations.sort((a, b) => (a.pos[0] > b.pos[0] ? 1 : -1));

    sorted.forEach((deprecation) => {
      const filePath = join(cwd(), path);

      const sourceFile = project.getSourceFile(filePath);
      const deprecationDetails = ` Details: {@link ${DEPRECATIONLINK}#${hash(
        deprecation.code
      )}}`;

      const lines = deprecation.deprecationMessage.split(EOL);
      const newText = lines
        .map((text) => {
          if (text.includes(DEPRECATION)) {
            if (text.endsWith(" */")) {
              return text.replace(" */", `${deprecationDetails} */`);
            }
            if (text.endsWith("*/")) {
              return text.replace("*/", `${deprecationDetails}*/`);
            }
            return text + deprecationDetails;
          }
          return text;
        })
        .join(EOL);

      sourceFile.replaceText(
        deprecation.pos.map((pos) => pos + addedPosForText) as [number, number],
        newText
      );
      addedPosForText += deprecationDetails.length;

      sourceFile.saveSync();
    });
  });
}
