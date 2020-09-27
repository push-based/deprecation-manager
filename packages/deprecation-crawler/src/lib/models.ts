export interface CrawlDefaultConfig {
  pathFilter: string;
  tagFormat: string;
  commentLinkFormat: string;
  commitMessage: string;
  groups: { key: string; matchers: string[] }[];
  outputFormatters: string[];
}

export interface CrawlConfig extends CrawlDefaultConfig {
  // required fields
  deprecationComment: string;
  deprecationLink: string;
  // optional fields
  outputDirectory: string;
  include: string[];
  exclude: string[];
}

export interface GitTag {
  name: string;
  semver: string;
  // @TODO implement
  date?: string;
}

export interface CrawlConfigDefaults {
  outputFormatters: string[];
  tagFormat: string;
  groups: Group[];
  commitMessage: string;
}

export interface Group {
  key: string;
  matchers: string[];
}

export enum NodeTypes {
  ClassDeclaration = 'ClassDeclaration',
  Identifier = 'Identifier',
  ClassBody = 'ClassBody',
  MethodDefinition = 'MethodDefinition',
}

export interface CrawlerProcess {
  (crawledReleases: CrawledRelease): Promise<CrawledRelease | void>;
}

export enum SubjectSymbols {
  all = 'all',
  class = 'class',
  interface = 'interface',
  function = 'function',
  enum = 'enum',
  const = 'enum',
  let = 'let',
  var = 'var',
  symbol = 'symbol',
  import = 'import',
  typeAlias = 'type-alias',
}

export enum SubjectActionSymbol {
  all = 'all',
  argument = 'argument',
  property = 'property',
  genericArgument = 'generic-argument',
  method = 'method',
}

// @TODO move to custom formatters => HTML view
export interface RawDeprecation {
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

export interface CrawledRelease {
  tag: string;
  version: string;
  date: string;
  remoteUrl: string;
  deprecations: Deprecation[];
}

export interface Deprecation {
  name: string;
  kind: string;
  path: string;
  lineNumber: number;
  code: string;
  deprecationMessage: string;
  pos: [number, number];
  version: string;
  remoteUrl: string;
  date: string;
  group?: string;
  ruid?: string;
}
