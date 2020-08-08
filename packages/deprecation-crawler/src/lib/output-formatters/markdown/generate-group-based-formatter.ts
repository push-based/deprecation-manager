import { CrawlConfig, Deprecation } from "../../models";
import { readFile } from "../../utils";
import { writeFileSync } from "fs";
import * as path from "path";
import { EOL } from "os";

// @TODO consider the content to update within the comments
const MD_GROUP_OPENER = "<!-- ruid-groups";
const MD_GROUP_CLOSER = "ruid-groups -->";

export async function generateGroupBasedFormatter(config: CrawlConfig,
                               rawDeprecations: Deprecation[]): Promise<void> {

  console.log("Start update groups", rawDeprecations);

  config.groups.forEach(g => {
    updateMd(config, g, rawDeprecations);
  });

  console.log("Groups updated");
}


export async function updateMd(config: CrawlConfig,
                                                  group: { key: string, matchers: string[] },
                                                  rawDeprecations: Deprecation[]): Promise<void> {

  const groupedDeprecationsByFileAndTag = rawDeprecations
    .filter(deprecation => deprecation.group === group.key)
    .reduce((tags, deprecation) => {
      return {
        ...tags,
        [deprecation.version]: [...tags[deprecation.version] || [], deprecation]
      };
    }, {});


  const filePath = path.join(config.outputDirectory, group.key + ".md");
  const fileContent: string = readFile(filePath);

  const newlines = "";

  const sections = splitMulti(fileContent, [MD_GROUP_OPENER, MD_GROUP_CLOSER]).map(trim);
  console.log("sections", sections, sections.length);

  if (sections.length > 3) {
    throw new Error("markdown-ruids only supports one list of RUIDs per file.");
  }
  if (sections.length !== 1 && sections.length !== 3) {
    throw new Error("Something is wrong with the RIUD groups in the md file");
  }

  const updatedSections = [
    MD_GROUP_OPENER,
    await getDeprecationList(groupedDeprecationsByFileAndTag),
    MD_GROUP_CLOSER,
    sections.length === 1 ? sections[0] : sections[2]
  ];

  const newMd = updatedSections.join(EOL + EOL) + newlines;
  writeFileSync(filePath, newMd);
}

async function getDeprecationList(groupedDeprecations: { [version: string]: Deprecation[] }): Promise<string> {
  const repoUrl = "https://github.com/timdeschryver/deprecation-manager";
  return Object.entries(groupedDeprecations).map(([version, deprecations]) => {
    return `- ${version}: ` +
      EOL +
      deprecations.map(d => `  - ${getLink(d, repoUrl)}`).join(EOL);
  }).join(EOL);

  function getLink(deprecation: Deprecation, repoUrl: string): string {
    const treeName = deprecation.version;
    return `${repoUrl}/tree/${treeName}/${deprecation.path}#${deprecation.lineNumber}`;
  }
}

function splitMulti(str, tokens) {
  const tempChar = tokens[0]; // We can use the first token as a temporary join character
  for (let i = 1; i < tokens.length; i++) {
    str = str.split(tokens[i]).join(tempChar);
  }
  str = str.split(tempChar);
  return str;
}

function trim(str): string {
  return str.trim();
}
