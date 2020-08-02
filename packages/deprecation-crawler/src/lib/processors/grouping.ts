import { EOL } from 'os';
import { prompt } from 'enquirer';
import { CrawlConfig, Deprecation } from '../models';
import { updateRepoConfig } from '../utils';

const ungrouped = 'ungrouped';

interface Group {
  key: string;
  matchers: string[];
}

export async function addGrouping(
  config: CrawlConfig,
  crawledDeprecations: Deprecation[]
): Promise<Deprecation[]> {
  if (crawledDeprecations.length === 0) {
    return crawledDeprecations;
  }

  console.log('Start grouping deprecations...');
  const { groups } = config as { groups: Group[] };
  const deprecationsWithGroup: Deprecation[] = [];

  for (const deprecation of crawledDeprecations) {
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

    const groupKey = await getGroupNameFromExistingOrInputQuestion(
      deprecation,
      getGroupNames(groups, ungrouped)
    );
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
        key: groupKey || ungrouped,
        matchers: parsedRegex !== '' ? [parsedRegex] : [],
      });
    }

    deprecationsWithGroup.push({
      ...deprecation,
      group: groupKey,
    });
  }

  updateRepoConfig({ ...config, groups });
  return deprecationsWithGroup;
}

function getGroupNames(
  groups: { key: string }[],
  ungroupedKey: string
): string[] {
  return [
    ungroupedKey,
    ...groups.map((g) => g.key).filter((k) => k !== ungroupedKey),
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
  groups: string[],
  newGroupChoice = 'Create new group'
): Promise<string> {
  const answerNameFromExisting: { existingKey: string } = await prompt([
    getGroupNameFromExistingQuestion(
      deprecation,
      [newGroupChoice, ...groups],
      newGroupChoice
    ),
  ]);
  const isExistingGroup = answerNameFromExisting.existingKey !== newGroupChoice;
  return isExistingGroup
    ? answerNameFromExisting.existingKey
    : await prompt([getGroupNameQuestion(deprecation)]).then(
        (s: { key: string }) => s.key
      );
}

function getGroupNameFromExistingQuestion(
  deprecation: Deprecation,
  groupChoices: string[],
  defaultKey: string
) {
  return {
    // TODO: use autocomplete here? https://github.com/enquirer/enquirer/tree/master/examples/autocomplete
    // @Notice Problem: can't have a custom input that is not in choices
    type: 'select',
    name: 'existingKey',
    message:
      `Add human readable group name to deprecation` +
      EOL +
      `${deprecation.path}#${deprecation.lineNumber}` +
      EOL +
      deprecation.deprecationMessage +
      EOL,
    initial: defaultKey,
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
    initial: ungrouped,
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
