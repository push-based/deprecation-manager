/**
 * Examples in this file should multiple commenting styles.
 */

/** @deprecated comment-style single line deprecation Details: {@link sandbox-deprecation-link#3397214801} */
function foo() {
  return 'foo';
}

/**
 * @nocollapse
 * @deprecated comment-style deprecation with leading text Details: {@link sandbox-deprecation-link#456802929}
 */
function foo2() {
  return 'foo2';
}

/**
 * This is foo3
 * @method foo3
 * @deprecated comment-style deprecation with leading and trailing text Details: {@link sandbox-deprecation-link#242198417}
 * @return {void}
 */
function foo3() {
  return 'foo3';
}

/** @deprecated comment-style single line deprecation with no space at the end Details: {@link sandbox-deprecation-link#2601492017}*/
function foo4() {
  return 'foo4';
}
