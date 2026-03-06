const path = require("path");
const fs = require("fs");
const { logger } = require("./filesystem");

const DEFAULT_MODS_ROOT = path.join(process.env.USERPROFILE || "", "Saved Games", "DCS", "Mods");
const DEFAULT_MOD_DENYLIST = [
	"tacview",
	"srs",
	"simple radio",
	"lotatc",
	"dcs-bios",
	"dcsbios",
	"vaicom",
	"simshaker",
	"scratchpad",
	"ovgme"
];
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

function normalizeFilterToken(value) {
	if (!value) {
		return "";
	}
	return value
		.toString()
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");
}

class ModInventoryService {
	constructor(options = {}) {
		this.modsRoot = options.modsRoot || DEFAULT_MODS_ROOT;
		this.savedGamesRoot = options.savedGamesRoot || path.dirname(this.modsRoot);
		this.cacheFile = options.cacheFile || path.join(__dirname, "..", "mods-inventory.json");
		this.modDenylist = this._normalizeFilterList(options.modDenylist || DEFAULT_MOD_DENYLIST);
		this.modAllowlist = this._normalizeFilterList(options.modAllowlist || []);
		this.inventory = [];
		this.previousInventoryById = new Map();
		this.hasPreviousInventory = false;
	}

	discover() {
		const previous = this._readCachedInventory();
		this.previousInventoryById = new Map();
		previous.forEach((entry) => {
			if (entry?.id) {
				this.previousInventoryById.set(entry.id, entry);
			}
		});
		this.hasPreviousInventory = previous.length > 0;
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
		if (this.inventory.length === 0) {
			this.inventory = this._readCachedInventory();
		}
		return this.inventory;
	}

	_normalizeFilterList(values) {
		if (!Array.isArray(values)) {
			return [];
		}
		return dedupe(values.map((value) => normalizeFilterToken(value)).filter(Boolean));
	}

	_collectFilterCandidates(entryName, entryMetadata = {}, sourcePath) {
		const rawValues = [
			entryName,
			entryMetadata?.displayName,
			entryMetadata?.typeName,
			entryMetadata?.shortName,
			sourcePath ? path.basename(sourcePath) : undefined
		];
		return dedupe(rawValues.map((value) => normalizeFilterToken(value)).filter(Boolean));
	}

	_matchesFilter(candidates, filters) {
		if (!Array.isArray(candidates) || !Array.isArray(filters) || filters.length === 0) {
			return false;
		}
		return filters.some((filterToken) => candidates.some((candidate) => candidate.includes(filterToken)));
	}

	_shouldSkipByFilter(entryName, entryMetadata = {}, sourcePath) {
		const candidates = this._collectFilterCandidates(entryName, entryMetadata, sourcePath);
		if (this._matchesFilter(candidates, this.modAllowlist)) {
			return false;
		}
		if (this._matchesFilter(candidates, this.modDenylist)) {
			logger.log(`[mods] Skipping denylisted mod folder: ${entryName}`);
			return true;
		}
		return false;
	}

	_isDirectoryLike(basePath, entry) {
		if (!entry || !entry.name) {
			return false;
		}
		if (entry.isDirectory && entry.isDirectory()) {
			return true;
		}
		try {
			return fs.statSync(path.join(basePath, entry.name)).isDirectory();
		} catch (error) {
			return false;
		}
	}

	_listDirectoryEntries(basePath) {
		try {
			return fs
				.readdirSync(basePath, { withFileTypes: true })
				.filter((entry) => this._isDirectoryLike(basePath, entry));
		} catch (error) {
			logger.log(`[mods] Unable to list directories in ${basePath}: ${error}`);
			return [];
		}
	}

	_discoverAircraftMods() {
		const base = path.join(this.modsRoot, "aircraft");
		if (!fs.existsSync(base)) {
			return;
		}
		const entries = this._listDirectoryEntries(base);
		for (const entry of entries) {
			const sourcePath = path.join(base, entry.name);
			const entryFile = path.join(sourcePath, "entry.lua");
			const entryMetadata = this._readEntryMetadata(entryFile);
			if (this._shouldSkipByFilter(entry.name, entryMetadata, sourcePath)) {
				continue;
			}
			const fallbackId = entryMetadata.typeName || entryMetadata.displayName || entry.name;
			const fallbackAliases = this._buildAliases(fallbackId, entry.name);
			const payloadMetadata = this._readPayloadMetadata(sourcePath, fallbackId, fallbackAliases);
			const id = payloadMetadata?.unitType || fallbackId;
			const aliases = this._buildAliases(id, entry.name);
			const liveries = this._readLiveries(sourcePath, id, aliases);
			const issues = [];
			if (!payloadMetadata?.relativePath) {
				issues.push("Payload file not found");
			}
			const payloadStatus = this._derivePayloadStatus(id, payloadMetadata);
			if (payloadMetadata && (payloadStatus === "new" || payloadStatus === "updated")) {
				const statusLabel = payloadStatus === "updated" ? "updated" : "new";
				logger.log(`[mods] ${id}: ${statusLabel} payload detected (${payloadMetadata.relativePath})`);
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
				aliases,
				liveries,
				liveryCount: Object.keys(liveries).length,
				payloadStatus,
				unitPayloadSignature: payloadMetadata?.signature
			};
			this.inventory.push(descriptor);
		}
	}

