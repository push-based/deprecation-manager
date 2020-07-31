// import { CrawledRelease, RawMigrationReleaseItem, CrawlConfig } from "./models";
// import { fillDeprecation, fillRelease } from "./utils";
// import { promises as fs } from "fs";
// import path from "path";

// export async function prefill(config: CrawlConfig) {
//   const crawledReleases: CrawledRelease[] = await fs
//     .readFile(config.outputFile)
//     .then((buffer) => JSON.parse(buffer.toString()));
//   const filledOutputContent: RawMigrationReleaseItem[] = crawledReleases.map(
//     (r) =>
//       fillRelease(r, {
//         deprecations: r.deprecations.map((d) => fillDeprecation(d as any, {})),
//       })
//   );
//   await fs.writeFile(
//     path.join(
//       path.dirname(config.outputFile),
//       "filled-" + path.basename(config.outputFile)
//     ),
//     JSON.stringify(filledOutputContent, null, 4)
//   );
// }


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
