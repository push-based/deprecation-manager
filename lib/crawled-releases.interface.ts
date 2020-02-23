interface CrawledRelease {
  version: string;
  date: string;
  numberOfDeprecations: number;
  numberOfNewDeprecations: number;
  deprecations: CrawledDeprecation[]
}

interface CrawledDeprecation {
  name: string;
  type: string;
  deprecationMsg: string;
  sourceLink: string;
}
