import { languageCommentMap } from "@src/util/comment_matcher";
import { describe, expect, test } from "vitest";
import { type LineInfo } from "@src/common/type";

type FilterParameter = {
    languageId: string;
    textSplitedByLine: string[];
    startTag: string;
    endTag: string;
};

export function filterByCommentTag({
    textSplitedByLine,
    languageId,
    startTag,
    endTag,
}: FilterParameter): { stageText: string[]; unstageLineList: LineInfo[] } {
    const targetCommentRegex =
        languageCommentMap[languageId] ?? languageCommentMap.default;

    /**
     * @key comment type
     * @value start line
     */
    const commentStartLineMap = new Map<string, number[]>();

    /**
     * tagRange[n][0] is matched comment start line
     * tagRange[n][1] is matched comment end line
     */
    const tagRange: number[][] = [];

    textSplitedByLine.forEach((lineText, lineNumber) => {
        for (const commentRegex of targetCommentRegex) {
            if (commentRegex.buildRegex(startTag).test(lineText)) {
                const startLineStack =
                    commentStartLineMap.get(commentRegex.type) ?? [];
                startLineStack.push(lineNumber);
                commentStartLineMap.set(commentRegex.type, startLineStack);
            } else if (commentRegex.buildRegex(endTag).test(lineText)) {
                const startLineStack = commentStartLineMap.get(
                    commentRegex.type,
                );
                const matchedStartLine = startLineStack?.pop();
                if (matchedStartLine != null) {
                    tagRange.push([matchedStartLine, lineNumber]);
                }
            }
        }
    });

    if (tagRange.length === 0) {
        return { stageText: textSplitedByLine, unstageLineList: [] };
    }

    const mergedRange: number[][] = [tagRange[0]];
    tagRange.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (let i = 1; i < tagRange.length; i++) {
        const lastRange = mergedRange[mergedRange.length - 1];
        const curRange = tagRange[i];
        if (curRange[0] <= lastRange[1]) {
            lastRange[1] = Math.max(lastRange[1], curRange[1]);
        } else {
            mergedRange.push(curRange);
        }
    }

    const stageText = getStageText(textSplitedByLine, mergedRange);
    const unstageLineList = getUnstageLineList(textSplitedByLine, mergedRange);

    return {
        stageText,
        unstageLineList,
    };
}

function getStageText(
    textSplitedByLine: string[],
    range: number[][],
): string[] {
    let stageText: string[] = [];
    for (let i = 0; i < range.length; i++) {
        const lastEndLine = i === 0 ? -1 : range[i - 1][1];
        const curStartLine = range[i][0];
        if (lastEndLine + 1 < curStartLine) {
            stageText = stageText.concat(
                textSplitedByLine.slice(lastEndLine + 1, curStartLine),
            );
        }
    }

    const lastEndLine = range[range.length - 1][1];
    if (lastEndLine + 1 < textSplitedByLine.length) {
        stageText = stageText.concat(
            textSplitedByLine.slice(lastEndLine + 1, textSplitedByLine.length),
        );
    }

    return stageText;
}

function getUnstageLineList(
    textSplitedByLine: string[],
    range: number[][],
): LineInfo[] {
    const unstageLineList: LineInfo[] = [];
    range.forEach(([tagStartLine, tagEndLine]) => {
        for (let i = tagStartLine; i <= tagEndLine; i++) {
            unstageLineList.push({
                lineNumber: i,
                text: textSplitedByLine[i],
            });
        }
    });
    return unstageLineList;
}

import.meta.vitest &&
    describe("filter.ts", () => {
        test("Test filter", () => {
            const textSplitedByLine = [
                "import { filterByCommentTag } from '@src/regex/filter';",
                "import { suite, test } from 'mocha';",
                "",
                "suite('test filter text', function(){",
                "//@git-add-exclude-start",
                "console.log('DO NOT COMMIT THIS LINE !!!');",
                "//@git-add-exclude-end",

                "         //@git-add-exclude-start",
                "const foo = 1;",
                "    //@git-add-exclude-start",
                "const bar = 2;",
                "//@git-add-exclude-end",
                "const baz = 3;",
                "//@git-add-exclude-end",
                "const qux = 4;",
            ];

            const languageId = "javascript";
            const startTag = "@git-add-exclude-start";
            const endTag = "@git-add-exclude-end";

            const { stageText, unstageLineList } = filterByCommentTag({
                textSplitedByLine,
                languageId,
                startTag,
                endTag,
            });

            expect(stageText.length).toBe(5);
            expect(unstageLineList.length).toBe(10);
        });
    });
