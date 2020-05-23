import { writeFileSync, existsSync, mkdirSync } from "fs";
import {
  Project,
  TypeElementTypes,
  CommentTypeElement,
  ClassMemberTypes,
  CommentClassElement,
  Statement,
} from "ts-morph";
import { isConstructorDeclaration, isVariableStatement } from "typescript";
import { basename, join } from "path";
import { CrawlConfig } from "./models";

// What about https://ts-morph.com/details/documentation#js-docs ?
// Problem: can't find top level deprecations? e.g. merge

const eol = "\r\n";

const DEPRECATIONLINK = "https://rxjs.dev/deprecations";
const DEPRECATION = "@deprecated";

export function crawlDeprecation(config: CrawlConfig) {
  const project = new Project({
    tsConfigFilePath: config.tsConfigPath,
  });

  const sourceFiles = project.getSourceFiles();

  const deprecations = sourceFiles
    // TODO: seems like these files cannot be parsed correctly?
    .filter((file) => !file.getFilePath().includes("/Observable.ts"))
    .map((file) => {
      const path = file.getFilePath();
      console.log(`🔎 Looking for deprecations in ${path}`);

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
            path: path,
            lineNumber: p.node.getStartLineNumber(),
            name: [p.parent, text].filter(Boolean).join("."),
            kind: p.node.getKindName(),
            code: p.node.getText(),

            deprecationMessage: p.comment.text,
            deprecationPos: [
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

export function addCommentToCode(
  config: CrawlConfig,
  rawDeprecations: Deprecation[]
) {
  if (rawDeprecations.length === 0) {
    console.log("🎉 All deprecations are resolved, no changes have to be made");
    return;
  }

  const project = new Project({
    tsConfigFilePath: config.tsConfigPath,
  });

  const deprecationsByFile = rawDeprecations.reduce((acc, val) => {
    acc[val.path] = (acc[val.path] || []).concat(val);
    return acc;
  }, {} as { [filePath: string]: Deprecation[] });

  Object.entries(deprecationsByFile).forEach(([path, deprecations]) => {
    console.log(`🔧 ${path}`);

    let addedPosForText = 0;

    const sorted = deprecations.sort((a, b) =>
      a.deprecationPos[0] > b.deprecationPos[0] ? 1 : -1
    );

    sorted.forEach((deprecation) => {
      const sourceFile = project.getSourceFile(path);
      const deprecationDetails = ` Details: {@link ${DEPRECATIONLINK}#${hash(
        deprecation.code
      )}}`;

      const lines = deprecation.deprecationMessage.split(eol);
      const newText = lines
        .map((text) => {
          if (text.includes(DEPRECATION)) {
            if (text.endsWith(" */")) {
              return text.replace(" */", `${deprecationDetails} */`);
            }
            if (text.endsWith("*/")) {
              return text.replace("*/", `${deprecationDetails}*/`);
            }
            return text + deprecationDetails;
          }
          return text;
        })
        .join(eol);

      sourceFile.replaceText(
        deprecation.deprecationPos.map((pos) => pos + addedPosForText) as [
          number,
          number
        ],
        newText
      );
      addedPosForText += deprecationDetails.length;

      sourceFile.saveSync();
    });
  });
}

export function generateMarkdown(
  config: CrawlConfig,
  rawDeprecations: Deprecation[],
  options: { tagDate: string }
) {
  if (rawDeprecations.length === 0) {
    console.log(
      "🎉 All deprecations are resolved, no markdown have to be generated"
    );
    return;
  }

  console.log("📝 Generating markdown");

  const deprecationsByFile = rawDeprecations.reduce((acc, val) => {
    acc[val.path] = (acc[val.path] || []).concat(val);
    return acc;
  }, {} as { [filePath: string]: Deprecation[] });

  const pagesInMd = Object.entries(deprecationsByFile).map(
    ([path, deprecations]) => {
      const sorted = deprecations.sort((a, b) =>
        a.deprecationPos[0] > b.deprecationPos[0] ? 1 : -1
      );

      return [`## ${basename(path)}`, ""]
        .concat(
          sorted.map((deprecation) => {
            return [
              `### ${deprecation.name} (${deprecation.kind}) {" #${hash(
                deprecation.code
              )}}`,
              "",
              stripComment(deprecation.deprecationMessage),
              "",
              "```ts",
              deprecation.code,
              "```",
            ].join(eol);
          })
        )
        .join(eol);
    }
  );

  const markdownContent = [
    `# ${config.gitTag} (${options.tagDate})`,
    "",
    ...pagesInMd,
  ].join(eol);

  ensureDirExists(config.outputDirectory);
  writeFileSync(
    join(config.outputDirectory, `${config.gitTag}.md`),
    markdownContent
  );
}

function stripComment(message: string) {
  return message.replace("/**", "").replace("*/", "").replace(/\*/g, "").trim();
}

function hash(str: string) {
  let s = str.replace(/ /g, "");
  let hash = 5381;
  let i = s.length;

  while (i) {
    hash = (hash * 33) ^ s.charCodeAt(--i);
  }

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
  return hash >>> 0;
}

function ensureDirExists(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
}

interface Deprecation {
  path: string;
  name: string;
  kind: string;
  lineNumber: number;
  code: string;

  deprecationMessage: string;
  deprecationPos: [number, number];
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
