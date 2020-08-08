export interface CrawlConfig {
  gitTag: string;
  outputDirectory: string;
  tsConfigPath: string;
  deprecationComment: string;
  deprecationLink: string;
  outputFormatters: string[];
  groups: { key: string; matchers: string[] }[];
  commitMessage?: string;
}

export enum NodeTypes {
  ClassDeclaration = 'ClassDeclaration',
  Identifier = 'Identifier',
  ClassBody = 'ClassBody',
  MethodDefinition = 'MethodDefinition',
}

export interface CrawlerProcess<I, O> {
  (crawledReleases: I): Promise<O>;
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
  version: string;
  date: string;
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
  group?: string;
  ruid?: string;
}
