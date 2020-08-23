**Preconditions:**

Have a version of the [RxJS repository](https://github.com/ReactiveX/rxjs) locally available.

To get a real life experiance checkout the PR related to deprecation management:  
`git fetch <remote> pull/5426/head:pr/5426 && git checkout pr/5426`

**TLDR**
In this section you will use a preconfigired config file. This will generate an output without any questions asked.
It is also a good example for a CI integreation.

1. Copy follofing content into `docs_app/deprecation-crawler.config.json`  
https://raw.githubusercontent.com/timdeschryver/deprecation-manager/master/packages/deprecation-crawler/docs/config-examples/rxjs-example.deprecation-crawler.config.json


**Run Through**
In the following steps we will walk through the whole process one by one.

1. Start the crawler by running: `npx deprecation-crawler -p docs_app/deprecation-crawler.config.json`
Answer the questions to setup the crawler:
- √ What tsconfig file do you want to use? · `src\tsconfig.base.json`
- √ What's the deprecation link to the docs? · `https://rxjs.dev/deprecations`
- √ What's the deprecation keyword to look for? · `@deprecated`
- √ What's the output directory? · docs_app/constent/deprecations
2. Crawl the repositrory
√ What git tag do you want to crawl? · pr/5426

3. Grouping
√ Grouping? (Y/n) · true

At any time you can reuse an existing group or create a new one.  
Select `Stop grouping` to stop the process  
√ Add group to deprecation? · Create new group  
√ Add human readable group name to deprecation · `internal`  
```
src/internal/AsyncSubject.ts#17
/** @deprecated This is an internal implementation detail, do not use. */
```
√ Which part of the deprecation message do you want to use as a matcher? · `internal implementation`

4. Output Formatter
√ Update Formatted Output? (Y/n) · true
You will generated the default output formats. Edit the config.json to change them.

5. Sync Repository
√ Repo Update? (Y/n) · true
Now all detected deprecation comments are updated with the link appended e.g. ` Details: {@link https://rxjs.dev/deprecations#2473769302}`


