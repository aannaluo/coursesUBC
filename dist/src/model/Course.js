"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Courses = void 0;
const Section_1 = require("./Section");
class Courses {
    id;
    sections;
    kind;
    validCount;
    constructor(id, kind) {
        this.id = id;
        this.kind = kind;
        this.validCount = 0;
        this.sections = [];
    }
    parseCourse(data) {
        if (!data || !Array.isArray(data.result)) {
            return;
        }
        for (const i in data.result) {
            if (!Object.prototype.hasOwnProperty.call(data.result[i], "id") ||
                !Object.prototype.hasOwnProperty.call(data.result[i], "Course") ||
                !Object.prototype.hasOwnProperty.call(data.result[i], "Title") ||
                !Object.prototype.hasOwnProperty.call(data.result[i], "Professor") ||
                !Object.prototype.hasOwnProperty.call(data.result[i], "Subject") ||
                !Object.prototype.hasOwnProperty.call(data.result[i], "Year") ||
                !Object.prototype.hasOwnProperty.call(data.result[i], "Avg") ||
                !Object.prototype.hasOwnProperty.call(data.result[i], "Pass") ||
                !Object.prototype.hasOwnProperty.call(data.result[i], "Fail") ||
                !Object.prototype.hasOwnProperty.call(data.result[i], "Audit")) {
                continue;
            }
            this.processCourse(data.result[i]);
        }
    }
    processCourse(courseData) {
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
        const section = new Section_1.Section(uuid, id, title, instructor, dept, year, avg, pass, fail, audit);
        this.sections.push(section);
    }
    getValid() {
        return this.sections.length;
    }
    toJson() {
        return {
            id: this.id,
            sections: this.sections.map((section) => section.toJson()),
        };
    }
}
exports.Courses = Courses;
//# sourceMappingURL=Course.js.map