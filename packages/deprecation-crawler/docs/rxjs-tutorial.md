**Preconditions:**

Have a version of the [RxJS repository](https://github.com/ReactiveX/rxjs) locally available.

To get a real life experiance checkout the PR related to deprecation management:  
`git fetch <remote> pull/5426/head:pr/5426 && git checkout pr/5426`

**TLDR**  

In this section, you will use a pre-configured config file. This will generate an output without any questions asked.
It is also a good example of a CI integration.

1. Copy the following content into `docs_app/deprecation-crawler.config.json`  
https://raw.githubusercontent.com/timdeschryver/deprecation-manager/master/packages/deprecation-crawler/docs/config-examples/rxjs-example.deprecation-crawler.config.json

2. Run `npx deprecation-crawler -p docs_app/deprecation-crawler.config.json` and say yes to every question.
- 💡 place `deprecation-crawler.config.json` into `tmp` folder and also point the output folder there to avoid changes in the repository. 

**Full Run Through**  

In the following steps, we will walk through the whole process one by one.

1. Start the crawler by running: `npx deprecation-crawler -p docs_app/deprecation-crawler.config.json`
Answer the questions to set up the crawler:
- √ What tsconfig file do you want to use? · `src\tsconfig.base.json`
- √ What's the deprecation link to the docs? · `https://rxjs.dev/deprecations`
- √ What's the deprecation keyword to look for? · `@deprecated`
- √ What's the output directory? · docs_app/content/deprecations
2. Crawl the repository
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
You will generate the default output formats. Edit the config.json to change them.

5. Sync Repository
√ Repo Update? (Y/n) · true
Now all detected deprecation comments are updated with the link appended e.g. ` Details: {@link https://rxjs.dev/deprecations#2473769302}`


