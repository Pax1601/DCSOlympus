const path = require("path");
const fs = require("fs");
const { logger } = require("./filesystem");

const DEFAULT_MODS_ROOT = path.join(process.env.USERPROFILE || "", "Saved Games", "DCS", "Mods");
const TASK_ROLE_MAP = {
	2: "SEAD",
	3: "CAS",
	4: "Transport",
	5: "AFAC",
	6: "Recon",
	7: "Trainer",
	8: "Strike",
	9: "Strike",
	10: "Fighter Sweep",
	11: "CAP",
	12: "Intercept",
	13: "Escort",
	14: "CAS",
	15: "CAS",
	16: "Ground Attack",
	17: "Anti-ship",
	18: "Escort",
	19: "Anti-submarine",
	20: "AWACS",
	22: "Tanker",
	28: "Transport",
	30: "Refuel",
	31: "Intercept",
	32: "Intercept"
};

function dedupe(list) {
	return Array.from(new Set(list.filter(Boolean)));
}

function sanitizeShortLabel(value) {
	if (!value) {
		return "";
	}
	return value.replace(/\s+/g, "").replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase();
}

function stripLocalizationWrapper(value) {
	if (!value) {
		return value;
	}
	return value.replace(/^_\(["']?/, "").replace(/["']?\)$/, "");
}

class ModInventoryService {
	constructor(options = {}) {
		this.modsRoot = options.modsRoot || DEFAULT_MODS_ROOT;
		this.savedGamesRoot = options.savedGamesRoot || path.dirname(this.modsRoot);
		this.cacheFile = options.cacheFile || path.join(__dirname, "..", "mods-inventory.json");
		this.inventory = [];
	}

	discover() {
		this.inventory = [];
		try {
			this._discoverAircraftMods();
			this._discoverTechMods();
			this.inventory.sort((a, b) => a.displayName.localeCompare(b.displayName));
			this._saveCache();
		} catch (error) {
			logger.error(`[mods] Failed to build inventory: ${error}`);
		}
		return this.inventory;
	}

	getInventory() {
		if (this.inventory.length === 0 && fs.existsSync(this.cacheFile)) {
			try {
				this.inventory = JSON.parse(fs.readFileSync(this.cacheFile));
			} catch (error) {
				logger.log(`[mods] Unable to parse inventory cache: ${error}`);
			}
		}
		return this.inventory;
	}

	_discoverAircraftMods() {
		const base = path.join(this.modsRoot, "aircraft");
		if (!fs.existsSync(base)) {
			return;
		}
		const entries = fs.readdirSync(base, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isDirectory()) {
				continue;
			}
			const sourcePath = path.join(base, entry.name);
			const entryFile = path.join(sourcePath, "entry.lua");
			const entryMetadata = this._readEntryMetadata(entryFile);
			const payloadMetadata = this._readPayloadMetadata(sourcePath);
			const id = payloadMetadata?.unitType || entryMetadata.typeName || entryMetadata.displayName || entry.name;
			const issues = [];
			if (!payloadMetadata?.relativePath) {
				issues.push("Payload file not found");
			}
			const descriptor = {
				id,
				modId: entry.name,
				displayName: payloadMetadata?.displayName || entryMetadata.displayName || id,
				shortName: sanitizeShortLabel(entryMetadata.shortName || entryMetadata.displayName || id),
				category: "Aircraft",
				coalition: entryMetadata.coalition || "blue",
				sourcePath,
				entryFile: fs.existsSync(entryFile) ? entryFile : undefined,
				unitPayloadPath: payloadMetadata?.absolutePath,
				unitPayloadRelativePath: payloadMetadata?.relativePath,
				hasPayloads: Boolean(payloadMetadata?.relativePath),
				loadouts: payloadMetadata?.loadouts?.length ? payloadMetadata.loadouts : this._defaultLoadouts(),
				length: entryMetadata.length || payloadMetadata?.length || null,
				description: entryMetadata.description || "",
				folderType: "aircraft",
				issues,
				aliases: this._buildAliases(id, entry.name)
			};
			this.inventory.push(descriptor);
		}
	}

	_discoverTechMods() {
		const base = path.join(this.modsRoot, "tech");
		if (!fs.existsSync(base)) {
			return;
		}
		const entries = fs.readdirSync(base, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isDirectory()) {
				continue;
			}
			const sourcePath = path.join(base, entry.name);
			const entryFile = path.join(sourcePath, "entry.lua");
			const entryMetadata = this._readEntryMetadata(entryFile);
			const techUnits = this._readTechUnits(sourcePath);
			if (techUnits.length === 0) {
				const id = entryMetadata.typeName || entryMetadata.displayName || entry.name;
				this.inventory.push({
					id,
					modId: entry.name,
					displayName: entryMetadata.displayName || id,
					shortName: sanitizeShortLabel(entryMetadata.shortName || id),
					category: "Aircraft",
					coalition: entryMetadata.coalition || "blue",
					sourcePath,
					entryFile: fs.existsSync(entryFile) ? entryFile : undefined,
					unitPayloadPath: undefined,
					unitPayloadRelativePath: undefined,
					hasPayloads: false,
					loadouts: this._defaultLoadouts(),
					length: entryMetadata.length || null,
					description: entryMetadata.description || "",
					folderType: "tech",
					issues: ["No unit definitions detected"],
					aliases: this._buildAliases(id, entry.name)
				});
				continue;
			}
			for (const unit of techUnits) {
				const id = unit.id || entryMetadata.typeName || unit.displayName || entry.name;
				this.inventory.push({
					id,
					modId: entry.name,
					displayName: unit.displayName || entryMetadata.displayName || id,
					shortName: sanitizeShortLabel(unit.shortName || unit.displayName || id),
					category: "Aircraft",
					coalition: entryMetadata.coalition || "blue",
					sourcePath,
					entryFile: fs.existsSync(entryFile) ? entryFile : undefined,
					unitPayloadPath: undefined,
					unitPayloadRelativePath: undefined,
					hasPayloads: false,
					loadouts: this._defaultLoadouts(),
					length: unit.length || entryMetadata.length || null,
					description: entryMetadata.description || "",
					folderType: "tech",
					issues: [],
					aliases: this._buildAliases(id, entry.name, unit.aliases)
				});
			}
		}
	}

	_buildAliases(id, modId, extra = []) {
		const list = [id, id?.toLowerCase(), modId, modId?.toLowerCase(), ...(extra || [])];
		return dedupe(list.filter(Boolean));
	}

	_defaultLoadouts(label) {
		return [
			{
				name: "Clean Ferry",
				items: [],
				enabled: true,
				code: "Clean Ferry",
				roles: ["No task"],
				description: label || "Autogenerated"
			}
		];
	}

	_readEntryMetadata(entryPath) {
		const metadata = {};
		if (!fs.existsSync(entryPath)) {
			return metadata;
		}
		try {
			const content = fs.readFileSync(entryPath, "utf-8");
			const displayMatch = content.match(/displayName\s*=\s*_?\(?["']([^"']+)["']/i);
			if (displayMatch) {
				metadata.displayName = displayMatch[1];
			}
			const shortMatch = content.match(/shortName\s*=\s*_?\(?["']([^"']+)["']/i);
			if (shortMatch) {
				metadata.shortName = shortMatch[1];
			}
			const lengthMatch = content.match(/length\s*=\s*([0-9]+\.?[0-9]*)/i);
			if (lengthMatch) {
				metadata.length = parseFloat(lengthMatch[1]);
			}
			const descMatch = content.match(/info\s*=\s*_?\(?["']([^"']+)["']/i);
			if (descMatch) {
				metadata.description = descMatch[1];
			}
			const makeFlyableMatch = content.match(/(?:make_flyable|MAC_flyable)\s*\(\s*["']([^"']+)["']/i);
			if (makeFlyableMatch) {
				metadata.typeName = makeFlyableMatch[1];
			} else {
				const logBookMatch = content.match(/LogBook\s*=\s*{[^}]+type\s*=\s*["']([^"']+)["']/i);
				if (logBookMatch) {
					metadata.typeName = logBookMatch[1];
				}
			}
		} catch (error) {
			logger.log(`[mods] Unable to parse metadata from ${entryPath}: ${error}`);
		}
		return metadata;
	}

	_readPayloadMetadata(sourcePath) {
		const payloadDir = path.join(sourcePath, "UnitPayloads");
		if (!fs.existsSync(payloadDir)) {
			return undefined;
		}
		const files = fs.readdirSync(payloadDir).filter((file) => file.toLowerCase().endsWith(".lua"));
		for (const file of files) {
			const absolutePath = path.join(payloadDir, file);
			const parsed = this._parsePayloadFile(absolutePath);
			if (!parsed) {
				continue;
			}
			return {
				unitType: parsed.unitType,
				displayName: parsed.displayName,
				loadouts: parsed.loadouts,
				relativePath: this._relativeToSavedGames(absolutePath),
				absolutePath
			};
		}
		return undefined;
	}

	_parsePayloadFile(filePath) {
		try {
			const content = fs.readFileSync(filePath, "utf-8");
			const sanitized = content
				.replace(/--\[\[[\s\S]*?\]\]/g, "")
				.replace(/--.*$/gm, "")
				.replace(/\r/g, "");
			const payloadKeyMatch = sanitized.match(/\["payloads"\]/i);
			const payloadIndex = payloadKeyMatch ? payloadKeyMatch.index : -1;
			const headerSection = payloadIndex > 0 ? sanitized.slice(0, payloadIndex) : sanitized;
			const unitType = this._matchString(headerSection, "name");
			if (!unitType) {
				return undefined;
			}
			const payloadBlock = this._extractTableBlock(sanitized, "payloads");
			const loadouts = [];
			if (payloadBlock) {
				const tables = this._splitTopLevelTables(payloadBlock);
				for (const block of tables) {
					const name = this._matchString(block, "name") || `Payload ${loadouts.length + 1}`;
					const displayName = this._matchString(block, "displayName") || name;
					const tasks = this._matchTasks(block);
					const roles = this._mapTasksToRoles(tasks);
					loadouts.push({
						name: displayName,
						items: [],
						enabled: true,
						code: displayName,
						roles: roles.length ? roles : ["No task"]
					});
				}
			}
			return { unitType, displayName: unitType, loadouts };
		} catch (error) {
			logger.log(`[mods] Unable to parse payloads from ${filePath}: ${error}`);
			return undefined;
		}
	}

	_extractTableBlock(content, keyword) {
		const idx = content.indexOf(keyword);
		if (idx === -1) {
			return undefined;
		}
		const braceStart = content.indexOf("{", idx);
		if (braceStart === -1) {
			return undefined;
		}
		let depth = 0;
		for (let i = braceStart; i < content.length; i += 1) {
			const char = content[i];
			if (char === "{") {
				depth += 1;
			} else if (char === "}") {
				depth -= 1;
				if (depth === 0) {
					return content.slice(braceStart, i + 1);
				}
			}
		}
		return undefined;
	}

	_splitTopLevelTables(block) {
		if (!block) {
			return [];
		}
		const inner = block.slice(1, -1);
		const tables = [];
		let depth = 0;
		let startIndex = -1;
		for (let i = 0; i < inner.length; i += 1) {
			const char = inner[i];
			if (char === "{") {
				if (depth === 0) {
					startIndex = i;
				}
				depth += 1;
			} else if (char === "}") {
				depth -= 1;
				if (depth === 0 && startIndex !== -1) {
					tables.push(inner.slice(startIndex, i + 1));
					startIndex = -1;
				}
			}
		}
		return tables;
	}

	_matchString(block, key) {
		if (!block) {
			return undefined;
		}
		const pattern = `(?:\\["${key}"\\]|${key})`;
		const regex = new RegExp(`${pattern}\\s*=\\s*(?:_\\()?["']([^"']+)["']\\)?`, "i");
		const match = block.match(regex);
		if (match) {
			return stripLocalizationWrapper(match[1]);
		}
		return undefined;
	}

	_matchTasks(block) {
		const tasksMatch = block.match(/(?:\["tasks"\]|tasks)\s*=\s*{([^}]*)}/i);
		if (!tasksMatch) {
			return [];
		}
		const digits = tasksMatch[1].match(/[0-9]+/g);
		if (!digits) {
			return [];
		}
		return digits.map((n) => parseInt(n, 10));
	}

	_mapTasksToRoles(tasks) {
		if (!tasks || tasks.length === 0) {
			return [];
		}
		const roles = tasks.map((taskId) => TASK_ROLE_MAP[taskId] || "No task");
		return dedupe(roles);
	}

	_readTechUnits(sourcePath) {
		const descriptors = [];
		const entries = fs.readdirSync(sourcePath, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isDirectory()) {
				continue;
			}
			if (!entry.name.toLowerCase().endsWith(".lua") || entry.name.toLowerCase() === "entry.lua") {
				continue;
			}
			if (entry.name.toLowerCase().startsWith("db_")) {
				continue;
			}
			const filePath = path.join(sourcePath, entry.name);
			const unit = this._parseTechUnitFile(filePath);
			if (unit) {
				descriptors.push(unit);
			}
		}
		return descriptors;
	}

	_parseTechUnitFile(filePath) {
		try {
			const content = fs.readFileSync(filePath, "utf-8");
			const nameMatch = content.match(/Name\s*=\s*['"]([^'"]+)['"]/i);
			const displayMatch = content.match(/DisplayName\s*=\s*_?\(?["']([^"']+)["']/i);
			const lengthMatch = content.match(/length\s*=\s*([0-9]+\.?[0-9]*)/i);
			const id = nameMatch ? nameMatch[1] : path.basename(filePath, ".lua");
			return {
				id,
				displayName: displayMatch ? stripLocalizationWrapper(displayMatch[1]) : id,
				shortName: sanitizeShortLabel(id),
				length: lengthMatch ? parseFloat(lengthMatch[1]) : null,
				aliases: [path.basename(filePath, ".lua"), id]
			};
		} catch (error) {
			logger.log(`[mods] Unable to parse ${filePath}: ${error}`);
			return undefined;
		}
	}

	_relativeToSavedGames(targetPath) {
		if (!this.savedGamesRoot) {
			return targetPath;
		}
		const relative = path.relative(this.savedGamesRoot, targetPath);
		return relative.split(path.sep).join("\\");
	}

	_saveCache() {
		try {
			fs.writeFileSync(this.cacheFile, JSON.stringify(this.inventory, null, 2));
		} catch (error) {
			logger.log(`[mods] Unable to save inventory cache: ${error}`);
		}
	}
}

module.exports = {
	ModInventoryService
};
