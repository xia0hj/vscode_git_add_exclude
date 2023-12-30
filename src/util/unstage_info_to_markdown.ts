import { type LineInfo } from "@src/common/type";
import { describe } from "vitest";

export function convertUnstageInfoToMarkdown(unstageFileLineMap: Map<string, LineInfo[]>): string{
  // todo
  return [...unstageFileLineMap].toString()
}

import.meta.vitest && describe('unstage_info_to_markdown.ts', () => {

})