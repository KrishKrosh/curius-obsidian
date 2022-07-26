import {
	addIcon,
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { curiusToMarkdown } from "./curius";
import { CuriusIcon } from "./icons";

// Remember to rename these classes and interfaces!

interface CuriusPluginSettings {
	CuriusId: string;
	SidebarIcon: boolean;
}

const DEFAULT_SETTINGS: CuriusPluginSettings = {
	CuriusId: "",
	SidebarIcon: true,
};

const MINUTE = 60 * 1000;

export default class CuriusPlugin extends Plugin {
	settings: CuriusPluginSettings;

	async onload() {
		const curiusStatusEl = this.addStatusBarItem();
		curiusStatusEl.setText("Waiting for Curius...");
		await this.loadSettings();
		addIcon("curius", CuriusIcon);

		const syncCurius = async () => {
			// Called when the user clicks the icon.
			new Notice("Syncing with Curius...");
			curiusStatusEl.setText("Syncing with Curius...");
			await curiusToMarkdown(parseInt(this.settings.CuriusId), this.app);

			curiusStatusEl.setText("Curius Synced");
			new Notice("Sync complete!");
		};
		await syncCurius();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.settings.SidebarIcon
			? this.addRibbonIcon("curius", "Sync With Curius", async () => {
					await syncCurius();
					// eslint-disable-next-line no-mixed-spaces-and-tabs
			  })
			: null;
		// Perform additional things with the ribbon
		ribbonIconEl?.addClass("curius-ribbon-class");

		// TODO: add status bar to the bottom of the page

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "curius-sync",
			name: "Sync With Curius",
			callback: async () => {
				await syncCurius();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CuriusSettingTab(this.app, this));

		// TODO: auto sync with curius using interval
		this.registerInterval(
			window.setInterval(async () => {
				curiusStatusEl.setText("Syncing with Curius...");
				const err = await curiusToMarkdown(
					parseInt(this.settings.CuriusId),
					this.app
				);
				curiusStatusEl.setText(err ? "Curius Error" : "Curius Synced");
			}, 10 * MINUTE)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CuriusSettingTab extends PluginSettingTab {
	plugin: CuriusPlugin;

	constructor(app: App, plugin: CuriusPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Curius Obsidian Settings" });
		containerEl.createEl("a", {
			text: "Click here to get your ID",
			href: "https://Get-Curius-ID.krishatreplit.repl.co",
		}),
			containerEl.createEl("br", {}),
			new Setting(containerEl)
				.setName("Your Curius ID")
				.setDesc("")
				.addText((text) =>
					text
						.setPlaceholder("Put ID here")
						.setValue(this.plugin.settings.CuriusId)
						.onChange(async (value) => {
							console.log("Curius Id: " + value);
							this.plugin.settings.CuriusId = value;
							await this.plugin.saveSettings();
						})
				);
		new Setting(containerEl)
			.setName("Show Curius Icon in Sidebar (Reload Required)")
			.setDesc("")
			.addToggle((checked) =>
				checked
					.setValue(this.plugin.settings.SidebarIcon)
					.onChange(async (value) => {
						this.plugin.settings.SidebarIcon = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
