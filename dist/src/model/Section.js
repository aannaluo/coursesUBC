"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section = void 0;
class Section {
    uuid;
    id;
    title;
    instructor;
    dept;
    year;
    avg;
    pass;
    fail;
    audit;
    constructor(uuid, id, title, instructor, dept, year, avg, pass, fail, audit) {
        this.uuid = uuid;
        this.id = id;
        this.title = title;
        this.instructor = instructor;
        this.dept = dept;
        this.year = year;
        this.avg = avg;
        this.pass = pass;
        this.fail = fail;
        this.audit = audit;
    }
    toJson() {
        return {
            uuid: this.uuid,
            id: this.id,
            title: this.title,
            instructor: this.instructor,
            dept: this.dept,
            year: this.year,
            avg: this.avg,
            pass: this.pass,
            fail: this.fail,
            audit: this.audit,
        };
    }
}
exports.Section = Section;
//# sourceMappingURL=Section.js.map