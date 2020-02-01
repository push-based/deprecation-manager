"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs_1 = tslib_1.__importDefault(require("fs"));
var path_1 = require("path");
var cp = tslib_1.__importStar(require("child_process"));
var experimental_utils_1 = require("@typescript-eslint/experimental-utils");
var parser = tslib_1.__importStar(require("@typescript-eslint/parser"));
// Configuration
var gitHubUrl = "https://github.com/ReactiveX/rxjs";
var localePath = String.raw(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["C:Users\tdeschryverdev\forks\rxjs"], ["C:\\Users\\tdeschryver\\dev\\forks\\rxjs"])));
var outputPath = String.raw(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["C:Users\tdeschryverdevpocdeprecationsoutput"], ["C:\\Users\\tdeschryver\\dev\\poc\\deprecations\\output"])));
var numberOfVersionsToGoBack = 3;
// Globals
// can this be done with messages?
var hits = [];
var currentTag = "";
// Linter
var linter = new experimental_utils_1.TSESLint.Linter();
linter.defineParser("@typescript-eslint/parser", parser);
linter.defineRule("find-deprecations", {
    create: function (context) {
        var tsIgnoreRegExp = /@deprecated/;
        var sourceCode = context.getSourceCode();
        var deprecationComments = [];
        function checkForDeprecation(node, name) {
            var _a, _b, _c, _d;
            var docNode = sourceCode.getJSDocComment(node);
            var commentBlock = (_b = (_a = docNode) === null || _a === void 0 ? void 0 : _a.value, (_b !== null && _b !== void 0 ? _b : ""));
            // getJSDocComment does not always return the comment block?
            // fix by keeping a ref to all comments, and looking them up here
            if (!commentBlock) {
                var comment = deprecationComments.find(function (d) { return d.loc.end.line === node.loc.start.line - 1; });
                commentBlock = (_d = (_c = comment) === null || _c === void 0 ? void 0 : _c.value, (_d !== null && _d !== void 0 ? _d : ""));
            }
            if (tsIgnoreRegExp.test(commentBlock)) {
                var hit = {
                    name: name,
                    filename: "" + context
                        .getFilename()
                        .split(path_1.sep)
                        .join("/"),
                    lineNumber: node.loc.start.line,
                    deprecationMsg: commentBlock
                        .substr(commentBlock.indexOf("@deprecated") + 12)
                        .trim(),
                    type: node.type
                };
                hits.push(hit);
            }
        }
        return {
            Program: function () {
                var comments = sourceCode.getAllComments();
                comments.forEach(function (comment) {
                    if (comment.type !== experimental_utils_1.AST_TOKEN_TYPES.Block) {
                        return;
                    }
                    if (tsIgnoreRegExp.test(comment.value)) {
                        deprecationComments.push(comment);
                    }
                });
            },
            FunctionDeclaration: function (node) {
                checkForDeprecation(node, node.id.name);
            },
            TSDeclareFunction: function (node) {
                checkForDeprecation(node, node.id.name);
            },
            TSMethodSignature: function (node) {
                if (isIdentifier(node.key)) {
                    checkForDeprecation(node, node.key.name);
                }
            },
            TSEnumDeclaration: function (node) {
                checkForDeprecation(node, node.id.name);
            },
            TSTypeAliasDeclaration: function (node) {
                checkForDeprecation(node, node.id.name);
            },
            TSPropertySignature: function (node) {
                if (isIdentifier(node.key)) {
                    checkForDeprecation(node, node.key.name);
                }
            },
            ClassDeclaration: function (node) {
                checkForDeprecation(node, node.id.name);
            },
            ClassProperty: function (node) {
                if (isIdentifier(node.key) &&
                    isClassBody(node.parent) &&
                    isClassDeclaration(node.parent.parent)) {
                    checkForDeprecation(node, node.parent.parent.id.name + "." + node.key.name);
                }
            },
            MethodDefinition: function (node) {
                if (isIdentifier(node.key) &&
                    isClassBody(node.parent) &&
                    isClassDeclaration(node.parent.parent)) {
                    checkForDeprecation(node, node.parent.parent.id.name + "." + node.key.name);
                }
            },
            VariableDeclaration: function (node) {
                var _a = tslib_1.__read(node.declarations, 1), declarator = _a[0];
                if (isIdentifier(declarator.id)) {
                    checkForDeprecation(node, declarator.id.name);
                }
            }
        };
    }
});
(function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var output, tagsString, tags, tags_1, tags_1_1, tag, e_1_1, outputContent;
    var e_1, _a;
    return tslib_1.__generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                process.chdir(localePath);
                output = [];
                return [4 /*yield*/, git(["tag"])];
            case 1:
                tagsString = _b.sent();
                tags = tagsString
                    .split("\n")
                    .filter(Boolean)
                    .slice(-numberOfVersionsToGoBack)
                    .concat("master");
                _b.label = 2;
            case 2:
                _b.trys.push([2, 8, 9, 10]);
                tags_1 = tslib_1.__values(tags), tags_1_1 = tags_1.next();
                _b.label = 3;
            case 3:
                if (!!tags_1_1.done) return [3 /*break*/, 7];
                tag = tags_1_1.value;
                currentTag = tag;
                hits = [];
                console.log("[" + currentTag + "] Checkout");
                return [4 /*yield*/, git(["checkout", currentTag])];
            case 4:
                _b.sent();
                // give it a little bit time.., exceptions like "process in use" might occur otherwise
                return [4 /*yield*/, wait(5000)];
            case 5:
                // give it a little bit time.., exceptions like "process in use" might occur otherwise
                _b.sent();
                console.log("[" + currentTag + "] Lint");
                lint();
                output.push([currentTag, hits]);
                console.log("[Total hits] " + hits.length);
                _b.label = 6;
            case 6:
                tags_1_1 = tags_1.next();
                return [3 /*break*/, 3];
            case 7: return [3 /*break*/, 10];
            case 8:
                e_1_1 = _b.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 10];
            case 9:
                try {
                    if (tags_1_1 && !tags_1_1.done && (_a = tags_1.return)) _a.call(tags_1);
                }
                finally { if (e_1) throw e_1.error; }
                return [7 /*endfinally*/];
            case 10:
                // const hitsPerFile= hits.reduce((a, b) => {
                //   if(a[b.filename]) {
                //     a[b.filename] += 1
                //   } else {
                //     a[b.filename] = 1
                //   }
                //   return a
                // }, {});
                // const totalHits = hits.length
                // console.log(`[Hits per file]\n`, hitsPerFile)
                if (!fs_1.default.existsSync(outputPath)) {
                    fs_1.default.mkdirSync(outputPath);
                }
                process.chdir(outputPath);
                outputContent = output.map(function (_a, index) {
                    var _b = tslib_1.__read(_a, 2), version = _b[0], deprecations = _b[1];
                    var _c = tslib_1.__read(output[index - 1] || [], 2), _ = _c[0], previousDeprecations = _c[1];
                    previousDeprecations = previousDeprecations || [];
                    var newDeprecations = deprecations
                        .map(function (d) { return ({
                        name: d.name,
                        type: d.type,
                        deprecationMsg: d.deprecationMsg,
                        sourceLink: gitHubUrl + "/blob/" + currentTag + "/" + d.filename + "#" + d.lineNumber,
                        isKnownDeprecation: previousDeprecations.some(function (p) {
                            return p.name === d.name &&
                                p.filename === d.filename &&
                                p.lineNumber === d.lineNumber;
                        })
                    }); })
                        .filter(function (d) { return !d.isKnownDeprecation; })
                        .map(function (_a) {
                        var _ = _a.isKnownDeprecation, msg = tslib_1.__rest(_a, ["isKnownDeprecation"]);
                        return msg;
                    });
                    return {
                        version: version,
                        numberOfDeprecations: deprecations.length,
                        numberOfNewDeprecations: newDeprecations.length,
                        deprecations: newDeprecations
                    };
                });
                fs_1.default.writeFileSync("./output.json", JSON.stringify(outputContent, null, 4));
                return [2 /*return*/];
        }
    });
}); })();
// Utils
function lint() {
    var e_2, _a;
    try {
        for (var _b = tslib_1.__values(visit(".")), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = _c.value, filename = _d.filename, content = _d.content;
            var messages = linter.verify(content, {
                rules: {
                    "find-deprecations": "error"
                },
                parser: "@typescript-eslint/parser",
                parserOptions: {
                    sourceType: "module",
                    ecmaVersion: 2018,
                    comment: true
                }
            }, { filename: filename });
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
}
function visit(currentPath) {
    var files, files_1, files_1_1, file, fullPath, file_1, content, stats, _a, stats, e_3_1;
    var e_3, _b;
    return tslib_1.__generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                files = fs_1.default.readdirSync(currentPath);
                _c.label = 1;
            case 1:
                _c.trys.push([1, 12, 13, 14]);
                files_1 = tslib_1.__values(files), files_1_1 = files_1.next();
                _c.label = 2;
            case 2:
                if (!!files_1_1.done) return [3 /*break*/, 11];
                file = files_1_1.value;
                if (file === "node_modules") {
                    return [3 /*break*/, 10];
                }
                fullPath = path_1.join(currentPath, file);
                if (!(fullPath.endsWith(".ts") &&
                    !fullPath.endsWith(".spec.ts") &&
                    !fullPath.endsWith(".test.ts") &&
                    !fullPath.endsWith(".d.ts"))) return [3 /*break*/, 4];
                file_1 = fs_1.default.readFileSync(fullPath);
                if (!file_1) return [3 /*break*/, 4];
                content = file_1.toString();
                return [4 /*yield*/, { filename: fullPath, content: content }];
            case 3:
                _c.sent();
                _c.label = 4;
            case 4:
                _c.trys.push([4, 7, , 10]);
                stats = fs_1.default.lstatSync(fullPath);
                if (!stats.isDirectory()) return [3 /*break*/, 6];
                return [5 /*yield**/, tslib_1.__values(visit(fullPath))];
            case 5:
                _c.sent();
                _c.label = 6;
            case 6: return [3 /*break*/, 10];
            case 7:
                _a = _c.sent();
                stats = fs_1.default.lstatSync(fullPath);
                if (!stats.isDirectory()) return [3 /*break*/, 9];
                return [5 /*yield**/, tslib_1.__values(visit(fullPath))];
            case 8:
                _c.sent();
                _c.label = 9;
            case 9: return [3 /*break*/, 10];
            case 10:
                files_1_1 = files_1.next();
                return [3 /*break*/, 2];
            case 11: return [3 /*break*/, 14];
            case 12:
                e_3_1 = _c.sent();
                e_3 = { error: e_3_1 };
                return [3 /*break*/, 14];
            case 13:
                try {
                    if (files_1_1 && !files_1_1.done && (_b = files_1.return)) _b.call(files_1);
                }
                finally { if (e_3) throw e_3.error; }
                return [7 /*endfinally*/];
            case 14: return [2 /*return*/];
        }
    });
}
function isIdentifier(node) {
    return node.type === "Identifier";
}
function isClassBody(node) {
    return node.type === "ClassBody";
}
function isClassDeclaration(node) {
    return node.type === "ClassDeclaration";
}
function cmd(command, args) {
    return exec(command, args);
}
exports.cmd = cmd;
function git(args) {
    return cmd("git", args);
}
exports.git = git;
function exec(command, args) {
    return new Promise(function (resolve, reject) {
        cp.exec(command + " " + args.join(" "), function (err, stdout) {
            if (err) {
                return reject(err);
            }
            resolve(stdout.toString());
        });
    });
}
exports.exec = exec;
function wait(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
var templateObject_1, templateObject_2;
