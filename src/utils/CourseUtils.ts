// utils/courseUtils.ts
import JSZip from "jszip";
import fs from "fs/promises";
import { InsightError } from "../controller/IInsightFacade";
import { Courses } from "../model/Course";

const jsonIndex = 4;

export const isValidId = (id: string, insightArray: any[]): boolean => {
	const regex = /^[^_]+$/;
	return regex.test(id) && !insightArray.some((dataset) => dataset.id === id);
};

export const loadZip = async (content: string): Promise<any> => {
	try {
		return await JSZip.loadAsync(content, { base64: true });
	} catch {
		throw new InsightError("Can't load ZIP");
	}
};

export const getCourseFolder = (zipContent: any): any => {
	const folder = Object.keys(zipContent.files);
	return folder[0] === "courses/" ? zipContent.folder("courses/") : null;
};

export const processCourseFiles = async (courseFolder: any, dataToAdd: Courses): Promise<number> => {
	const filePromises = Object.keys(courseFolder.files).map(async (relativePath: string) => {
		if (relativePath.endsWith(".DS_Store")) {
			return;
		}
		const file = courseFolder.files[relativePath];
		const courseFile = await file.async("text");
		if (courseFile.trim().length !== 0) {
			try {
				const jsonCourseFile = JSON.parse(courseFile);
				dataToAdd.parseCourse(jsonCourseFile);
			} catch {
				// do nothing
			}
		}
	});

	await Promise.all(filePromises);
	return dataToAdd.getValid();
};

export const persistCourses = async (filePath: string, data: any): Promise<void> => {
	try {
		const courseJson = await fs.readFile(filePath, "utf8");
		const jsonData = courseJson ? JSON.parse(courseJson) : { courses: [] };
		jsonData.courses.push(data);
		await fs.writeFile(filePath, JSON.stringify(jsonData, null, jsonIndex), "utf8");
	} catch (error) {
		throw new InsightError("Error persisting courses: " + error);
	}
};
