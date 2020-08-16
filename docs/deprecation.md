# What is a deprecation?

> In several fields, deprecation is the discouragement of use of some terminology, feature, design, or practice, typically because
> it has been superseded or is no longer considered efficient or safe, without completely removing it or prohibiting its use.
> 
> It can also imply that a feature, design, or practice will be removed or discontinued entirely in the future.
> _Wikipedia, https://en.wikipedia.org/wiki/Deprecation#Software_

In Software specifically, deprecation of a feature typically is done by remaining in the feature in the software. 
Its use will raise warning messages in IDEs or while runtime. 

Features are deprecated, rather than immediately removed, to provide backward compatibility and to give programmers time to bring affected code into compliance with the new standard.

In the TsDocs standard a deprecation can be placed as by using the deprecation token:

```typescript
/** @deprecated use otherVar instead */
const someVariable = 42;
```

The deprecation comment `/** @deprecated use otherVar instead */` consists of the token `@deprecated` and the message `use otherVar instead`.

# Where does a deprecation occur?

A deprecation marks a snippet of code in a software. 
As the source code of the software is a mutating thing release management and versioning ade software disciplines targeting this problem.

In the javascript ecosystem, the [semantic versioning system](https://semver.org/) is quite far accepted. 
It specifies a specific version of the software and gives a first glance of what this implies to the user.

One or multiple changes to the software will get released under a new version. The incremental change of the version number is called a version bump. Those changes in the version are persisted to the versioning system, e.g. git as a tag.

> Tags even if their commits or branches get deleted will survive and are a safe way to send an anchor to a specific version of your code.

So the depreciation may get introduced in a separate commit but it is always shipped under a semver versioned version of the software. 

To answer the question where a deprecation occurs:

An introduced deprecation occurs/is official if the code that includes the deprecation got released (and tagged) under a version number.

If a version is not released yet but already in the release branch the deprecation is in a suspense state and belongs to the `next` version until it is released. 

# What could cause a deprecation?

Following things will require a deprecation:
- removed in a future minor release
- naming variables, methods, functions etc.
- changing the signature of a function
- changing the behavior of a process in a way it is significantly different from before

If one of those changes gets introduced to the software a deprecation marker is required in the code.

```typescript
/** @deprecated use otherVar instead */
const someVariable = 42;

const otherVar = someVariable;
```

# What information does a deprecation contain?

As deprecations are placed directly over the sourcecode there are several reasons a deprecation message should be on spot:
- Too much comments make a code hard to maintain
- A deprecation could affect multiple overloads. This leads to duplicated messages
- The deprecation is affecting multiple files
- [IDEs might not have the best formatting for the message](https://gist.github.com/BioPhoton/ffb4d2e2aa9bb46704ebcdde3bbf8e2f)

The minimal and most important information a deprecation message should contain is:
1. consequences (use something else, will get removed)
2. where to get more info e.g. a link

As IDEs start with display the message including snippets of the code and including already the word deprecated, the message should exclude mentioning the deprecation and directly start with the rest of the phrase.

So the message can be read as `<deprecation-token> <target of deprecation> <phrase>`.
e. g. `deprecated someVar use otherVar instead`

If a link is added it should get placed at the end of the message.
e. g. `deprecated someVar use otherVar instead Details: {@link smoe-link}`

# What are the attributes of a deprecation to get identified in a repository?

Repository unique identification is given through:

- Path: File path starting from root to the file including the deprecation
- Line Number: Start line number of the deprecated code snippet.
- Code: ???
- Deprecation Message: Deprecation comment text
- Position: Start and top position ??? as array e.g. [start, stop],
- Version: Git tag name

# How to prepare for a breaking change?

After the user-installed version of the software which includes a deprecation and the feature is in use normally a certain time period is given to refactor the codebase to a state where it doesn't use the deprecated feature anymore.

In the best case, the software provides some kind of online documentation to instruct on certain steps the migration requires.

In a nutshell, the minimum provided information should contain:
- Implications: What does it mean to the developer in terms of next steps
- Refactoring: Information on how the refactoring looks like and detailed explanations on why it is done that way.
- Example Before: A minimal code example showing the situation before the breaking change and the version in with the example is written.
- Example After: A minimal code example showing the situation before the breaking change and the version in with the example is written.

Software maintainers can use the link in the deprecation message to link to their information online.
As deprecations often affect multiple features the information can be used for a group of deprecations.
This simply means multiple links show to the same information or one link is used multiple times.

# What causes a breaking change?

Based on the assumption that the software is following semantic versioning the breaking change for an introduced deprecation happens with one of the next major version changes. 

So if a deprecation is introduced in version `6.0.0-alpha4` it can only break in version:
- `7.0.0-alpha.0` to `7.0.0`,
- `8.0.0-alpha.0` to `8.0.0`,
- `9.0.0-alpha.0` to `9.0.0`,
etc...

But the real cause of the breaking change is the removal/change proposed through the deprecation. 
This change also implies that the deprecation take is removed from the code base.


# How can a deprecation can be undone?

If a deprecation needs to get undone due to technical difficulties or external factors the deprecation can be deleted with the next patch version of the software.


