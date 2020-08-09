import {
  ClassMemberTypes,
  CommentClassElement,
  CommentTypeElement,
  Project,
  SourceFile,
  Statement,
  TypeElementTypes,
} from 'ts-morph';
import { isConstructorDeclaration, isVariableStatement } from 'typescript';
import { CrawlConfig, Deprecation } from './models';
import { normalize, relative } from 'path';
import { existsSync } from 'fs';
import { prompt } from 'enquirer';
import { findTsConfigFiles } from './config';
import { getRemoteUrl } from "./output-formatters/markdown/generate-group-based-formatter";

// What about https://ts-morph.com/details/documentation#js-docs ?
// Problem: can't find top level deprecations? e.g. merge

export async function crawlDeprecations(config: CrawlConfig) {
  const sourceFiles = await getSourceFiles(config);
  const remoteUrl = await getRemoteUrl();
  const deprecations = sourceFiles
    // TODO: seems like these files cannot be parsed correctly?
    .filter((file) => !file.getFilePath().includes('/Observable.ts'))
    .map((file) => crawlFileForDeprecations(file, config, remoteUrl))
    .reduce((acc, val) => acc.concat(val), []);

  return deprecations;
}

function crawlFileForDeprecations(file: SourceFile, config: CrawlConfig, remoteUrl: string) {
  try {
    const path = relative(process.cwd(), file.getFilePath());
    console.log(`🔎 Looking for deprecations in ${path}`);
    const commentsInFile = getNodesWithCommentsForFile(file);
    const deprecationsInFile = commentsInFile
      .map((p) =>
        p.nodes
          .map((n) =>
            n.getLeadingCommentRanges().map((range) => ({
              parent: p.parent,
              node: n,
              comment: {
                range,
                text: range.getText(),
              },
            }))
          )
          .reduce((acc, val) => acc.concat(val), [])
      )
      .reduce((acc, val) => acc.concat(val), [])
      .filter((c) => isNewDeprecation(c.comment.text));

    return deprecationsInFile.map(
      (deprecation): Deprecation => {
        const nodeText = getHumanReadableNameForNode();

        return {
          path,
          lineNumber: deprecation.node.getStartLineNumber(),
          name: [deprecation.parent, nodeText].filter(Boolean).join('.'),
          kind: deprecation.node.getKindName(),
          code: deprecation.node.getText(),
          deprecationMessage: deprecation.comment.text,
          pos: [
            deprecation.comment.range.compilerObject.pos,
            deprecation.comment.range.compilerObject.end,
          ],
          version: config.gitTag,
          remoteUrl
        };

        function getHumanReadableNameForNode() {
          let text =
            'DEPRECATION-TODO, unknown node, open an issue at https://github.com/timdeschryver/deprecation-manager/issues/new';

          if (
            'name' in deprecation.node.compilerNode &&
            typeof deprecation.node.compilerNode.name.getText === 'function'
          ) {
            text = deprecation.node.compilerNode.name.getText();
          } else if (
            isVariableStatement(deprecation.node.compilerNode) &&
            deprecation.node.compilerNode.declarationList.declarations[0]
          ) {
            text = deprecation.node.compilerNode.declarationList.declarations[0].name.getText();
          } else if (isConstructorDeclaration(deprecation.node.compilerNode)) {
            text = 'constructor';
          }

          return text;
        }
      }
    );
  } catch (err) {
    console.error(err);
  }

  function isNewDeprecation(comment: string) {
    return (
      comment.includes(config.deprecationComment) &&
      !comment.includes(config.deprecationLink)
    );
  }
}

function getNodesWithCommentsForFile(file: SourceFile) {
  const statements = file
    .getStatementsWithComments()
    .map((c): NodesWithComment => ({ parent: '', nodes: [c] }));

  const classMembers = file.getClasses().map(
    (c): NodesWithComment => ({
      parent: c.getName(),
      nodes: c.getMembersWithComments(),
    })
  );

  const interfaceMembers = file.getInterfaces().map(
    (c): NodesWithComment => ({
      parent: c.getName(),
      nodes: c.getMembersWithComments(),
    })
  );

  const commentsInFile: NodesWithComment[] = [
    ...statements,
    ...classMembers,
    ...interfaceMembers,
  ];
  return commentsInFile;
}

async function getSourceFiles(config: CrawlConfig) {
  const project = new Project();

  if (!config.tsConfigPath) {
    throw Error('We need a ts config path to be able to crawl');
  }

  if (existsSync(config.tsConfigPath)) {
    project.addSourceFilesFromTsConfig(config.tsConfigPath);
  } else {
    const { tsConfigPath } = await prompt([
      {
        type: 'select',
        name: 'tsConfigPath',
        message: `tsconfig "${config.tsConfigPath}" does not exist, let's try again`,
        choices: findTsConfigFiles(),
        format(value) {
          return value ? normalize(value) : '';
        },
      },
    ]);
    config.tsConfigPath = tsConfigPath;
    project.addSourceFilesFromTsConfig(tsConfigPath);
  }

  return project.getSourceFiles();
}

interface NodesWithComment {
  parent: string;
  nodes: (
    | Statement
    | TypeElementTypes
    | CommentTypeElement
    | ClassMemberTypes
    | CommentClassElement
  )[];
}
