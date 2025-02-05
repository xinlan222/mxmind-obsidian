import {
	ItemView,
	moment,
	Platform,
	Plugin,
	WorkspaceLeaf,
	TFile,
	Menu,
	Notice,
	Workspace,
	MarkdownView,
	PluginSettingTab,
	Setting,
	App
} from "obsidian";

interface MindMapSettings {
	openInBrowser: boolean;
	serverUrl: string;
	defaultTheme: string;
	windowWidth: number;
	windowHeight: number;
	autoSyncTheme: boolean;
	defaultLanguage: string;
}

const DEFAULT_SETTINGS: MindMapSettings = {
	openInBrowser: false,
	serverUrl: "https://www.windlunas.cn:3556",
	defaultTheme: "auto", // auto, light, dark
	windowWidth: 1200,
	windowHeight: 800,
	autoSyncTheme: true,
	defaultLanguage: "zh-CN"
};

let iframe: HTMLIFrameElement | null = null;
let ready = false;
const VIEW_TYPE = "online-mindmap-view";

function getTheme(settings: MindMapSettings) {
	if (settings.defaultTheme !== "auto") {
		return settings.defaultTheme;
	}
	return document.body.hasClass("theme-dark") ? "dark" : "light";
}

function getLanguage(settings: MindMapSettings) {
	if (settings.defaultLanguage) {
		return settings.defaultLanguage;
	}
	const locale = moment.locale();
	const arr = locale.split("-");
	if (arr[1]) {
		arr[1] = arr[1].toString().toUpperCase();
	}
	return arr.join("-");
}

const getUrl = (settings: MindMapSettings) => {
	return `${settings.serverUrl}/?theme=${getTheme(settings)}&lng=${getLanguage(settings)}`;
};

export default class OnlineMindmapPlugin extends Plugin {
	settings: MindMapSettings;
	private externalWindow: Window | null = null;

	async onload() {
		await this.loadSettings();

		// 先注销已存在的视图
		this.app.workspace.detachLeavesOfType(VIEW_TYPE);

		this.registerView(
			VIEW_TYPE,
			(leaf) => new MindmapView(leaf, this.settings)
		);

		const ribbonIconEl = this.addRibbonIcon(
			"brain",
			"思维导图",
			() => {
				if (this.settings.openInBrowser) {
					this.openExternalWindow();
				} else {
					this.activateView();
				}
			}
		);

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!(file instanceof TFile) || file.extension !== "md") return;

				menu.addItem((item) => {
					item.setTitle("在思维导图中打开")
						.setIcon("brain")
						.onClick(async () => {
							const content = await this.app.vault.read(file);
							if (this.settings.openInBrowser) {
								this.openExternalWindow(content);
							} else {
								const view = await this.activateView() as MindmapView;
								view.setMarkdown(content);
							}
						});
				});
			})
		);

		if (this.settings.autoSyncTheme) {
			this.registerEvent(
				this.app.workspace.on("css-change", () => {
					if (this.settings.openInBrowser && this.externalWindow) {
						this.externalWindow.postMessage({
							method: "setTheme",
							params: [getTheme(this.settings)]
						}, this.settings.serverUrl);
					} else {
						postIframeMessage("setTheme", [getTheme(this.settings)], this.settings.serverUrl);
					}
				})
			);
		}

		this.addCommand({
			id: 'open-mindmap',
			name: '打开思维导图',
			callback: () => {
				if (this.settings.openInBrowser) {
					this.openExternalWindow();
				} else {
					this.activateView();
				}
			}
		});

		this.addSettingTab(new MindMapSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		if (this.externalWindow && !this.externalWindow.closed) {
			this.externalWindow.close();
		}
	}

	private openExternalWindow(content?: string) {
		// 如果窗口已经打开且未关闭，就聚焦到该窗口
		if (this.externalWindow && !this.externalWindow.closed) {
			this.externalWindow.focus();
			if (content) {
				this.externalWindow.postMessage({
					method: "setMarkdown",
					params: [content]
				}, this.settings.serverUrl);
			}
			return;
		}

		// 打开新窗口
		const screenWidth = window.screen.width;
		const screenHeight = window.screen.height;
		const width = Math.min(this.settings.windowWidth, screenWidth * 0.8);
		const height = Math.min(this.settings.windowHeight, screenHeight * 0.8);
		const left = (screenWidth - width) / 2;
		const top = (screenHeight - height) / 2;

		const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
		this.externalWindow = window.open(getUrl(this.settings), 'MindMap', features);

		if (this.externalWindow) {
			// 监听窗口加载完成
			this.externalWindow.onload = () => {
				if (content && this.externalWindow) {
					this.externalWindow.postMessage({
						method: "setMarkdown",
						params: [content]
					}, this.settings.serverUrl);
				}
			};

			// 监听窗口关闭
			const checkWindow = setInterval(() => {
				if (this.externalWindow?.closed) {
					clearInterval(checkWindow);
					this.externalWindow = null;
				}
			}, 1000);
		}
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);

		if (leaves.length > 0) {
			// 如果已经有思维导图视图，就使用它
			leaf = leaves[0];
		} else {
			// 在主编辑区域创建新的思维导图视图
			leaf = workspace.getLeaf('tab');
		}

		await leaf.setViewState({
			type: VIEW_TYPE,
			active: true
		});

		// 确保视图可见
		workspace.revealLeaf(leaf);

		return leaf.view;
	}
}

