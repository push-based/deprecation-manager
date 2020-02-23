# find-deprecations

# Setup Main Repositories
1. git clone https://github.com/ReactiveX/rxjs.git [MAIN_LOCAL_FOLDER]
2. copy `dummy.config.json` and copy it to `local.config.json`
3. Adopt configuration:
- `gitHubUrl`: path to github repo, `[gitHubUrl](https://github.com/ReactiveX/rxjs`
- `localePath`: location where local repo lives, `C:\Users\[USER]\path\to\[TARGET_LOCAL_FOLDER]`
- `outputPath`: directory where the output file can be saved, `C:\Users\[USER]\path\to\[MAIN_LOCAL_FOLDER]\output`
- `numberOfVersionsToGoBack`: search for deprecations in the last N tags, `3`

# Setup Target Repository

1. git clone <gitHubUrl> [TARGET_LOCAL_FOLDER]
2. Run `npm run crawl` to search for deprecations. This creates a `output.json` in the output folder.
3. Run `npm run prefill` to pre-fill data for migration timeline. . This creates a `filled-output.json` in the output folder.
