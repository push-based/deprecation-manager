# find-deprecations

Run `npm run crawl` to search for deprecations.

Inside `./lib/index.ts` configure:

- `gitHubUrl`: path to github repo, `[gitHubUrl](https://github.com/ReactiveX/rxjs`
- `localePath`: location where local repo lives, `C:\Users\tdeschryver\dev\forks\rxjs`
- `outputPath`: directory where the output file can be saved, `C:\Users\tdeschryver\dev\poc\deprecations\output`
- `numberOfVersionsToGoBack`: search for deprecations in the last N tags, `3`
