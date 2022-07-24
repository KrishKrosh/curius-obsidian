import * as fs from "fs";
import { App } from "obsidian";
import { getVaultPath } from "./util";

// ex https://curius.app/api/users/1557/links?page=0
const curiusUrl = "https://curius.app/api/users/";

//fetch one page of curius data and return it as a list of highlights
//ex https://curius.app/api/users/1557/links?page=0
async function fetchCuriusData(userId: number, pageNumber: number) {
	const url = `https://curius-middleware.krishatreplit.repl.co/?domain=${curiusUrl}${userId}/links?page=${pageNumber}`;
	try {
		const response = await fetch(url);
		const json = await response.json();
		return json.userSaved;
	} catch (error) {
		console.error(error);
		return [];
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function writeMarkdownFile(curiusObject: any, app: App) {
	let curiusTemplate = `
## [${curiusObject["title"]}](${curiusObject["link"]})
*${curiusObject["createdDate"]}*

`;
	for (const highlight of curiusObject["highlights"]) {
		curiusTemplate += `- ${highlight["highlight"]}\n`;
	}

	const filePath = getVaultPath(app) + `/${curiusObject["title"]}.md`;
	if (fs.existsSync(filePath)) {
		return false;
	}

	fs.writeFileSync(filePath, curiusTemplate);
	console.log(`wrote ${filePath}`);
	return true;
}

export async function curiusToMarkdown(userId: number, app: App) {
	let fullyUpdated = false;
	let requestsMade = 0;
	while (!fullyUpdated && requestsMade < 200) {
		const curiusData = await fetchCuriusData(userId, requestsMade);
		if (curiusData.length === 0) {
			fullyUpdated = true;
		}
		for (const curiusObject of curiusData) {
			const success = writeMarkdownFile(curiusObject, app);
			if (!success) {
				fullyUpdated = true;
				break;
			}
		}
		requestsMade++;
	}
}