	_discoverTechMods() {
		const base = path.join(this.modsRoot, "tech");
		if (!fs.existsSync(base)) {
			return;
		}
		const entries = this._listDirectoryEntries(base);
		for (const entry of entries) {
			const sourcePath = path.join(base, entry.name);
			const entryFile = path.join(sourcePath, "entry.lua");
			const entryMetadata = this._readEntryMetadata(entryFile);
			if (this._shouldSkipByFilter(entry.name, entryMetadata, sourcePath)) {
				continue;
			}
			const techUnits = this._readTechUnits(sourcePath);
			if (techUnits.length === 0) {
				const id = entryMetadata.typeName || entryMetadata.displayName || entry.name;
				const aliases = this._buildAliases(id, entry.name);
				const liveries = this._readLiveries(sourcePath, id, aliases);
				const payloadMetadata = this._readPayloadMetadata(sourcePath, id, aliases);
				const isFlyableTechMod = Boolean(entryMetadata.typeName);
				if (!isFlyableTechMod && !payloadMetadata?.relativePath) {
					logger.log(`[mods] Skipping tech mod ${entry.name}: no unit definitions or payload file detected`);
					continue;
				}
				const issues = [];
				if (!payloadMetadata?.relativePath) {
					issues.push("Payload file not found");
				}
				const payloadStatus = this._derivePayloadStatus(id, payloadMetadata);
				this.inventory.push({
					id,
					modId: entry.name,
					displayName: payloadMetadata?.displayName || entryMetadata.displayName || id,
					shortName: sanitizeShortLabel(entryMetadata.shortName || id),
					category: "Aircraft",
					coalition: entryMetadata.coalition || "blue",
					sourcePath,
					entryFile: fs.existsSync(entryFile) ? entryFile : undefined,
					unitPayloadPath: payloadMetadata?.absolutePath,
					unitPayloadRelativePath: payloadMetadata?.relativePath,
					hasPayloads: Boolean(payloadMetadata?.relativePath),
					loadouts: payloadMetadata?.loadouts?.length ? payloadMetadata.loadouts : this._defaultLoadouts(),
					length: entryMetadata.length || null,
					description: entryMetadata.description || "",
					folderType: "tech",
					issues,
					aliases,
					liveries,
					liveryCount: Object.keys(liveries).length,
					payloadStatus,
					unitPayloadSignature: payloadMetadata?.signature
				});
				continue;
			}
			for (const unit of techUnits) {
				const id = unit.id || entryMetadata.typeName || unit.displayName || entry.name;
				const aliases = this._buildAliases(id, entry.name, unit.aliases);
				const liveries = this._readLiveries(sourcePath, id, aliases);
				const payloadMetadata = this._readPayloadMetadata(sourcePath, id, aliases);
				const issues = [];
				if (!payloadMetadata?.relativePath) {
					issues.push("Payload file not found");
				}
				const payloadStatus = this._derivePayloadStatus(id, payloadMetadata);
				this.inventory.push({
					id,
					modId: entry.name,
					displayName: payloadMetadata?.displayName || unit.displayName || entryMetadata.displayName || id,
					shortName: sanitizeShortLabel(unit.shortName || unit.displayName || id),
					category: "Aircraft",
					coalition: entryMetadata.coalition || "blue",
					sourcePath,
					entryFile: fs.existsSync(entryFile) ? entryFile : undefined,
					unitPayloadPath: payloadMetadata?.absolutePath,
					unitPayloadRelativePath: payloadMetadata?.relativePath,
					hasPayloads: Boolean(payloadMetadata?.relativePath),
					loadouts: payloadMetadata?.loadouts?.length ? payloadMetadata.loadouts : this._defaultLoadouts(),
					length: unit.length || entryMetadata.length || null,
					description: entryMetadata.description || "",
					folderType: "tech",
					issues,
					aliases,
					liveries,
					liveryCount: Object.keys(liveries).length,
					payloadStatus,
					unitPayloadSignature: payloadMetadata?.signature
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

	_readPayloadMetadata(sourcePath, descriptorId, aliases = []) {
		const modPayloadDir = path.join(sourcePath, "UnitPayloads");
		const userPayloadDir = this._getMissionEditorPayloadDir();
		const modFile = this._selectPayloadFile(modPayloadDir, descriptorId, aliases, true);
		const userFile = this._selectPayloadFile(userPayloadDir, descriptorId, aliases, false);
		const modParsed = modFile?.parsed;
		const userParsed = userFile?.parsed;
		const selectedUserFile =
			userParsed && this._isPayloadMatch(userParsed, descriptorId, aliases) ? userFile : undefined;
		if (!modFile && !userFile) {
			return undefined;
		}
		const loadouts = this._mergeLoadouts(modParsed?.loadouts, selectedUserFile ? userParsed?.loadouts : undefined);
		const selectedFile = selectedUserFile || modFile;
		const selectedParsed = selectedUserFile && userParsed ? userParsed : modParsed;
		return {
			unitType: selectedParsed?.unitType || descriptorId,
			displayName: selectedParsed?.displayName || descriptorId,
			loadouts: loadouts.length ? loadouts : this._defaultLoadouts(),
			relativePath: selectedFile.relativePath,
			absolutePath: selectedFile.absolutePath,
			signature: selectedFile.signature,
			payloadSource: selectedUserFile ? "user" : "mod"
		};
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

	_getMissionEditorPayloadDir() {
		if (!this.savedGamesRoot) {
			return undefined;
		}
		return path.join(this.savedGamesRoot, "MissionEditor", "UnitPayloads");
	}

	_normalizeKey(value) {
		if (value === undefined || value === null) {
			return undefined;
		}
		return value.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
	}

	_inferPayloadKey(filePath, parsed) {
		const name = parsed?.unitType || parsed?.displayName || path.basename(filePath, path.extname(filePath));
		return this._normalizeKey(name);
	}

	_isPayloadMatch(parsed, descriptorId, aliases = []) {
		const key = this._inferPayloadKey("", parsed);
		if (!key) {
			return false;
		}
		const candidates = dedupe(
			[descriptorId, ...(aliases || [])]
				.filter(Boolean)
				.map((value) => this._normalizeKey(value))
				.filter(Boolean)
		);
		return candidates.includes(key);
	}

	_buildPayloadFileRecord(absolutePath, parsed) {
		return {
			absolutePath,
			relativePath: this._relativeToSavedGames(absolutePath),
			signature: this._getFileSignature(absolutePath),
			parsed
		};
	}

	_selectPayloadFile(directory, descriptorId, aliases = [], allowFallback = false) {
		if (!directory || !fs.existsSync(directory)) {
			return undefined;
		}
		const entries = fs.readdirSync(directory).filter((file) => file.toLowerCase().endsWith(".lua"));
		if (!entries.length) {
			return undefined;
		}
		const normalizedTargets = dedupe(
			[descriptorId, ...(aliases || [])]
				.filter(Boolean)
				.map((value) => this._normalizeKey(value))
				.filter(Boolean)
		);
		let fallback;
		for (const entry of entries) {
			const absolutePath = path.join(directory, entry);
			const parsed = this._parsePayloadFile(absolutePath);
			if (parsed) {
				const key = this._inferPayloadKey(entry, parsed);
				if (key && normalizedTargets.includes(key)) {
					return this._buildPayloadFileRecord(absolutePath, parsed);
				}
				if (allowFallback && !fallback) {
					fallback = this._buildPayloadFileRecord(absolutePath, parsed);
				}
				continue;
			}
			if (allowFallback && !fallback) {
				fallback = this._buildPayloadFileRecord(absolutePath, undefined);
			}
		}
		return allowFallback ? fallback : undefined;
	}

	_mergeLoadouts(...lists) {
		const merged = [];
		const seen = new Set();
		lists.forEach((list) => {
			if (!Array.isArray(list)) {
				return;
			}
			list.forEach((loadout) => {
				if (!loadout) {
					return;
				}
				const label = (loadout.name || loadout.code || `loadout-${merged.length}`).toString();
				const key = label.toLowerCase();
				if (seen.has(key)) {
					return;
				}
				seen.add(key);
				merged.push(loadout);
			});
		});
		return merged;
	}

	_getFileSignature(filePath) {
		try {
			const stats = fs.statSync(filePath);
			return `${stats.size}:${Math.floor(stats.mtimeMs)}`;
		} catch (error) {
			return undefined;
		}
	}

	_readCachedInventory() {
		if (!fs.existsSync(this.cacheFile)) {
			return [];
		}
		try {
			const content = fs.readFileSync(this.cacheFile, "utf-8");
			const parsed = JSON.parse(content);
			return Array.isArray(parsed) ? parsed : [];
		} catch (error) {
			logger.log(`[mods] Unable to parse inventory cache: ${error}`);
			return [];
		}
	}

	_derivePayloadStatus(id, payloadMetadata) {
		if (!payloadMetadata) {
			return "missing";
		}
		if (!this.hasPreviousInventory) {
			return "ready";
		}
		const previous = this.previousInventoryById.get(id);
		if (!previous || !previous.hasPayloads) {
			return "new";
		}
		const prevSignature = previous.unitPayloadSignature || previous.payloadSignature;
		if (prevSignature && payloadMetadata.signature && prevSignature !== payloadMetadata.signature) {
			return "updated";
		}
		return "ready";
	}

	_readLiveries(sourcePath, descriptorId, aliases = []) {
		const liveryRoot = path.join(sourcePath, "Liveries");
		if (!fs.existsSync(liveryRoot)) {
			return {};
		}
		try {
			const targetDirs = this._resolveLiveryUnitDirs(liveryRoot, descriptorId, aliases);
			if (targetDirs.length === 0) {
				return {};
			}
			const result = {};
			for (const unitDir of targetDirs) {
				const entries = fs.readdirSync(unitDir, { withFileTypes: true });
				for (const entry of entries) {
					if (!this._isDirectoryLike(unitDir, entry)) {
						continue;
					}
					const record = this._parseLiveryDirectory(path.join(unitDir, entry.name), entry.name);
					if (!record) {
						continue;
					}
					const key = entry.name.toLowerCase();
					if (!result[key]) {
						result[key] = record;
					}
				}
			}
			return result;
		} catch (error) {
			logger.log(`[mods] Unable to read liveries from ${sourcePath}: ${error}`);
			return {};
		}
	}

	_resolveLiveryUnitDirs(liveryRoot, descriptorId, aliases = []) {
		const normalizedTargets = dedupe(
			[descriptorId, ...(aliases || [])]
				.filter(Boolean)
				.map((value) => value.toString().toLowerCase())
		);
		const entries = this._listDirectoryEntries(liveryRoot);
		const matches = entries.filter((entry) => normalizedTargets.includes(entry.name.toLowerCase()));
		if (matches.length > 0) {
			return matches.map((entry) => path.join(liveryRoot, entry.name));
		}
		if (entries.length === 1) {
			return [path.join(liveryRoot, entries[0].name)];
		}
		return [];
	}

	_parseLiveryDirectory(folderPath, fallbackName) {
		const descriptionPath = this._findDescriptionFile(folderPath);
		let displayName = fallbackName;
		let countries = [];
		if (descriptionPath) {
			try {
				const content = fs.readFileSync(descriptionPath, "utf-8");
				const nameMatch = content.match(/name\s*=\s*(?:_?\()?["']([^"']+)["']\)?/i);
				if (nameMatch) {
					displayName = stripLocalizationWrapper(nameMatch[1]);
				}
				const countriesMatch = content.match(/countries\s*=\s*{([\s\S]*?)}/i);
				if (countriesMatch) {
					countries = this._parseCountryCodes(countriesMatch[1]);
				}
			} catch (error) {
				logger.log(`[mods] Unable to parse livery description ${descriptionPath}: ${error}`);
			}
		}
		return {
			name: displayName,
			countries
		};
	}

	_parseCountryCodes(block) {
		if (!block) {
			return [];
		}
		const matches = [];
		const regex = /["']([^"']+)["']/g;
		let match = regex.exec(block);
		while (match) {
			const value = match[1]?.trim();
			if (value) {
				matches.push(value.toUpperCase());
			}
			match = regex.exec(block);
		}
		return dedupe(matches);
	}

	_findDescriptionFile(folderPath) {
		try {
			const entries = fs.readdirSync(folderPath, { withFileTypes: true });
			const preferred = entries.find((entry) => entry.isFile() && entry.name.toLowerCase() === "description.lua");
			if (preferred) {
				return path.join(folderPath, preferred.name);
			}
			const fallback = entries.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".lua"));
			return fallback ? path.join(folderPath, fallback.name) : undefined;
		} catch (error) {
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