class MindmapView extends ItemView {
	constructor(leaf: WorkspaceLeaf, private settings: MindMapSettings) {
		super(leaf);
		this.icon = "brain";
	}

	getViewType(): string {
		return VIEW_TYPE;
	}

	getDisplayText(): string {
		return "思维导图";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.setAttribute("style", "padding: 0; height: 100%;");

		iframe = container.createEl("iframe", {
			attr: {
				style: "width: 100%; height: 100%; border: none;",
				src: getUrl(this.settings),
			},
		});

		// 监听 iframe 加载完成
		iframe.onload = () => {
			ready = true;
		};

		// 监听来自 iframe 的消息
		window.addEventListener("message", (event) => {
			if (event.origin !== this.settings.serverUrl) return;

			const { type, data } = event.data;
			switch (type) {
				case "ready":
					ready = true;
					break;
				case "save":
					// 处理保存事件
					break;
				case "export":
					// 处理导出事件
					break;
			}
		});
	}

	async onClose() {
		if (iframe) {
			iframe.remove();
			iframe = null;
		}
		ready = false;
	}

	async setMarkdown(content: string) {
		try {
			await waitEditor();
			postIframeMessage("setMarkdown", [content], this.settings.serverUrl);
		} catch (error) {
			new Notice("无法连接到思维导图服务");
		}
	}
}

function waitEditor() {
	return new Promise((resolve, reject) => {
		if (ready) {
			resolve(true);
		} else {
			const t = new Date().getTime();
			const int = setInterval(() => {
				if (ready) {
					clearInterval(int);
					resolve(true);
				} else {
					if (new Date().getTime() - t > 10 * 1000) {
						clearInterval(int);
						reject(false);
					}
				}
			}, 100);
		}
	});
}

function postIframeMessage(method: string, params: Array<any>, serverUrl: string) {
	if (!iframe) return;
	iframe?.contentWindow?.postMessage(
		{
			method,
			params,
		},
		serverUrl
	);
}

function trans(str: string) {
	const map: { [key: string]: string } = {
		"Open as mindmap": "用思维导图打开",
		"Copy image": "复制图片",
		"Image copied to the clipboard.": "图片已经复制到剪切板。",
	};
	return map[str] || str;
}

class MindMapSettingTab extends PluginSettingTab {
	plugin: OnlineMindmapPlugin;

	constructor(app: App, plugin: OnlineMindmapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: '思维导图设置' });

		new Setting(containerEl)
			.setName('在浏览器中打开')
			.setDesc('启用后将在浏览器中打开思维导图，而不是在 Obsidian 中打开')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.openInBrowser)
				.onChange(async (value) => {
					this.plugin.settings.openInBrowser = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('服务器地址')
			.setDesc('思维导图服务器的地址')
			.addText(text => text
				.setPlaceholder('输入服务器地址')
				.setValue(this.plugin.settings.serverUrl)
				.onChange(async (value) => {
					this.plugin.settings.serverUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('主题')
			.setDesc('选择思维导图的主题')
			.addDropdown(dropdown => dropdown
				.addOption('auto', '自动（跟随 Obsidian）')
				.addOption('light', '亮色')
				.addOption('dark', '暗色')
				.setValue(this.plugin.settings.defaultTheme)
				.onChange(async (value) => {
					this.plugin.settings.defaultTheme = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('自动同步主题')
			.setDesc('启用后将自动同步 Obsidian 的主题变化')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSyncTheme)
				.onChange(async (value) => {
					this.plugin.settings.autoSyncTheme = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('默认语言')
			.setDesc('设置思维导图的默认语言')
			.addDropdown(dropdown => dropdown
				.addOption('zh-CN', '简体中文')
				.addOption('en-US', 'English')
				.setValue(this.plugin.settings.defaultLanguage)
				.onChange(async (value) => {
					this.plugin.settings.defaultLanguage = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: '浏览器窗口设置' });

		new Setting(containerEl)
			.setName('窗口宽度')
			.setDesc('浏览器窗口的默认宽度（像素）')
			.addText(text => text
				.setPlaceholder('输入窗口宽度')
				.setValue(String(this.plugin.settings.windowWidth))
				.onChange(async (value) => {
					const width = Number(value);
					if (!isNaN(width) && width > 0) {
						this.plugin.settings.windowWidth = width;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('窗口高度')
			.setDesc('浏览器窗口的默认高度（像素）')
			.addText(text => text
				.setPlaceholder('输入窗口高度')
				.setValue(String(this.plugin.settings.windowHeight))
				.onChange(async (value) => {
					const height = Number(value);
					if (!isNaN(height) && height > 0) {
						this.plugin.settings.windowHeight = height;
						await this.plugin.saveSettings();
					}
				}));
	}
}
