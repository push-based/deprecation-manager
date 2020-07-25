import {
  Project,
  TypeElementTypes,
  CommentTypeElement,
  ClassMemberTypes,
  CommentClassElement,
  Statement,
  SourceFile,
} from "ts-morph";
import { isConstructorDeclaration, isVariableStatement } from "typescript";
import { CrawlConfig, Deprecation } from "./models";
import { DEPRECATION, DEPRECATIONLINK, readFile } from "./utils";
import { cwd } from "process";
import { resolve, normalize } from "path";
import { existsSync } from "fs";
import { prompt } from "enquirer";
import { findTsConfigFiles } from "./config";

// What about https://ts-morph.com/details/documentation#js-docs ?
// Problem: can't find top level deprecations? e.g. merge

export async function crawlDeprecations(config: CrawlConfig) {
  const sourceFiles = await getSourceFiles(config);

  const deprecations = sourceFiles
    // TODO: seems like these files cannot be parsed correctly?
    .filter((file) => !file.getFilePath().includes("/Observable.ts"))
    .map((file) => crawlFileForDeprecations(file))
    .reduce((acc, val) => acc.concat(val), []);

  return deprecations;
}

function crawlFileForDeprecations(file: SourceFile) {
  try {
    const path = resolve(file.getFilePath())
      .replace(resolve(cwd()), "")
      // remove slash
      .substr(1);
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
      .filter(
        (c) =>
          c.comment.text.includes(DEPRECATION) &&
          !c.comment.text.includes(DEPRECATIONLINK)
      );

    return deprecationsInFile.map(
      (p): Deprecation => {
        let nodeText = getHumanReadableNameForNode();

        return {
          path,
          lineNumber: p.node.getStartLineNumber(),
          name: [p.parent, nodeText].filter(Boolean).join("."),
          kind: p.node.getKindName(),
          code: p.node.getText(),
          deprecationMessage: p.comment.text,
          pos: [
            p.comment.range.compilerObject.pos,
            p.comment.range.compilerObject.end,
          ],
        };

        function getHumanReadableNameForNode() {
          let text =
            "DEPRECATION-TODO, open an issue at https://github.com/timdeschryver/find-deprecations/issues/new";

          if (
            "name" in p.node.compilerNode &&
            typeof p.node.compilerNode.name.getText === "function"
          ) {
            text = p.node.compilerNode.name.getText();
          } else if (
            isVariableStatement(p.node.compilerNode) &&
            p.node.compilerNode.declarationList.declarations[0]
          ) {
            text = p.node.compilerNode.declarationList.declarations[0].name.getText();
          } else if (isConstructorDeclaration(p.node.compilerNode)) {
            text = "constructor";
          }

          return text;
        }
      }
    );
  } catch (err) {
    console.error(err);
  }
}

function getNodesWithCommentsForFile(file: SourceFile) {
  const statements = file
    .getStatementsWithComments()
    .map((c): NodesWithComment => ({ parent: "", nodes: [c] }));

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
    throw Error("We need a ts config path to be able to crawl");
  }

  if (existsSync(config.tsConfigPath)) {
    project.addSourceFilesFromTsConfig(config.tsConfigPath);
  } else {
    const { tsConfigPath } = await prompt([
      {
        type: "select",
        name: "tsConfigPath",
        message: `tsconfig "${config.tsConfigPath}" does not exist, let's try again`,
        choices: findTsConfigFiles(),
        format(value) {
          return value ? normalize(value) : "";
        },
      },
    ]);
    project.addSourceFilesFromTsConfig(tsConfigPath);
  }

  return project.getSourceFiles();
}

function getDefaultGlob() {
  let ignore = ["!./node_modules/**"];
  const gitignore = readFile("./.gitignore");
  ignore.push(
    // remove empty entries and comments
    ...gitignore.split(/\r?\n/).filter((p) => p && !p.startsWith("#"))
  );
  return ["./**/*{.ts,.js}", ...ignore];
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
