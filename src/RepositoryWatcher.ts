import { filterByCommentTag } from "@src/util/filter";
import { type Repository } from "@src/common/git";
import * as vscode from "vscode";
import { type LineInfo } from "@src/common/type";

export interface RepositoryInternalApi extends Repository {
  repository: {
    onDidRunOperation: (
      callback: (param: { operation: { kind: string } }) => void,
    ) => vscode.Disposable;
    stage: (uri: vscode.Uri, stageText: string) => void;
  };
}

export class RepositoryWatcher implements vscode.Disposable {
  repository: RepositoryInternalApi;

  disposable?: vscode.Disposable;

  constructor(repository: Repository) {
    this.repository = repository as RepositoryInternalApi;

    if (
      this.repository.repository == null ||
      this.repository.repository.onDidRunOperation == null ||
      this.repository.repository.stage == null
    ) {
      throw new Error(
        "Can not read extension vscode.git repository internal api !!!",
      );
    }
  }

  watchOperationAdd() {
    this.disposable = this.repository.repository.onDidRunOperation(
      async ({ operation }) => {
        if (operation.kind !== "Add") {
          return;
        }

        const config = getExtensionConfig();
        const unstageFileLineMap = new Map<string, LineInfo[]>();

        this.repository.state.indexChanges.forEach(async ({ uri }) => {
          const textDocument = await vscode.workspace.openTextDocument(uri);
          const textSplitedByLine: string[] = [];
          for (let line = 0; line < textDocument.lineCount; line++) {
            const lineText = textDocument.getText(
              new vscode.Range(line, 0, line + 1, 0),
            );
            textSplitedByLine.push(lineText);
          }
          const { stageText, unstageLineList } = filterByCommentTag({
            languageId: textDocument.languageId,
            textSplitedByLine,
            startTag: config.blockStartTag,
            endTag: config.blockEndTag,
          });
          this.repository.repository.stage(uri, stageText.join(""));

          if (unstageLineList.length > 0) {
            unstageFileLineMap.set(uri.path, unstageLineList);
          }
        });

        this.afterUnstage(unstageFileLineMap);
      },
    );
  }

  async afterUnstage(unstageFileLineMap: Map<string, LineInfo[]>) {
    if (unstageFileLineMap.size === 0) {
      return;
    }
    let totalUnstageLineCount = 0;
    unstageFileLineMap.forEach(
      (lineList) => (totalUnstageLineCount += lineList.length),
    );
    const isShowDetail = await vscode.window.showInformationMessage(
      `Unstage ${totalUnstageLineCount} lines from ${unstageFileLineMap.size} files.`,
      "Show detail",
    );
    if (isShowDetail == null) {
      return;
    }

    // todo 打开一个编辑器展示详情
    const textDocment = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: '666'
    })
    vscode.window.showTextDocument(textDocment, {
      viewColumn: vscode.ViewColumn.Beside,
      preview: true
    })
  }

  dispose() {
    this.disposable?.dispose();
  }
}

function getExtensionConfig() {
  const configGetter = vscode.workspace.getConfiguration("git-add-exclude");

  const blockStartTag = configGetter.get<string>(
    "blockStartTag",
    "@git-add-exclude-start",
  );
  const blockEndTag = configGetter.get<string>(
    "blockEndTag",
    "@git-add-exclude-end",
  );

  const extensionConfig = {
    blockStartTag,
    blockEndTag,
  };

  console.log("read config", extensionConfig);

  return extensionConfig;
}
