import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { CrawlConfig } from "./models";
import { format, resolveConfig } from "prettier";
import { REPO_CONFIG_PATH } from "./constants";

// TODO: make these configurable
export const DEPRECATION = "@deprecated";
export const DEPRECATIONLINK = "https://rxjs.dev/deprecations";

export const EOL = "\r\n";

export function hash(str: string) {
  let s = str.replace(/ /g, "");
  let hash = 5381;
  let i = s.length;

  while (i) {
    hash = (hash * 33) ^ s.charCodeAt(--i);
  }

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
  return (hash >>> 0).toString();
}

export function ensureDirExists(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
}

export function updateRepoConfig(config: CrawlConfig) {
  const { gitTag, ...writableConfig } = config;
  const prettiedConfig = format(JSON.stringify(writableConfig), {
    parser: "json",
    ...resolveConfig.sync("./"),
  });

  writeFileSync(REPO_CONFIG_PATH, prettiedConfig);
}

export function readFile(path: string) {
  if (existsSync(path)) {
    return readFileSync(path, "utf-8");
  }
  return "";
}

// import {
//   CrawledDeprecation,
//   CrawledRelease,
//   NodeTypes,
//   RawDeprecation,
//   RawMigrationReleaseItem,
//   SubjectActionSymbol,
//   SubjectSymbols,
// } from "./models";

// export function fillRelease(
//   r: CrawledRelease = {} as CrawledRelease,
//   defaultOverrides: Partial<RawMigrationReleaseItem> = {}
// ): RawMigrationReleaseItem {
//   const parsedRelease: RawMigrationReleaseItem = {
//     version: "@TODO",
//     deprecations: [],
//     date: "@TODO",
//     sourceLink: "@TODO",
//     ...defaultOverrides,
//   };
//   (r.date && (parsedRelease.date = r.date)) ||
//     (parsedRelease.date = new Date("2021-01-01").toISOString());
//   r.version && (parsedRelease.version = r.version);
//   parsedRelease.deprecations || (parsedRelease.deprecations = []);
//   return parsedRelease;
// }

// export function fillDeprecation(
//   d: CrawledDeprecation = {} as CrawledDeprecation,
//   defaultOverrides: Partial<RawDeprecation> = {}
// ): RawDeprecation {
//   const parsedDeprecation: RawDeprecation = {
//     itemType: "deprecation",
//     subject: "~subject~",
//     subjectAction: "~subjectActionSymbol~-~subjectAction~",
//     subjectSymbol: "~subjectSymbol~" as any,
//     reason: "@TODO",
//     implication: "@TODO",
//     sourceLink: "@TODO",
//     deprecationMsgCode: "@TODO",
//     breakingChangeVersion: "@TODO",
//     breakingChangeSubjectAction: "@TODO",
//     breakingChangeMsg: "@TODO",
//     exampleAfter: "@TODO",
//     exampleBefore: "@TODO",
//     ...defaultOverrides,
//   };

//   const subjectSymbol = getSubjectSymbolFormTSType(d.type);
//   const subjectActionSymbol = getSubjectActionSymbolFormTSType(d.type);
//   const subSubject = d.name.split(".")[1] ? d.name.split(".")[1] : "";
//   const subjectAction = "~subjectAction~";

//   parsedDeprecation.subject = d.name.split(".")[0];
//   parsedDeprecation.subjectSymbol = subjectSymbol;
//   parsedDeprecation.subjectAction = [
//     subjectActionSymbol,
//     subSubject,
//     subjectAction,
//   ]
//     .filter((v) => !!v)
//     .map(trimReservedUrlChars)
//     .map(trimReservedLinkChars)
//     .join("-");
//   parsedDeprecation.sourceLink = d.sourceLink;
//   parsedDeprecation.deprecationMsgCode = d.deprecationMsg;
//   return parsedDeprecation;
// }

// function getSubjectSymbolFormTSType(type: string): string {
//   switch (type) {
//     case NodeTypes.ClassDeclaration:
//     case NodeTypes.MethodDefinition:
//       return SubjectSymbols.class;
//     default:
//       return "~subjectSymbol~";
//   }
// }

// function trimReservedUrlChars(str: string): string {
//   // https://www.ietf.org/rfc/rfc2396.txt
//   const unreservedChars =
//     "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" +
//     "0123456789" +
//     "-_.!~*'()".split("");
//   return str
//     .split("")
//     .filter((i) => unreservedChars.includes(i))
//     .join("");
// }

// function trimReservedLinkChars(str: string): string {
//   const reservedChars = "_".split("");
//   return str
//     .split("")
//     .filter((i) => !reservedChars.includes(i))
//     .join("");
// }

// function getSubjectActionSymbolFormTSType(type: string): string {
//   switch (type) {
//     case NodeTypes.MethodDefinition:
//       return SubjectActionSymbol.method;
//     default:
//       return "~subjectActionSymbol~";
//   }
// }
