import { InsightDatasetKind } from "../controller/IInsightFacade";
import { Section } from "./Section";

export class Courses {
	public id: string;
	public sections: Section[];
	public kind: InsightDatasetKind;
	public validCount: number;

	constructor(id: string, kind: InsightDatasetKind) {
		this.id = id;
		this.kind = kind;
		this.validCount = 0;
		this.sections = [];
	}

	public parseCourse(data: any): void {
		if (!data || !Array.isArray(data.result)) {
			return;
		}
		for (const i in data.result) {
			if (
				!Object.prototype.hasOwnProperty.call(data.result[i], "id") ||
				!Object.prototype.hasOwnProperty.call(data.result[i], "Course") ||
				!Object.prototype.hasOwnProperty.call(data.result[i], "Title") ||
				!Object.prototype.hasOwnProperty.call(data.result[i], "Professor") ||
				!Object.prototype.hasOwnProperty.call(data.result[i], "Subject") ||
				!Object.prototype.hasOwnProperty.call(data.result[i], "Year") ||
				!Object.prototype.hasOwnProperty.call(data.result[i], "Avg") ||
				!Object.prototype.hasOwnProperty.call(data.result[i], "Pass") ||
				!Object.prototype.hasOwnProperty.call(data.result[i], "Fail") ||
				!Object.prototype.hasOwnProperty.call(data.result[i], "Audit")
			) {
				continue;
			}
			this.processCourse(data.result[i]);
		}
	}

	private processCourse(courseData: any): void {
		const uuid = String(courseData.id);
		const id = String(courseData.Course);
		const title = String(courseData.Title);
		const instructor = String(courseData.Professor);
		const dept = String(courseData.Subject);
		let year = Number(courseData.Year);
		const avg = Number(courseData.Avg);
		const pass = Number(courseData.Pass);
		const fail = Number(courseData.Fail);
		const audit = Number(courseData.Audit);
		const sectionData = courseData.Section;
		const yearFix = 1900;

		if (sectionData.toUpperCase() === "OVERALL") {
			year = yearFix;
		}
		const section = new Section(uuid, id, title, instructor, dept, year, avg, pass, fail, audit);
		this.sections.push(section);
	}

	public getValid(): number {
		return this.sections.length;
	}

	public toJson(): object {
		return {
			id: this.id,
			sections: this.sections.map((section) => section.toJson()),
		};
	}
}
