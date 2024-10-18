"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistCourses = exports.processCourseFiles = exports.getCourseFolder = exports.loadZip = exports.isValidId = void 0;
const jszip_1 = __importDefault(require("jszip"));
const promises_1 = __importDefault(require("fs/promises"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
const jsonIndex = 4;
const isValidId = (id, insightArray) => {
    const regex = /^[^_]+$/;
    return regex.test(id) && !insightArray.some((dataset) => dataset.id === id);
};
exports.isValidId = isValidId;
const loadZip = async (content) => {
    try {
        return await jszip_1.default.loadAsync(content, { base64: true });
    }
    catch {
        throw new IInsightFacade_1.InsightError("Can't load ZIP");
    }
};
exports.loadZip = loadZip;
const getCourseFolder = (zipContent) => {
    const folder = Object.keys(zipContent.files);
    return folder[0] === "courses/" ? zipContent.folder("courses/") : null;
};
exports.getCourseFolder = getCourseFolder;
const processCourseFiles = async (courseFolder, dataToAdd) => {
    const filePromises = Object.keys(courseFolder.files).map(async (relativePath) => {
        if (relativePath.endsWith(".DS_Store")) {
            return;
        }
        const file = courseFolder.files[relativePath];
        const courseFile = await file.async("text");
        if (courseFile.trim().length !== 0) {
            try {
                const jsonCourseFile = JSON.parse(courseFile);
                dataToAdd.parseCourse(jsonCourseFile);
            }
            catch {
            }
        }
    });
    await Promise.all(filePromises);
    return dataToAdd.getValid();
};
exports.processCourseFiles = processCourseFiles;
const persistCourses = async (filePath, data) => {
    try {
        const courseJson = await promises_1.default.readFile(filePath, "utf8");
        const jsonData = courseJson ? JSON.parse(courseJson) : { courses: [] };
        jsonData.courses.push(data);
        await promises_1.default.writeFile(filePath, JSON.stringify(jsonData, null, jsonIndex), "utf8");
    }
    catch (error) {
        throw new IInsightFacade_1.InsightError("Error persisting courses: " + error);
    }
};
exports.persistCourses = persistCourses;
//# sourceMappingURL=CourseUtils.js.map