import path from "path";
import { Courses } from "../model/Course";
import {
	QueryParser,
	LogicComparison,
	MComparison,
	SComparison,
	Negation,
	Filter,
	Options,
} from "../model/QueryParser";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import { isValidId, loadZip, getCourseFolder, processCourseFiles, persistCourses } from "../utils/CourseUtils";
import { createWildcardRegex, findSections } from "../utils/QueryUtils";

const fs = require("fs-extra");
const jsonIndex = 4;

export default class InsightFacade implements IInsightFacade {
	public insightArray: InsightDataset[] = [];
	private dataDir: string;
	private filePath: string;
	private loaded: boolean;

	constructor() {
		this.dataDir = path.join(__dirname, "..", "..", "data");
		this.filePath = path.join(this.dataDir, "courses.json");
		this.loaded = false;
	}

	private async initialize(): Promise<void> {
		try {
			await this.createDataFolder();
			await this.loadDataset();
			this.loaded = true;
		} catch {
			this.loaded = false;
		}
	}

	private async createDataFolder(): Promise<void> {
		if (!(await fs.pathExists(this.dataDir))) {
			await fs.ensureDir(this.dataDir);
		}

		if (!(await fs.pathExists(this.filePath))) {
			const content = JSON.stringify({ courses: [] }, null, jsonIndex);
			await fs.writeFile(this.filePath, content, { encoding: "utf8" });
		}
	}

	private async loadDataset(): Promise<void> {
		if (!(await fs.pathExists(this.dataDir))) {
			return;
		}

		if (await fs.pathExists(this.filePath)) {
			const datasetContent = await fs.readFile(this.filePath, { encoding: "utf8" });

			try {
				const datasetJson = JSON.parse(datasetContent);
				for (const course of datasetJson.courses) {
					const id = course.id;
					const sections = course.sections;

					const insightDataset: InsightDataset = {
						id: id,
						kind: InsightDatasetKind.Sections,
						numRows: sections.length,
					};

					this.insightArray.push(insightDataset);
				}
			} catch {
				// do nothing
			}
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!this.loaded) {
			await this.initialize();
		}

		if (kind !== InsightDatasetKind.Sections) {
			throw new InsightError("Invalid kind");
		}

		if (!isValidId(id, this.insightArray)) {
			throw new InsightError("Invalid id");
		}

		const zipContent = await loadZip(content);
		const courseFolder = getCourseFolder(zipContent);

		if (!courseFolder) {
			throw new InsightError("Invalid content");
		}

		const dataToAdd = new Courses(id, kind);
		const validCount = await processCourseFiles(courseFolder, dataToAdd);
		if (validCount === 0) {
			throw new InsightError("No valid section");
		}

		await persistCourses(this.filePath, dataToAdd.toJson());
		const newDataset: InsightDataset = { id: id, kind: kind, numRows: validCount };
		this.insightArray.push(newDataset);

		return this.insightArray.map((dataset) => dataset.id);
	}

	public async removeDataset(id: string): Promise<string> {
		if (!this.loaded) {
			await this.initialize();
		}

		const regex = /^[^_]+$/;
		if (!regex.test(id)) {
			throw new InsightError("Invalid id");
		}

		if (!this.insightArray.some((dataset) => dataset.id === id)) {
			throw new NotFoundError("Id not found");
		}

		try {
			const data = await fs.promises.readFile(this.filePath, "utf8");
			const jsonData = JSON.parse(data);
			for (let i = 0; i < jsonData.courses.length; i++) {
				if (jsonData.courses[i].id === id) {
					jsonData.courses.splice(i, 1);
				}
			}
			await fs.promises.writeFile(this.filePath, JSON.stringify(jsonData, null, jsonIndex), "utf8");
		} catch (error) {
			throw new InsightError("Error reading from Disk: " + error);
		}

		const index = this.insightArray.findIndex((dataset) => dataset.id === id);

		if (index !== -1) {
			this.insightArray.splice(index, 1);
		}
		return id;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		if (!this.loaded) {
			await this.initialize();
		}

		if (!(typeof query === "object" && query !== null && Object.keys(query).length !== 0)) {
			throw new InsightError(`query is ––`);
		}

		// STEP 1: Convert to a query and validate
		const queryParserObject = QueryParser;
		const queryObj = queryParserObject.parse(query);
		const data = await fs.promises.readFile(this.filePath, "utf8");
		const jsonData = JSON.parse(data);
		let inData = false;
		let dataset = null;

		for (const course of jsonData.courses) {
			if (course.id === queryParserObject.columnName) {
				inData = true;
				dataset = course;
				break;
			}
		}

		if (!inData) {
			throw new InsightError(`not in dataset`);
		}

		// STEP 2: Process Body
		const queryWhere = await this.processWhere(dataset, queryObj.filters);
		const maxLength = 5000;
		if (queryWhere.length > maxLength) {
			throw new ResultTooLargeError(`More than 5000 data points`);
		}

		const result = await this.processOptions(queryObj.options, queryWhere);
		const final = this.addPrefixToKeys(result, queryParserObject.columnName);
		return final;
	}

