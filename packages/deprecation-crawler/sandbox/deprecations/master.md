# master (sandbox-date)

## all-lowercase

### crawled.ts

#### lowercase1 (VariableStatement) {#3998890672}

@deprecated internal use only
  Example: all lowercase character
  Group name: all lowercase
  Regex: iNternal use onLy

```ts
const lowercase1 = 0;
```

#### lowercase2 (VariableStatement) {#2129363187}

@deprecated Internal use only
  Example: One uppercase character

```ts
const lowercase2 = 0;
```

#### lowercase3 (VariableStatement) {#2585813938}

@deprecated inteRnal use oNly
  Example: Multiple uppercase character

```ts
const lowercase3 = 0;
```
## catch-all

### crawled.ts

#### multiPatternMatch1 (VariableStatement) {#1734398741}

@deprecated This const named `t` is deprecated. See {@link info} for xyz.
  Example: 3 pattern match
  Group name: multi pattern match
  Regex: /^(?=.This const named!)(?=.deprecated!)(?=.xyz!).../

```ts
const multiPatternMatch1 = 0;
```

#### multiPatternMatch2 (VariableStatement) {#3477709142}

@deprecated IMPORTANT! This const named `t1` is deprecated. See {@link info} for xyz.
  Example: 3 pattern match with other start

```ts
const multiPatternMatch2 = 0;
```

#### multiPatternMatch3 (VariableStatement) {#2417065367}

@deprecated This const named `t2` is deprecated. See {@link info} for xyz and related things.
  Example: 3 pattern match with other end

```ts
const multiPatternMatch3 = 0;
```
## whitespace-normalisation

### crawled.ts

#### whitespacesNormalisation1 (VariableStatement) {#3186155811}

@deprecated This const is deprecated
  Example: single whitespaces
  Group name: whitespace normalisation
  Regex: This  const is  deprecated

```ts
const whitespacesNormalisation1 = 0;
```

#### whitespacesNormalisation2 (VariableStatement) {#677771456}

@deprecated    This  const is deprecated
  Example: start multiple whitespaces and also multiple times inside

```ts
const whitespacesNormalisation2 = 0;
```

#### whitespacesNormalisation3 (VariableStatement) {#3130163297}

@deprecated This  const   is    deprecated
  Example: multiple whitespaces multiple times

```ts
const whitespacesNormalisation3 = 0;
```
