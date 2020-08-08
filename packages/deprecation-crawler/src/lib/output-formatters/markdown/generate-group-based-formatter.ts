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

  console.log('📝 Update group-based markdown format');

  config.groups.forEach(g => {
    updateGroupMd(config, g, rawDeprecations);
  });

  console.log('Updated group-based markdown format');
}

export async function updateGroupMd(config: CrawlConfig,
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
    sections.length === 1 ? sections[0] : sections[2],
    // We update already existing
    sections.length === 1 ? getInitialGroupContent(group.key) : ''
  ];

  const newMd = updatedSections.join(EOL + EOL) + newlines;
  writeFileSync(filePath, newMd);
}

function getInitialGroupContent(groupName: string) {

  return `
# ${groupName}

Some general information what all there deprecations have in common.

## Things affected by this Change:
- [methodName](url)
- [methodName](url)

## Reason
Short explanation of why the deprecation got introduced

## Implication
This section is an explanation that accompanies the 'before deprecation' and 'after deprecation' snippets.
It explains the different between the two versions to the user in a detailed way to help the user to spot the differences in code.
Make sure to also include estimations on when it breaks.

## Refactoring
Code example showing the situation before the deprecation, and after the deprecation including the versions.

Example:

> introduced in version 6.0.0-alpha4
> breaking in version 8.0.0

the following version specifier are set for the rxjs dependencies in StackBlitz:

**Example Before: <6.0.0-alpha4**
\`\`\`ts
// code here
\`\`\`

**Example After: >=6.0.0-alpha4 <8.0.0**
\`\`\`ts
// code here
\`\`\`
`
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
