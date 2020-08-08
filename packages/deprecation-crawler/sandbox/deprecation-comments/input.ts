/**
 * Examples in this file should multiple commenting styles.
 */

/** @deprecated comment-style single line deprecation */
function foo() {
  return 'foo';
}

/**
 * @nocollapse
 * @deprecated comment-style deprecation with leading text
 */
function foo2() {
  return 'foo2';
}

/**
 * This is foo3
 * @method foo3
 * @deprecated comment-style deprecation with leading and trailing text
 * @return {void}
 */
function foo3() {
  return 'foo3';
}

/** @deprecated comment-style single line deprecation with no space at the end*/
function foo4() {
  return 'foo4';
}

// @deprecated comment-style a non-jsdoc comment
function foo5() {
  return 'foo5';
}
