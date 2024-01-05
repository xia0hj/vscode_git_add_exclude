import { RepositoryWatcher } from "@src/RepositoryWatcher";
import { Repository, type GitExtension } from "@src/common/git";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
    const gitExtensionApi = vscode.extensions
        .getExtension<GitExtension>("vscode.git")
        ?.exports?.getAPI(1);
    if (gitExtensionApi === undefined) {
        console.warn(
            "Extension vscode.git-add-exclude failed to activate, can not found dependency vscode.git.",
        );
        return;
    }

    const watcherMap = new Map<string, RepositoryWatcher>();

    const watchRepository = (repository: Repository) => {
        const repositoryUri = repository.rootUri.toString();
        if (watcherMap.has(repositoryUri)) {
            return;
        }
        const repositoryWatcher = new RepositoryWatcher(repository);
        repositoryWatcher.watchOperationAdd();
        context.subscriptions.push(repositoryWatcher);
        watcherMap.set(repositoryUri, repositoryWatcher);
    };

    if (gitExtensionApi.repositories.length > 0) {
        gitExtensionApi.repositories.forEach(watchRepository);
    }
    const watchRepositoryOpen =
        gitExtensionApi.onDidOpenRepository(watchRepository);
    context.subscriptions.push(watchRepositoryOpen);

    const watchRepositoryClose = gitExtensionApi.onDidCloseRepository(
        (repository) => {
            const repositoryUri = repository.rootUri.toString();
            watcherMap.get(repositoryUri)?.dispose();
            watcherMap.delete(repositoryUri);
        },
    );
    context.subscriptions.push(watchRepositoryClose);
}

export function deactivate() {}
