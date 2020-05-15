import * as path from "path";
import * as fs from "fs";
import {
  TSESLint,
  TSESTree,
  AST_TOKEN_TYPES,
} from "@typescript-eslint/experimental-utils";
import * as parser from "@typescript-eslint/parser";
import { FoundDeprecation } from "./models";

export function lint() {
  const { linter, hits } = createLinter();
  for (const { filename, content } of visit(".")) {
    const messages = linter.verify(
      content,
      {
        rules: {
          "find-deprecations": "error",
        },
        parser: "@typescript-eslint/parser",
        parserOptions: {
          sourceType: "module",
          ecmaVersion: 2018,
          comment: true,
        },
      },
      { filename }
    );
  }
  return hits;
}

function createLinter() {
  let hits = [] as FoundDeprecation[];

  const linter = new TSESLint.Linter();
  linter.defineParser("@typescript-eslint/parser", parser);
  linter.defineRule("find-deprecations", {
    create(context) {
      const tsIgnoreRegExp = /@deprecated/;
      const sourceCode = context.getSourceCode();
      let deprecationComments = [] as TSESTree.BlockComment[];

      function checkForDeprecation(node: TSESTree.Node, name: string) {
        const docNode: { value: string } = sourceCode.getJSDocComment(
          node
        ) as any;
        let commentBlock = docNode?.value ?? "";

        // getJSDocComment does not always return the comment block?
        // fix by keeping a ref to all comments, and looking them up here
        if (!commentBlock) {
          const comment = deprecationComments.find(
            (d) => d.loc.end.line === node.loc.start.line - 1
          );
          commentBlock = comment?.value ?? "";
        }
        if (tsIgnoreRegExp.test(commentBlock)) {
          const hit = {
            name,
            filename: `${context.getFilename().split(path.sep).join("/")}`,
            lineNumber: node.loc.start.line,
            deprecationMsg: commentBlock
              .substr(commentBlock.indexOf("@deprecated") + 12)
              .trim(),
            type: node.type,
          };
          hits.push(hit);
        }
      }

      return {
        Program(): void {
          const comments = sourceCode.getAllComments();
          comments.forEach((comment) => {
            if (comment.type !== AST_TOKEN_TYPES.Block) {
              return;
            }
            if (tsIgnoreRegExp.test(comment.value)) {
              deprecationComments.push(comment);
            }
          });
        },
        FunctionDeclaration(node) {
          checkForDeprecation(node, node.id.name);
        },
        TSDeclareFunction(node) {
          checkForDeprecation(node, node.id.name);
        },
        TSMethodSignature(node) {
          if (isIdentifier(node.key)) {
            checkForDeprecation(node, node.key.name);
          }
        },
        TSEnumDeclaration(node) {
          checkForDeprecation(node, node.id.name);
        },
        TSTypeAliasDeclaration(node) {
          checkForDeprecation(node, node.id.name);
        },
        TSPropertySignature(node) {
          if (isIdentifier(node.key)) {
            checkForDeprecation(node, node.key.name);
          }
        },
        ClassDeclaration(node) {
          checkForDeprecation(node, node.id.name);
        },
        ClassProperty(node) {
          if (
            isIdentifier(node.key) &&
            isClassBody(node.parent) &&
            isClassDeclaration(node.parent.parent)
          ) {
            checkForDeprecation(
              node,
              `${node.parent.parent.id.name}.${node.key.name}`
            );
          }
        },
        MethodDefinition(node) {
          if (
            isIdentifier(node.key) &&
            isClassBody(node.parent) &&
            isClassDeclaration(node.parent.parent)
          ) {
            checkForDeprecation(
              node,
              `${node.parent.parent.id.name}.${node.key.name}`
            );
          }
        },
        VariableDeclaration(node) {
          const [declarator] = node.declarations;
          if (isIdentifier(declarator.id)) {
            checkForDeprecation(node, declarator.id.name);
          }
        },
      };
    },
  });

  return {
    linter,
    hits,
  };
}

function* visit(
  currentPath: string
): IterableIterator<{ filename: string; content: string }> {
  const files = fs.readdirSync(currentPath);
  for (const file of files) {
    if (file === "node_modules") {
      continue;
    }

    const fullPath = path.join(currentPath, file);
    if (
      fullPath.endsWith(".ts") &&
      !fullPath.endsWith(".spec.ts") &&
      !fullPath.endsWith(".test.ts") &&
      !fullPath.endsWith(".d.ts")
    ) {
      const file = fs.readFileSync(fullPath);
      if (file) {
        const content = file.toString();
        yield { filename: fullPath, content };
      }
    }

    try {
      const stats = fs.lstatSync(fullPath);
      if (stats.isDirectory()) {
        yield* visit(fullPath);
      }
    } catch {
      const stats = fs.lstatSync(fullPath);
      if (stats.isDirectory()) {
        yield* visit(fullPath);
      }
    }
  }
}

function isIdentifier(node: TSESTree.Node): node is TSESTree.Identifier {
  return node.type === "Identifier";
}

function isClassBody(node: TSESTree.Node): node is TSESTree.ClassBody {
  return node.type === "ClassBody";
}

function isClassDeclaration(
  node: TSESTree.Node
): node is TSESTree.ClassDeclaration {
  return node.type === "ClassDeclaration";
}
