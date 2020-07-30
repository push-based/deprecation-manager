export interface CrawlConfig {
  gitTag: string;
  outputDirectory: string;
  tsConfigPath: string;
  deprecationComment: string;
  deprecationLink: string;
  groups: { key: string; matchers: string[] }[];
}

export enum NodeTypes {
  ClassDeclaration = "ClassDeclaration",
  Identifier = "Identifier",
  ClassBody = "ClassBody",
  MethodDefinition = "MethodDefinition",
}

export interface MigrationItemSubjectUIDFields {
  itemType: string;
  subject: string;
  subjectSymbol: string;
  subjectAction: string;
}

export interface MigrationReleaseUIDFields {
  version: string;
}

export enum SubjectSymbols {
  all = "all",
  class = "class",
  interface = "interface",
  function = "function",
  enum = "enum",
  const = "enum",
  let = "let",
  var = "var",
  symbol = "symbol",
  import = "import",
  typeAlias = "type-alias",
}

export enum SubjectActionSymbol {
  all = "all",
  argument = "argument",
  property = "property",
  genericArgument = "generic-argument",
  method = "method",
}

export interface RawDeprecation extends MigrationItemSubjectUIDFields {
  itemType: string;
  sourceLink: string;
  breakingChangeVersion: string;
  breakingChangeSubjectAction: string;
  deprecationMsgCode: string;
  breakingChangeMsg: string;
  reason: string;
  implication: string;
  exampleBeforeDependencies?: { [lib: string]: string };
  exampleBefore?: string;
  exampleAfterDependencies?: { [lib: string]: string };
  exampleAfter?: string;
  notes?: string;
}

export interface RawMigrationReleaseItem extends MigrationReleaseUIDFields {
  date: string;
  sourceLink: string;
  deprecations: RawDeprecation[];
}

export interface CrawledRelease {
  version: string;
  date: string;
  deprecations: CrawledDeprecation[];
}

export interface CrawledDeprecation {
  type: NodeTypes;
  name: string;
  deprecationMsg: string;
  sourceLink: string;
}

export interface FoundDeprecation {
  name: string;
  filename: string;
  lineNumber: number;
  deprecationMsg: string;
  type: string;
}

export interface Deprecation {
  name: string;
  kind: string;
  path: string;
  lineNumber: number;
  code: string;
  deprecationMessage: string;
  pos: [number, number];
  group?: string;
  uuid?: string;
}
