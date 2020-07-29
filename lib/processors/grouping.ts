import { EOL } from "os";
import { prompt } from "enquirer";
import { CrawlConfig, Deprecation } from "../models";
import { updateRepoConfig } from "../utils";


const ungrouped = "ungrouped";

interface Group {
  key: string,
  matchers: string[]
}

export async function addGrouping(
  config: CrawlConfig,
  rawDeprecations: Deprecation[]
): Promise<Deprecation[]> {
  if (rawDeprecations.length === 0) {
    return rawDeprecations;
  }

  console.log("Adding grouping to deprecations...");
  let { groups } = config as { groups: Group[] };

  let deprecationsWithGroup: Deprecation[] = [];

  for (const deprecation of rawDeprecations) {
    const deprecationHasExistingGroup = groups.find((group) => {
      // If matchers are present test them else return false
      return group.matchers.length ?
        group.matchers.some((reg) => testMessage(reg, deprecation.deprecationMessage)) : false;
    })?.key;

    if (deprecationHasExistingGroup) {
      deprecationsWithGroup.push({
        ...deprecation,
        group: deprecationHasExistingGroup
      });
      continue;
    }

    const answer: { key: string; regexp: string } = await prompt([
      {
        // TODO: use autocomplete here? https://github.com/enquirer/enquirer/tree/master/examples/autocomplete
        // @Notice Problem: can't have a custom input that is not in choices
        type: "input",
        name: "key",
        message:
          `Add group name to deprecation ${deprecation.path}#${deprecation.lineNumber}` +
          EOL +
          deprecation.deprecationMessage +
          EOL +
          `Think of the headline of the grouping file. The string will be kebab cased and used as file name for the group.` +
          EOL +
          `An example for a name could be 'Internal implementation detail' the filename will be 'internal-implementation-detail.md` +
          EOL,
        initial: ungrouped
      },
      {
        type: "input",
        name: "regexp",
        message: `Which part of the deprecation message do you want to use as a matcher?` +
          EOL +
          ` Hint: regex string is allowed too.`
      }
    ]);

    const groupKey = answer.key.trim();
    const parsedRegex = parseDeprecationMessageOrRegex(answer.regexp);
    const group = groups.find((g) => g.key === groupKey);

    // Don't store RegExp because they are not serializable
    if (group) {

      // don't push empty regex
      if (parsedRegex !== "") {
        group.matchers.push(parsedRegex);
      }
    } else {
      groups.push({
        key: groupKey || ungrouped,
        matchers: parsedRegex !== "" ? [parsedRegex] : []
      });
    }

    deprecationsWithGroup.push({
      ...deprecation,
      group: groupKey
    });
  }

  updateRepoConfig({ ...config, groups });
  return deprecationsWithGroup;
}

function testMessage(reg: string, deprecationMessage: string): boolean {
  return reg && new RegExp(reg).test(parseDeprecationMessageOrRegex(deprecationMessage));
}

// Used for both, message and regex string.
// Otherwise it could happen that will never match
function parseDeprecationMessageOrRegex(deprecationMessage: string): string {
  return deprecationMessage
    // check against lowercase to avoid multiple patterns
    .toLowerCase()
    // normalize multiple whitespaces to one
    .split(" ").filter(s => !!s).join(" ")
    // tri trailing and leading white spaces
    .trim();
}