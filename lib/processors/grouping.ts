import { CrawlConfig, Deprecation } from "../models";
import { prompt } from "enquirer";
import { EOL } from "os";

export async function addGrouping(
  config: CrawlConfig,
  rawDeprecations: Deprecation[]
) {
  if (rawDeprecations.length === 0) {
    return;
  }

  console.log("Adding grouping to deprecations...");
  let groups: { key: string; regexp: RegExp[] }[] = [
    {
      key: "Internal implementation detail",
      regexp: [/internal implementation detail/i, /exposed API/i],
    },
    {
      key: "Result selector",
      regexp: [
        /resultSelector is no longer supported/i,
        /resultSelector no longer supported/i,
      ],
    },
    {
      key: "Observer callback",
      regexp: [/complete callback/i, /error callback/i],
    },
    {
      key: "With",
      regexp: [
        /use {@link (zipWith|combineLatestWith|concatWith|mergeWith|raceWith)}/i,
      ],
    },
    {
      key: "Removal in future",
      regexp: [/will be removed at some point in the future/i],
    },
    {
      key: "Scheduler",
      regexp: [/Passing a scheduler here is deprecated/i],
    },
    {
      key: "Array",
      regexp: [/Pass arguments in a single array instead/i],
    },
  ];

  for (const deprecation of rawDeprecations) {
    const groupKey = groups.find((group) => {
      return group.regexp.some((reg) =>
        reg.test(deprecation.deprecationMessage)
      );
    })?.key;
    if (groupKey) {
      deprecation.group = groupKey;
      continue;
    }

    const answer = await prompt([
      {
        type: "input",
        name: "key",
        message:
          `Add group to deprecation ./${deprecation.path.replace(
            "\\\\",
            "/"
          )}: ` +
          EOL +
          deprecation.deprecationMessage,
      },
      {
        type: "input",
        name: "regexp",
        message: "Add regexp to group",
      },
    ]);

    const group = groups.find((g) => g.key === answer["key"]);
    if (group) {
      group.regexp.push(new RegExp(answer["regexp"], "i"));
    } else {
      groups.push({
        key: answer["key"],
        regexp: [new RegExp(answer["regexp"], "i")],
      });
    }
    deprecation.group = answer["key"];
  }
}
