import { EOL } from "os";
import { prompt } from "enquirer";
import { CrawlConfig, Deprecation } from "../models";

export async function addGrouping(
  config: CrawlConfig,
  rawDeprecations: Deprecation[]
): Promise<Deprecation[]> {
  if (rawDeprecations.length === 0) {
    return rawDeprecations;
  }

  console.log("Adding grouping to deprecations...");
  let groups: { key: string; matches: RegExp[] }[] = [
    {
      key: "Internal implementation detail",
      matches: [/internal implementation detail/i, /exposed API/i],
    },
    {
      key: "Result selector",
      matches: [
        /resultSelector is no longer supported/i,
        /resultSelector no longer supported/i,
      ],
    },
    {
      key: "Observer callback",
      matches: [/complete callback/i, /error callback/i],
    },
    {
      key: "With",
      matches: [
        /use {@link (zipWith|combineLatestWith|concatWith|mergeWith|raceWith)}/i,
      ],
    },
    {
      key: "Removal in future",
      matches: [/will be removed at some point in the future/i],
    },
    {
      key: "Scheduler",
      matches: [/Passing a scheduler here is deprecated/i],
    },
    {
      key: "Array",
      matches: [/Pass arguments in a single array instead/i],
    },
  ];

  let deprecationsWithGroup: Deprecation[] = [];

  for (const deprecation of rawDeprecations) {
    const groupKey = groups.find((group) => {
      return group.matches.some((reg) =>
        reg.test(deprecation.deprecationMessage)
      );
    })?.key;

    if (groupKey) {
      deprecationsWithGroup.push({ ...deprecation, group: groupKey });
      continue;
    }

    const answer = await prompt([
      {
        type: "input",
        name: "key",
        message:
          `Add group to deprecation ${deprecation.path}#${deprecation.lineNumber}` +
          EOL +
          deprecation.deprecationMessage +
          EOL,
      },
      {
        type: "input",
        name: "regexp",
        message: "Add regexp to group",
      },
    ]);

    const group = groups.find((g) => g.key === answer["key"]);
    if (group) {
      group.matches.push(new RegExp(answer["regexp"], "i"));
    } else {
      groups.push({
        key: answer["key"],
        matches: [new RegExp(answer["regexp"], "i")],
      });
    }

    deprecationsWithGroup.push({
      ...deprecation,
      group: answer["key"],
    });
  }

  return deprecationsWithGroup;
}
