"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const TestUtil_1 = require("../TestUtil");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
describe("InsightFacade", function () {
    let facade;
    let sections;
    let noCourseFolder;
    let notJson;
    let oneValidSection;
    let multipleValidSections;
    let simpleQuery;
    before(async function () {
        sections = await (0, TestUtil_1.getContentFromArchives)("pair.zip");
        noCourseFolder = await (0, TestUtil_1.getContentFromArchives)("invalid.zip");
        notJson = await (0, TestUtil_1.getContentFromArchives)("not_json.zip");
        oneValidSection = await (0, TestUtil_1.getContentFromArchives)("one_section_only.zip");
        multipleValidSections = await (0, TestUtil_1.getContentFromArchives)("multiple_valids.zip");
        simpleQuery = await (0, TestUtil_1.getContentFromArchives)("simple_query.zip");
        await (0, TestUtil_1.clearDisk)();
    });
    describe("AddDataset", function () {
        beforeEach(function () {
            facade = new InsightFacade_1.default();
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should reject with an empty dataset id", async function () {
            try {
                await facade.addDataset("", sections, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject with an underscore in dataset id", async function () {
            try {
                await facade.addDataset("AA_1", sections, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject with rooms as an argument for kind", async function () {
            try {
                await facade.addDataset("A1", sections, IInsightFacade_1.InsightDatasetKind.Rooms);
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject with an empty string for content", async function () {
            try {
                await facade.addDataset("A1", Buffer.from("").toString("base64"), IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject as .zip has no course folder", async function () {
            try {
                await facade.addDataset("A1", noCourseFolder, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject as course is not JSON formatted", async function () {
            try {
                await facade.addDataset("A1", notJson, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject as course has no valid section", async function () {
            try {
                await facade.addDataset("A1", notJson, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject as course has no result key", async function () {
            try {
                await facade.addDataset("A1", notJson, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject as adding 2 courses with same id", async function () {
            try {
                await facade.addDataset("A1", oneValidSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset("A1", multipleValidSections, IInsightFacade_1.InsightDatasetKind.Sections);
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should accept 1", async function () {
            try {
                const result = await facade.addDataset("A1", oneValidSection, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result).to.be.an("array").that.include("A1");
            }
            catch {
                chai_1.expect.fail("Should have thrown.");
            }
        });
        it("should accept 3", async function () {
            try {
                await facade.addDataset("A1", oneValidSection, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset("simple", simpleQuery, IInsightFacade_1.InsightDatasetKind.Sections);
                const result = await facade.addDataset("A2", multipleValidSections, IInsightFacade_1.InsightDatasetKind.Sections);
                (0, chai_1.expect)(result).to.be.an("array").that.include("A1");
                (0, chai_1.expect)(result).to.be.an("array").that.include("A2");
                (0, chai_1.expect)(result).to.be.an("array").that.include("simple");
            }
            catch {
                chai_1.expect.fail("Should have thrown.");
            }
        });
    });
    describe("RemoveDataset", function () {
        beforeEach(async function () {
            facade = new InsightFacade_1.default();
            await facade.addDataset("valid", multipleValidSections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("valid2", oneValidSection, IInsightFacade_1.InsightDatasetKind.Sections);
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should reject with an empty dataset id for remove", async function () {
            try {
                await facade.removeDataset("");
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject with an invalid dataset id", async function () {
            try {
                await facade.removeDataset("A_B");
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        });
        it("should reject with an id that doesn't exist", async function () {
            try {
                await facade.removeDataset("invalid");
                chai_1.expect.fail("Should have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.NotFoundError);
            }
        });
        it("should accept one remove", async function () {
            try {
                const result = await facade.removeDataset("valid");
                (0, chai_1.expect)(result).to.equal("valid");
            }
            catch {
                chai_1.expect.fail("Should not have thrown.");
            }
        });
        it("should accept multiple remove", async function () {
            try {
                const result = await facade.removeDataset("valid");
                (0, chai_1.expect)(result).to.equal("valid");
                const result2 = await facade.removeDataset("valid2");
                (0, chai_1.expect)(result2).to.equal("valid2");
            }
            catch {
                chai_1.expect.fail("Should not have thrown.");
            }
        });
        it("should reject because multiple remove with duplication", async function () {
            try {
                await facade.removeDataset("valid");
                await facade.removeDataset("valid2");
                await facade.removeDataset("valid");
                chai_1.expect.fail("Should not have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.NotFoundError);
            }
        });
        it("should reject after remove all and try to remove empty on DB", async function () {
            try {
                const result = await facade.removeDataset("valid");
                (0, chai_1.expect)(result).to.equal("valid");
                const result2 = await facade.removeDataset("valid2");
                (0, chai_1.expect)(result2).to.equal("valid2");
                await facade.removeDataset("valid");
                chai_1.expect.fail("Should not have thrown.");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.NotFoundError);
            }
        });
    });
    describe("ListDataset", function () {
        beforeEach(function () {
            facade = new InsightFacade_1.default();
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should list nothing", async function () {
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.be.an("array").and.to.have.lengthOf(0);
        });
        it("should list 1 dataset", async function () {
            await facade.addDataset("valid", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.deep.equal([
                {
                    id: "valid",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 64612,
                },
            ]);
        });
        it("add 1 remove 1", async function () {
            await facade.addDataset("valid", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("valid");
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.be.an("array").and.to.have.lengthOf(0);
        });
        it("should list 2 datasets", async function () {
            await facade.addDataset("valid", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("valid2", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.deep.equal([
                {
                    id: "valid",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 64612,
                },
                {
                    id: "valid2",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 64612,
                },
            ]);
        });
        it("should list 1 dataset after removing", async function () {
            await facade.addDataset("valid", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("valid2", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("valid2");
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.deep.equal([
                {
                    id: "valid",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 64612,
                },
            ]);
        });
        it("should list nothing after removing both", async function () {
            await facade.addDataset("valid", multipleValidSections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("valid2", oneValidSection, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("valid");
            await facade.removeDataset("valid2");
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.be.an("array").and.to.have.lengthOf(0);
        });
    });
    describe("PerformQuery", function () {
        async function checkQuery() {
            if (!this.test) {
                throw new Error("Invalid call to checkQuery." +
                    "Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
                    "Do not invoke the function directly.");
            }
            const { input, expected, errorExpected } = await (0, TestUtil_1.loadTestQuery)(this.test.title);
            let result;
            try {
                result = await facade.performQuery(input);
                if (errorExpected) {
                    chai_1.expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
                }
                (0, chai_1.expect)(result).to.deep.members(expected);
            }
            catch (err) {
                if (!errorExpected) {
                    chai_1.expect.fail(`performQuery threw unexpected error: ${err}`);
                }
                if (expected === "ResultTooLargeError") {
                    (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.ResultTooLargeError);
                }
                else {
                    (0, chai_1.expect)(err).to.be.instanceOf(IInsightFacade_1.InsightError);
                }
            }
        }
        before(async function () {
            facade = new InsightFacade_1.default();
            const loadDatasetPromises = [
                facade.addDataset("sections", sections, IInsightFacade_1.InsightDatasetKind.Sections),
            ];
            try {
                await Promise.all(loadDatasetPromises);
            }
            catch (err) {
                throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
            }
        });
        after(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("[valid/wildcard.json] Wildcard query", checkQuery);
        it("[valid/complex2.json] Complex2 query", checkQuery);
        it("[valid/complex3.json] Complex3 query", checkQuery);
        it("[valid/complex4.json] Complex4 query", checkQuery);
        it("[valid/complex5.json] Complex5 query", checkQuery);
        it("[valid/complex6.json] Complex6 query", checkQuery);
        it("[valid/complex7.json] Complex7 query", checkQuery);
        it("[invalid/invalid1.json] invalid1 query", checkQuery);
        it("[invalid/invalid2.json] invalid2 query", checkQuery);
        it("[invalid/invalid3.json] invalid3 query", checkQuery);
        it("[invalid/invalid_underscore.json] Query with an underscore", checkQuery);
        it("[invalid/invalid_orderby_two.json] Query with an orderby array", checkQuery);
        it("[invalid/invalid.json] Query missing WHERE", checkQuery);
        it("[invalid/missing_options.json] Query missing OPTIONS", checkQuery);
        it("[invalid/more_than_5000.json] Query return >= 5000 rows", checkQuery);
        it("[invalid/invalid_more_than_5000.json] Query returns >= 5000 rows", checkQuery);
        it("[invalid/reference_two.json] Query referencing 2 datasets", checkQuery);
        it("[invalid/invalid_wildcard.json]  Query with * in middle", checkQuery);
        it("[invalid/invalid_wildcard2.json]  Query with *c*p*", checkQuery);
        it("[invalid/invalid_wildcard3.json]  Query with ***", checkQuery);
        it("[invalid/invalid_wildcard4.json]  Query with C**", checkQuery);
        it("[invalid/order_key_not_found.json]  Order key not found", checkQuery);
        it("[invalid/missing_id.json]  Missing id in query keys", checkQuery);
        it("[invalid/missing_columns.json]  Missing columns", checkQuery);
        it("[invalid/missing_columns_value.json]  Missing cols value", checkQuery);
        it("[invalid/invalid_formatKey.json]  Query with missing _", checkQuery);
        it("[invalid/invalid_formatKey2.json]  Query with wrong field", checkQuery);
        it("[invalid/invalid_format.json]  Invalid format for WHERE", checkQuery);
        it("[invalid/invalid_filter1.json]  Invalid type for skey", checkQuery);
        it("[invalid/invalid_filter2.json]  Invalid type for mkey", checkQuery);
        it("[invalid/invalid_filter3.json]  Invalid object for WHERE", checkQuery);
        it("[invalid/invalid_filter4.json]  WHERE has > 1 key", checkQuery);
        it("[invalid/invalid_filter5.json]  No key in IS", checkQuery);
        it("[invalid/invalid_filter6.json]  Invalid filter key", checkQuery);
        it("[invalid/empty_query.json] Empty query", checkQuery);
    });
    describe("DataCaching", function () {
        beforeEach(async function () {
            facade = new InsightFacade_1.default();
            await facade.addDataset("valid", sections, IInsightFacade_1.InsightDatasetKind.Sections);
        });
        afterEach(async function () {
            await (0, TestUtil_1.clearDisk)();
        });
        it("should allow access to datasets from a new instance", async function () {
            const newFacade = new InsightFacade_1.default();
            const result = await newFacade.listDatasets();
            (0, chai_1.expect)(result).to.deep.equal([
                {
                    id: "valid",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 64612,
                },
            ]);
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map