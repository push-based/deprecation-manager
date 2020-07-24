import { EOL } from "os";
import { prompt } from "enquirer";
import { CrawlConfig, Deprecation } from "../models";
import { updateRepoConfig } from "../utils";


const ungrouped = 'ungrouped';
export async function addGrouping(
  config: CrawlConfig,
  rawDeprecations: Deprecation[]
): Promise<Deprecation[]> {
  if (rawDeprecations.length === 0) {
    return rawDeprecations;
  }

  console.log("Adding grouping to deprecations...");
  let { groups } = config;

  let deprecationsWithGroup: Deprecation[] = [];

  for (const deprecation of rawDeprecations) {
    const deprecationHasExistingGroup = groups.find((group) => {
      // If matchers are present test them else return false
      return group.matchers.length ?
        group.matchers.some(
        (reg) => reg && new RegExp(reg).test(deprecation.deprecationMessage)
      ) : false;
    })?.key;

    if (deprecationHasExistingGroup) {
      deprecationsWithGroup.push({
        ...deprecation,
        group: deprecationHasExistingGroup,
      });
      continue;
    }

    const answer: { key: string; regexp: string } = await prompt([
      {
        // TODO: use autocomplete here? https://github.com/enquirer/enquirer/tree/master/examples/autocomplete
        // Problem: can't have a custom input that is not in choices
        type: "input",
        name: "key",
        message:
          `Add group to deprecation ${deprecation.path}#${deprecation.lineNumber}` +
          EOL +
          deprecation.deprecationMessage +
          EOL,
        initial: ungrouped
      },
      {
        type: "input",
        name: "regexp",
        message: "Add regexp to group",
      },
    ]);

    const group = groups.find((g) => g.key === answer.key);

    // Don't store RegExp because they are not serializable
    if (group) {
      // don't push empts regex
      if(answer.regexp !== '') {
        group.matchers.push(answer.regexp);
      }
    } else {
      groups.push({
        key: answer["key"] || ungrouped ,
        matchers: answer.regexp !== '' ? [answer.regexp] : [],
      });
    }

    deprecationsWithGroup.push({
      ...deprecation,
      group: answer["key"],
    });
  }

  updateRepoConfig({ ...config, groups });
  return deprecationsWithGroup;
}
