import { CrawlConfig, Deprecation } from "../models";
import { readFile } from "../utils";
import { writeFileSync } from "fs";
import * as path from "path";

// @TODO consider the content to update within the comments
const MD_GROUP_OPENER = "<!-- ruid -->";
const MD_GROUP_CLOSER = "<!-- ruidstop -->";

export function updateMd(config: CrawlConfig,
                                       rawDeprecations: Deprecation[]): void {


  console.log("Start update groups", rawDeprecations);

  config.groups.forEach(g => updateGroupsInMarkdown(path.join(config.outputDirectory, g.key+'.md'), rawDeprecations.filter(d => d.group === g.key)));

  console.log("Groups updated");
}


export function updateGroupsInMarkdown(filePath: string,
                                       rawDeprecations: Deprecation[]): void {

  console.log("Start update groups in ", filePath);

  const fileContent: string = readFile(filePath);

  const newlines = "";

  const sections = splitMulti(fileContent, [MD_GROUP_OPENER, MD_GROUP_CLOSER]);
  console.log("sections", sections, sections.length);

  if (sections.length > 3) {
    throw new Error("markdown-ruids only supports one list of RUIDs per file.");
  }
  if (sections.length !== 1 && sections.length !== 3) {
    console.log(sections);
    throw new Error("Something is wrong with the RIUD groups in the md file");
  }

  const updatedSections = [
    MD_GROUP_OPENER,
    getDeprecationList(rawDeprecations),
    MD_GROUP_CLOSER,
    sections.length === 1 ? sections[0] : sections[2]
  ];

  const newMd = updatedSections.join("\n\n") + newlines;

  writeFileSync(filePath, newMd);
  console.log("Groups updated");
}

function getDeprecationList(deprecations: Deprecation[]): string {
  console.log('deprecations', deprecations);
  return deprecations.map(d => d.path).join("/n");
}

function split(str, re): string[] {
  return str.split(re).map(trim);
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
