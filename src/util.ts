import { FileSystemAdapter, App } from "obsidian";

export function getVaultPath(app: App) {
	const adapter = app.vault.adapter;
	if (adapter instanceof FileSystemAdapter) {
		return adapter.getBasePath();
	}
	return null;
}
