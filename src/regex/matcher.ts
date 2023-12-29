import { expect, test } from "vitest";

type CommentRegex = {
  buildRegex: (tag: string) => RegExp;
  type: string;
};

const CommentDoubleSlash: CommentRegex = {
  buildRegex: (tag: string) => RegExp(`^[\\*\\s]*(\\/\\/)[\\*\\s]*${tag}`),
  type: "CommentDoubleSlash",
} as const;

const CommentNumberSign: CommentRegex = {
  buildRegex: (tag) => RegExp(`^[\\*\\s]*#[\\*\\s]*${tag}`),
  type: "CommentNumberSign",
} as const;

const CommentHtmlElement: CommentRegex = {
  buildRegex: (tag) => RegExp(`^[\\*\\s]*<\!--[\\*\\s]*${tag}[\\*\\s]*-->`),
  type: "CommentHtmlElement",
} as const;

const CommentBlock: CommentRegex = {
  buildRegex: (tag) => RegExp(`^[\\*\\s]*(\\/\\*)[\\*\\s]*${tag}`),
  type: "CommentBlock",
} as const;

const CommentDoubleHyphen: CommentRegex = {
  buildRegex: (tag) => RegExp(`^[\\*\\s]*(--)[\\*\\s]*${tag}`),
  type: "CommentDoubleHyphen",
} as const;

/**
 * vscode languageId
 * https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
 */
export const languageCommentMap: { [languageId: string]: CommentRegex[] } = {
  default: [CommentDoubleSlash, CommentBlock],
  c: [CommentDoubleSlash, CommentBlock],
  cpp: [CommentDoubleSlash, CommentBlock],
  csharp: [CommentDoubleSlash, CommentBlock],
  css: [CommentBlock],
  go: [CommentDoubleSlash, CommentBlock],
  html: [CommentHtmlElement],
  java: [CommentDoubleSlash, CommentBlock],
  javascript: [CommentDoubleSlash, CommentBlock],
  javascriptreact: [CommentDoubleSlash, CommentBlock, CommentHtmlElement],
  typescript: [CommentDoubleSlash, CommentBlock],
  typescriptreact: [CommentDoubleSlash, CommentBlock, CommentHtmlElement],
  python: [CommentNumberSign],
  sql: [CommentDoubleHyphen, CommentBlock],
} as const;

if (import.meta.vitest) {
  const tag = "@git-add-exclude-start";
  test("Test comment //", () => {
    const douhleSlashRegex = CommentDoubleSlash.buildRegex(tag);
    expect(douhleSlashRegex.test(`//${tag}`)).toBe(true);
    expect(douhleSlashRegex.test(`  //   ${tag}  `)).toBe(true);
  });
  test("Test comment #", () => {
    const numberSignRegex = CommentNumberSign.buildRegex(tag);
    expect(numberSignRegex.test(`#${tag}`)).toBe(true);
    expect(numberSignRegex.test(`    #    ${tag}   `)).toBe(true);
  });
  test("Test comment <!-- -->", () => {
    const htmlElementRegex = CommentHtmlElement.buildRegex(tag);
    expect(htmlElementRegex.test(`<!--${tag}-->`)).toBe(true);
    expect(htmlElementRegex.test(`     <!--    ${tag}  -->`)).toBe(true);
  });
  test("Test comment /* */", () => {
    const blockRegex = CommentBlock.buildRegex(tag);
    expect(blockRegex.test(`/*${tag}*/`)).toBe(true);
    expect(blockRegex.test(`     /***  **  ${tag}  */ `)).toBe(true);
  });
  test("Test comment --", () => {
    const doubleHyphenRegex = CommentDoubleHyphen.buildRegex(tag);
    expect(doubleHyphenRegex.test(`--${tag}`)).toBe(true);
    expect(doubleHyphenRegex.test(`     --     ${tag}   `)).toBe(true);
  });
}
