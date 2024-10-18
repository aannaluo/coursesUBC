"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const Course_1 = require("../model/Course");
const QueryParser_1 = require("../model/QueryParser");
const IInsightFacade_1 = require("./IInsightFacade");
const CourseUtils_1 = require("../utils/CourseUtils");
const QueryUtils_1 = require("../utils/QueryUtils");
const fs = require("fs-extra");
const jsonIndex = 4;
class InsightFacade {
    insightArray = [];
    dataDir;
    filePath;
    loaded;
    constructor() {
        this.dataDir = path_1.default.join(__dirname, "..", "..", "data");
        this.filePath = path_1.default.join(this.dataDir, "courses.json");
        this.loaded = false;
    }
    async initialize() {
        try {
            await this.createDataFolder();
            await this.loadDataset();
            this.loaded = true;
        }
        catch {
            this.loaded = false;
        }
    }
    async createDataFolder() {
        if (!(await fs.pathExists(this.dataDir))) {
            await fs.ensureDir(this.dataDir);
        }
        if (!(await fs.pathExists(this.filePath))) {
            const content = JSON.stringify({ courses: [] }, null, jsonIndex);
            await fs.writeFile(this.filePath, content, { encoding: "utf8" });
        }
    }
    async loadDataset() {
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
                    const insightDataset = {
                        id: id,
                        kind: IInsightFacade_1.InsightDatasetKind.Sections,
                        numRows: sections.length,
                    };
                    this.insightArray.push(insightDataset);
                }
            }
            catch {
            }
        }
    }
    async addDataset(id, content, kind) {
        if (!this.loaded) {
            await this.initialize();
        }
        if (kind !== IInsightFacade_1.InsightDatasetKind.Sections) {
            throw new IInsightFacade_1.InsightError("Invalid kind");
        }
        if (!(0, CourseUtils_1.isValidId)(id, this.insightArray)) {
            throw new IInsightFacade_1.InsightError("Invalid id");
        }
        const zipContent = await (0, CourseUtils_1.loadZip)(content);
        const courseFolder = (0, CourseUtils_1.getCourseFolder)(zipContent);
        if (!courseFolder) {
            throw new IInsightFacade_1.InsightError("Invalid content");
        }
        const dataToAdd = new Course_1.Courses(id, kind);
        const validCount = await (0, CourseUtils_1.processCourseFiles)(courseFolder, dataToAdd);
        if (validCount === 0) {
            throw new IInsightFacade_1.InsightError("No valid section");
        }
        await (0, CourseUtils_1.persistCourses)(this.filePath, dataToAdd.toJson());
        const newDataset = { id: id, kind: kind, numRows: validCount };
        this.insightArray.push(newDataset);
        return this.insightArray.map((dataset) => dataset.id);
    }
    async removeDataset(id) {
        if (!this.loaded) {
            await this.initialize();
        }
        const regex = /^[^_]+$/;
        if (!regex.test(id)) {
            throw new IInsightFacade_1.InsightError("Invalid id");
        }
        if (!this.insightArray.some((dataset) => dataset.id === id)) {
            throw new IInsightFacade_1.NotFoundError("Id not found");
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
        }
        catch (error) {
            throw new IInsightFacade_1.InsightError("Error reading from Disk: " + error);
        }
        const index = this.insightArray.findIndex((dataset) => dataset.id === id);
        if (index !== -1) {
            this.insightArray.splice(index, 1);
        }
        return id;
    }
    async performQuery(query) {
        if (!this.loaded) {
            await this.initialize();
        }
        if (!(typeof query === "object" && query !== null && Object.keys(query).length !== 0)) {
            throw new IInsightFacade_1.InsightError(`query is ––`);
        }
        const queryParserObject = QueryParser_1.QueryParser;
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
            throw new IInsightFacade_1.InsightError(`not in dataset`);
        }
        const queryWhere = await this.processWhere(dataset, queryObj.filters);
        const maxLength = 5000;
        if (queryWhere.length > maxLength) {
            throw new IInsightFacade_1.ResultTooLargeError(`More than 5000 data points`);
        }
        const result = await this.processOptions(queryObj.options, queryWhere);
        const final = this.addPrefixToKeys(result, queryParserObject.columnName);
        return final;
    }
    addPrefixToKeys(dataArray, prefix) {
        return dataArray.map((obj) => {
            const newObj = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    newObj[`${prefix}_${key}`] = obj[key];
                }
            }
            return newObj;
        });
    }
    async processWhere(courses, where) {
        const promises = where.map(async (filter) => {
            if (filter instanceof QueryParser_1.LogicComparison) {
                return this.handleLogicComparison(filter, courses);
            }
            else if (filter instanceof QueryParser_1.MComparison) {
                return this.performMComparison(filter, courses);
            }
            else if (filter instanceof QueryParser_1.SComparison) {
                return this.handleSComparison(filter, courses);
            }
            else if (filter instanceof QueryParser_1.Negation) {
                return this.handleNegation(filter, courses);
            }
        });
        const results = await Promise.all(promises);
        return results.flat().filter((result) => result !== undefined);
    }
    async handleLogicComparison(filter, courses) {
        const results = await Promise.all(filter.filters.map(async (f) => this.processWhere(courses, [f])));
        if (filter.logic === "AND") {
            return this.handleAndLogic(results);
        }
        else if (filter.logic === "OR") {
            return this.handleOrLogic(results);
        }
        return [];
    }
    handleAndLogic(results) {
        const firstResult = results[0];
        if (!Array.isArray(firstResult)) {
            throw new IInsightFacade_1.InsightError("Invalid filter result: Expected an array");
        }
        return firstResult.filter((value) => {
            const allResultsAreArrays = results.every((result) => Array.isArray(result));
            const isIncludedInAllResults = results.every((result) => result.includes(value));
            return allResultsAreArrays && isIncludedInAllResults;
        });
    }
    handleOrLogic(results) {
        const validResults = results.filter(Array.isArray);
        return validResults.reduce((result1, result2) => {
            if (!Array.isArray(result1) || !Array.isArray(result2)) {
                throw new IInsightFacade_1.InsightError("Invalid result: Expected arrays for OR logic");
            }
            return result1.concat(result2.filter((value) => !result1.includes(value)));
        }, []);
    }
    async handleSComparison(filter, courses) {
        const field = filter.skey.substring(filter.skey.indexOf("_") + 1);
        const value = filter.value;
        let regex;
        const MIN_VALUE_LENGTH = 2;
        if (value.length > MIN_VALUE_LENGTH && value.substring(1, value.length - 1).includes("*")) {
            throw new IInsightFacade_1.InsightError(`invalid asterisk placement`);
        }
        else {
            regex = (0, QueryUtils_1.createWildcardRegex)(value);
        }
        return (0, QueryUtils_1.findSections)(courses, "IS", regex, field);
    }
    async handleNegation(filter, courses) {
        const result = await this.processWhere(courses, filter.filters);
        return courses.sections.filter((item) => !result.includes(item));
    }
    performMComparison(filter, courses) {
        const field = filter.mkey.substring(filter.mkey.indexOf("_") + 1, filter.mkey.length);
        const value = filter.value;
        if (filter.comparator === "EQ") {
            const sectionsResult = (0, QueryUtils_1.findSections)(courses, filter.comparator, value, field);
            return sectionsResult;
        }
        else if (filter.comparator === "LT") {
            const sectionsResult = (0, QueryUtils_1.findSections)(courses, filter.comparator, value, field);
            return sectionsResult;
        }
        else if (filter.comparator === "GT") {
            const sectionsResult = (0, QueryUtils_1.findSections)(courses, filter.comparator, value, field);
            return sectionsResult;
        }
        return [];
    }
    async processOptions(options, sectionData) {
        const filteredSections = [];
        if (options.columns.length > 0) {
            for (const section of sectionData) {
                const newSection = {};
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
                    throw new IInsightFacade_1.InsightError(`Invalid column: ${column}`);
                }
                const aValue = a[column];
                const bValue = b[column];
                if (typeof aValue === "number" && typeof bValue === "number") {
                    return aValue - bValue;
                }
                else if (typeof aValue === "string" && typeof bValue === "string") {
                    return aValue.localeCompare(bValue);
                }
                else {
                    throw new IInsightFacade_1.InsightError(`Inconsistent data types for column: ${column}`);
                }
            });
        }
        return filteredSections;
    }
    async listDatasets() {
        if (!this.loaded) {
            await this.initialize();
        }
        return this.insightArray;
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map