import { RepositoryWatcher } from "@src/git/RepositoryWatcher";
import { GitExtension } from "@src/git/git_extension_api";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const gitExtensionApi = vscode.extensions
    .getExtension<GitExtension>("vscode.git")
    ?.exports?.getAPI(1);
  if (gitExtensionApi === undefined) {
    console.warn(
      "Extension vscode.git-add-exclude failed to activate, can not found dependency vscode.git."
    );
    return;
  }

  const watcherMap = new Map<string, RepositoryWatcher>();

  const watchRepositoryOpen = gitExtensionApi.onDidOpenRepository(
    (repository) => {
      const repositoryWatcher = new RepositoryWatcher(repository);
      repositoryWatcher.watchOperationAdd();
      context.subscriptions.push(repositoryWatcher);
      watcherMap.set(repository.rootUri.toString(), repositoryWatcher);
    }
  );
  context.subscriptions.push(watchRepositoryOpen);

  const watchRepositoryClose = gitExtensionApi.onDidCloseRepository((repository) => {
    watcherMap.get(repository.rootUri.toString())?.dispose();
  });
  context.subscriptions.push(watchRepositoryClose);
}

export function deactivate() {}
