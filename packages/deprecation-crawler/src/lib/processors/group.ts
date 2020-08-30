import { EOL } from 'os';
import { prompt } from 'enquirer';
import {
  CrawlConfig,
  CrawledRelease,
  CrawlerProcess,
  Deprecation,
} from '../models';
import { concat, tap, toFileName, updateRepoConfig } from '../utils';
import { generateRawJson } from '../output-formatters';
import { UNGROUPED_GROUP_NAME } from '../constants';
import {
  printFooterLine,
  printHeadline,
  printProgress,
  ProcessFeedback,
} from '../log';
import * as kleur from 'kleur';

const ESCAPE_GROUPING_ANSWER = 'Stop grouping';
const CREATE_NEW_GROUP_ANSWER = 'Create new group';

interface Group {
  key: string;
  matchers: string[];
}

export function group(config: CrawlConfig): CrawlerProcess {
  return concat([
    async (r) => ({
      ...r,
      ...(await addGrouping(config, r)),
    }),
    tap((r) => generateRawJson(config, r)),
  ]);
}

export async function addGrouping(
  config: CrawlConfig,
  crawledRelease: CrawledRelease
): Promise<CrawledRelease> {
  const groupFeedback = getGroupFeedback();
  groupFeedback.printStart(config, crawledRelease);
  const { groups } = config as { groups: Group[] };
  const deprecationsWithGroup: Deprecation[] = [];

  let escapeGrouping = false;
  for (const deprecation of crawledRelease.deprecations) {
    const deprecationHasExistingGroup = checkForExistingGroup(
      groups,
      deprecation
    );

    if (deprecationHasExistingGroup) {
      deprecationsWithGroup.push({
        ...deprecation,
        group: deprecationHasExistingGroup,
      });
      continue;
    }

    if (escapeGrouping) {
      continue;
    }
    const groupKey = await getGroupNameFromExistingOrInputQuestion(
      deprecation,
      [
        ESCAPE_GROUPING_ANSWER,
        CREATE_NEW_GROUP_ANSWER,
        ...getGroupNames(groups),
      ]
    );

    if (groupKey === ESCAPE_GROUPING_ANSWER || escapeGrouping) {
      escapeGrouping = true;
      continue;
    }

    const answerRegex: { regexp: string } = await prompt([
      getGroupRegexQuestion(),
    ]);
    const parsedRegex = answerRegex.regexp;
    const group = groups.find((g) => g.key === groupKey);

    // Don't store RegExp because they are not serializable
    if (group) {
      // don't push empty regex
      if (parsedRegex !== '') {
        group.matchers.push(parsedRegex);
      }
    } else {
      groups.push({
        key: groupKey || UNGROUPED_GROUP_NAME,
        matchers: parsedRegex !== '' ? [parsedRegex] : [],
      });
    }

    deprecationsWithGroup.push({
      ...deprecation,
      group: groupKey,
    });
  }

  const newConfig = { ...config, groups };
  updateRepoConfig(newConfig);

  const newCrawledRelease = {
    ...crawledRelease,
    deprecations: deprecationsWithGroup,
  };
  groupFeedback.printEnd(newConfig, newCrawledRelease);

  return newCrawledRelease;
}

function getGroupFeedback(): ProcessFeedback {
  return {
    printStart: (): void => {
      printHeadline('GROUPING PHASE');
      console.log(kleur.gray('⚙️ Start grouping of deprecations.'));
      console.log('');
    },
    printEnd(config: CrawlConfig, rawRelease: CrawledRelease): void {
      const numAllDeprecations = rawRelease.deprecations.length;
      const numAllGroups = config.groups.length;
      console.log('✓  Grouping is done!');
      console.log(
        `Grouped ${numAllDeprecations} deprecations in ${numAllGroups} files.`
      );

      config.groups.forEach((group) => {
        printProgress('');
        console.log(`Group: ${group.key}`);
        console.log(`Matchers: ${group.matchers.length}`);
        console.log(
          `Deprecations: ${
            rawRelease.deprecations.filter((d) => d.group === group.key).length
          }`
        );
      });
      printFooterLine();
    },
  };
}

function getGroupNames(groups: { key: string }[]): string[] {
  return [
    UNGROUPED_GROUP_NAME,
    ...groups.map((g) => g.key).filter((k) => k !== UNGROUPED_GROUP_NAME),
  ];
}

function checkForExistingGroup(groups: Group[], deprecation: Deprecation) {
  return groups.find((group) => {
    // If matchers are present test them else return false
    return group.matchers.length
      ? group.matchers.some((reg) =>
          testMessage(reg, deprecation.deprecationMessage)
        )
      : false;
  })?.key;
}

async function getGroupNameFromExistingOrInputQuestion(
  deprecation: Deprecation,
  groups: string[]
): Promise<string> {
  const answerNameFromExisting: { existingKey: string } = await prompt([
    getGroupNameFromExistingQuestion(deprecation, groups),
  ]);
  const isExistingGroup =
    answerNameFromExisting.existingKey !== CREATE_NEW_GROUP_ANSWER;
  return isExistingGroup
    ? answerNameFromExisting.existingKey
    : await prompt([
        getGroupNameQuestion(deprecation),
      ]).then((s: { key: string }) => toFileName(s.key));
}

function getGroupNameFromExistingQuestion(
  deprecation: Deprecation,
  groupChoices: string[]
) {
  return {
    // TODO: use autocomplete here? https://github.com/enquirer/enquirer/tree/master/examples/autocomplete
    // @Notice Problem: can't have a custom input that is not in choices
    type: 'select',
    name: 'existingKey',
    message:
      `Add group to deprecation?` +
      EOL +
      `${deprecation.path}#${deprecation.lineNumber}` +
      EOL +
      deprecation.deprecationMessage +
      EOL,
    initial: groupChoices[0],
    choices: groupChoices,
  };
}

function getGroupNameQuestion(deprecation: Deprecation) {
  return {
    type: 'input',
    name: 'key',
    message:
      `Add human readable group name to deprecation` +
      EOL +
      `${deprecation.path}#${deprecation.lineNumber}` +
      EOL +
      deprecation.deprecationMessage +
      EOL,
    initial: UNGROUPED_GROUP_NAME,
  };
}

function getGroupRegexQuestion() {
  return {
    type: 'input',
    name: 'regexp',
    message:
      `Which part of the deprecation message do you want to use as a matcher?` +
      EOL +
      ` Hint: regex string is allowed too.`,
  };
}

function testMessage(reg: string, deprecationMessage: string): boolean {
  return (
    reg &&
    new RegExp(parseDeprecationMessageOrRegex(reg)).test(
      parseDeprecationMessageOrRegex(deprecationMessage)
    )
  );
}

// Used for both, message and regex string.
// Otherwise it could happen that will never match
function parseDeprecationMessageOrRegex(deprecationMessage: string): string {
  return (
    deprecationMessage
      // check against lowercase to avoid multiple patterns
      .toLowerCase()
      // normalize multiple whitespaces to one
      .split(' ')
      .filter((s) => !!s)
      .join(' ')
      // tri trailing and leading white spaces
      .trim()
  );
}
