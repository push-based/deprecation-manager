import {
  Project,
  TypeElementTypes,
  CommentTypeElement,
  ClassMemberTypes,
  CommentClassElement,
  Statement,
} from "ts-morph";
import { isConstructorDeclaration, isVariableStatement } from "typescript";
import { CrawlConfig, Deprecation } from "./models";
import { DEPRECATION, DEPRECATIONLINK } from "./utils";
import { cwd } from "process";
import { resolve } from "path";

// What about https://ts-morph.com/details/documentation#js-docs ?
// Problem: can't find top level deprecations? e.g. merge

export function crawlDeprecations(config: CrawlConfig) {
  const project = new Project({
    tsConfigFilePath: config.tsConfigPath,
  });

  const sourceFiles = project.getSourceFiles();

  const deprecations = sourceFiles
    // TODO: seems like these files cannot be parsed correctly?
    .filter((file) => !file.getFilePath().includes("/Observable.ts"))
    .map((file) => {
      const path = resolve(file.getFilePath()).replace(resolve(cwd()), "");
      console.log(`🔎 Looking for deprecations in ${path.substr(1)}`);

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

      const deprecationsInFile = commentsInFile
        .map((p) => {
          return p.nodes
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
            .reduce((acc, val) => acc.concat(val), []);
        })
        .reduce((acc, val) => acc.concat(val), [])
        .filter(
          (c) =>
            c.comment.text.includes(DEPRECATION) &&
            !c.comment.text.includes(DEPRECATIONLINK)
        );

      return deprecationsInFile.map(
        (p): Deprecation => {
          let text = "DEPRECATION-TODO";

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

          return {
            path,
            lineNumber: p.node.getStartLineNumber(),
            name: [p.parent, text].filter(Boolean).join("."),
            kind: p.node.getKindName(),
            code: p.node.getText(),
            deprecationMessage: p.comment.text,
            pos: [
              p.comment.range.compilerObject.pos,
              p.comment.range.compilerObject.end,
            ],
          };
        }
      );
    })
    .reduce((acc, val) => acc.concat(val), []);

  return deprecations;
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