	private addPrefixToKeys(dataArray: any[], prefix: string): any[] {
		return dataArray.map((obj) => {
			const newObj: any = {};
			for (const key in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, key)) {
					newObj[`${prefix}_${key}`] = obj[key];
				}
			}
			return newObj;
		});
	}

	private async processWhere(courses: any, where: Filter[]): Promise<InsightResult[]> {
		const promises = where.map(async (filter) => {
			if (filter instanceof LogicComparison) {
				return this.handleLogicComparison(filter, courses);
			} else if (filter instanceof MComparison) {
				return this.performMComparison(filter, courses);
			} else if (filter instanceof SComparison) {
				return this.handleSComparison(filter, courses);
			} else if (filter instanceof Negation) {
				return this.handleNegation(filter, courses);
			}
		});

		const results = await Promise.all(promises);

		return results.flat().filter((result): result is InsightResult => result !== undefined);
	}

	// Handle logic comparisons
	private async handleLogicComparison(filter: LogicComparison, courses: any): Promise<InsightResult[]> {
		const results = await Promise.all(filter.filters.map(async (f) => this.processWhere(courses, [f])));
		if (filter.logic === "AND") {
			return this.handleAndLogic(results);
		} else if (filter.logic === "OR") {
			return this.handleOrLogic(results);
		}
		return [];
	}

	// Handle AND logic
	private handleAndLogic(results: InsightResult[][]): InsightResult[] {
		const firstResult = results[0];
		if (!Array.isArray(firstResult)) {
			throw new InsightError("Invalid filter result: Expected an array");
		}

		return firstResult.filter((value) => {
			const allResultsAreArrays = results.every((result) => Array.isArray(result));
			const isIncludedInAllResults = results.every((result) => result.includes(value));
			return allResultsAreArrays && isIncludedInAllResults;
		});
	}

	// Handle OR logic
	private handleOrLogic(results: InsightResult[][]): InsightResult[] {
		const validResults = results.filter(Array.isArray);
		return validResults.reduce((result1, result2) => {
			if (!Array.isArray(result1) || !Array.isArray(result2)) {
				throw new InsightError("Invalid result: Expected arrays for OR logic");
			}
			return result1.concat(result2.filter((value) => !result1.includes(value))); // Perform union
		}, []);
	}

	// Handle SComparison
	private async handleSComparison(filter: SComparison, courses: any): Promise<InsightResult[]> {
		const field = filter.skey.substring(filter.skey.indexOf("_") + 1);
		const value = filter.value;
		let regex: RegExp;

		const MIN_VALUE_LENGTH = 2;
		if (value.length > MIN_VALUE_LENGTH && value.substring(1, value.length - 1).includes("*")) {
			throw new InsightError(`invalid asterisk placement`);
		} else {
			regex = createWildcardRegex(value);
		}

		return findSections(courses, "IS", regex, field);
	}

	// Handle Negation
	private async handleNegation(filter: Negation, courses: any): Promise<InsightResult[]> {
		const result = await this.processWhere(courses, filter.filters);
		return courses.sections.filter((item: InsightResult) => !result.includes(item));
	}

	private performMComparison(filter: MComparison, courses: any): InsightResult[] {
		const field = filter.mkey.substring(filter.mkey.indexOf("_") + 1, filter.mkey.length);
		const value = filter.value;

		if (filter.comparator === "EQ") {
			const sectionsResult = findSections(courses, filter.comparator, value, field);
			return sectionsResult;
		} else if (filter.comparator === "LT") {
			const sectionsResult = findSections(courses, filter.comparator, value, field);
			return sectionsResult;
		} else if (filter.comparator === "GT") {
			const sectionsResult = findSections(courses, filter.comparator, value, field);
			return sectionsResult;
		}
		return [];
	}

	private async processOptions(options: Options, sectionData: InsightResult[]): Promise<InsightResult[]> {
		const filteredSections: InsightResult[] = [];
		if (options.columns.length > 0) {
			for (const section of sectionData) {
				const newSection: any = {};
				for (const column of options.columns) {
					if (Object.prototype.hasOwnProperty.call(section, column)) {
						newSection[column] = section[column];
					}
				}
				filteredSections.push(newSection);
			}
		}

		if (options.orderBy && options.columns.includes(options.orderBy)) {
			filteredSections.sort((a, b) => {
				const column = options.orderBy;
				if (a[column] === undefined || b[column] === undefined) {
					throw new InsightError(`Invalid column: ${column}`);
				}

				const aValue = a[column];
				const bValue = b[column];

				if (typeof aValue === "number" && typeof bValue === "number") {
					return aValue - bValue;
				} else if (typeof aValue === "string" && typeof bValue === "string") {
					return aValue.localeCompare(bValue);
				} else {
					throw new InsightError(`Inconsistent data types for column: ${column}`);
				}
			});
		}
		return filteredSections;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		if (!this.loaded) {
			await this.initialize();
		}
		return this.insightArray;
	}
}
