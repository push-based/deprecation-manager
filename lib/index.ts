import fs from "fs";
import { join as pathJoin, sep as pathSep } from "path";
import * as cp from "child_process";
import {
  TSESLint,
  TSESTree,
  AST_TOKEN_TYPES
} from "@typescript-eslint/experimental-utils";
import * as parser from "@typescript-eslint/parser";
// @Notice create ./crawl.config.local.json in lib folder
import { default as jsonCfg} from "./crawl.config.local.json";
import { ensureCliParams } from "./ensure-cli-params";

// Configuration
interface CrawlParams {
  "gitHubUrl": string,
  "localePath": string,
  "outputPath": string,
  "numGoBack": number
}
const staticConfig: Partial<CrawlParams> = jsonCfg;
const cfg = ensureCliParams<CrawlParams>([
  {key: 'gitHubUrl', fallBack: staticConfig.gitHubUrl || 'https://github.com/ReactiveX/rxjs'},
  {key: 'localePath', fallBack: staticConfig.localePath || './'},
  {key: 'outputPath', fallBack: staticConfig.outputPath || 'output'},
  {key: 'numGoBack', fallBack: staticConfig.numGoBack || 3}
]);

console.log('cfg', cfg);
// Globals
// can this be done with messages?
let hits = [] as Hit[];
let currentTag = "";

// Linter
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
          d => d.loc.end.line === node.loc.start.line - 1
        );
        commentBlock = comment?.value ?? "";
      }
      if (tsIgnoreRegExp.test(commentBlock)) {
        const hit = {
          name,
          filename: `${context
            .getFilename()
            .split(pathSep)
            .join("/")}`,
          lineNumber: node.loc.start.line,
          deprecationMsg: commentBlock
            .substr(commentBlock.indexOf("@deprecated") + 12)
            .trim(),
          type: node.type
        };
        hits.push(hit);
      }
    }

    return {
      Program(): void {
        const comments = sourceCode.getAllComments();
        comments.forEach(comment => {
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
      }
    };
  }
});

(async () => {
  process.chdir(cfg.localePath);

  const output = [] as [string, Hit[]][];
  const tagsString = await git([`tag`]);
  const tags = tagsString
    .split("\n")
    .filter(Boolean)
    .slice(-cfg.numGoBack)
    .concat("master");

  for (const tag of tags) {
    currentTag = tag;
    hits = [];

    console.log(`[${currentTag}] Checkout`);
    await git([`checkout`, currentTag]);
    // give it a little bit time.., exceptions like "process in use" might occur otherwise
    await wait(5000);

    console.log(`[${currentTag}] Lint`);
    lint();

    output.push([currentTag, hits]);
  }

  // const hitsPerFile= hits.reduce((a, b) => {
  //   if(a[b.filename]) {
  //     a[b.filename] += 1
  //   } else {
  //     a[b.filename] = 1
  //   }
  //   return a
  // }, {});
  // const totalHits = hits.length
  // console.log(`[Hits per file]\n`, hitsPerFile)

  if (!fs.existsSync(cfg.outputPath)) {
    fs.mkdirSync(cfg.outputPath);
  }
  process.chdir(cfg.outputPath);

  const outputContent = output.map(([version, deprecations], index) => {
    let [_, previousDeprecations] = output[index - 1] || [];
    previousDeprecations = previousDeprecations || [];
    const newDeprecations = deprecations
      .map(d => ({
        name: d.name,
        type: d.type,
        deprecationMsg: d.deprecationMsg,
        sourceLink: `${cfg.gitHubUrl}/blob/${currentTag}/${d.filename}#${d.lineNumber}`,
        isKnownDeprecation: previousDeprecations.some(
          p =>
            p.name === d.name &&
            p.filename === d.filename &&
            p.lineNumber === d.lineNumber
        )
      }))
      .filter(d => !d.isKnownDeprecation)
      .map(({ isKnownDeprecation: _, ...msg }) => msg);

    return {
      version,
      numberOfDeprecations: deprecations.length,
      numberOfNewDeprecations: newDeprecations.length,
      deprecations: newDeprecations
    };
  });

  fs.writeFileSync(`./output.json`, JSON.stringify(outputContent, null, 4));
})();

// Utils
function lint() {
  for (const { filename, content } of visit(".")) {
    const messages = linter.verify(
      content,
      {
        rules: {
          "find-deprecations": "error"
        },
        parser: "@typescript-eslint/parser",
        parserOptions: {
          sourceType: "module",
          ecmaVersion: 2018,
          comment: true
        }
      },
      { filename }
    );
  }
}

function* visit(
  currentPath: string
): IterableIterator<{ filename: string; content: string }> {
  const files = fs.readdirSync(currentPath);
  for (const file of files) {
    if (file === "node_modules") {
      continue;
    }

    const fullPath = pathJoin(currentPath, file);
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

export function cmd(command: string, args: string[]): Promise<string> {
  return exec(command, args);
}

export function git(args: string[]): Promise<string> {
  return cmd("git", args);
}

export function exec(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(command + " " + args.join(" "), (err, stdout) => {
      if (err) {
        return reject(err);
      }

      resolve(stdout.toString());
    });
  });
}

function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

interface Hit {
  name: string;
  filename: string;
  lineNumber: number;
  deprecationMsg: string;
  type: string;
}
