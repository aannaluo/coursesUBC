"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = exports.Negation = exports.SComparison = exports.MComparison = exports.LogicComparison = exports.Body = exports.QueryParser = void 0;
const IInsightFacade_1 = require("../controller/IInsightFacade");
class QueryParser {
    static columnName = "";
    static parse(queryObj) {
        this.columnName = "";
        const validKeys = ["WHERE", "OPTIONS"];
        const queryKeys = Object.keys(queryObj);
        for (const key of queryKeys) {
            if (!validKeys.includes(key)) {
                throw new IInsightFacade_1.InsightError(`Invalid key "${key}" in query`);
            }
        }
        const filters = QueryParser.parseBody(queryObj.WHERE);
        const options = QueryParser.parseOptions(queryObj.OPTIONS);
        return { filters, options };
    }
    static parseBody(whereObj) {
        const emptyFilter = [];
        if (!whereObj) {
            return emptyFilter;
        }
        const keys = Object.keys(whereObj);
        if (keys.length === 0) {
            return emptyFilter;
        }
        if (keys.length > 1) {
            throw new IInsightFacade_1.InsightError(`Invalid WHERE format: multiple filters at the top level`);
        }
        const key = keys[0];
        switch (key) {
            case "GT":
            case "LT":
            case "EQ":
                return this.handleMComparison(key, whereObj[key]);
            case "AND":
            case "OR":
                return this.handleLogicComparison(key, whereObj[key]);
            case "IS":
                return this.handleSComparison(whereObj[key]);
            case "NOT":
                return this.handleNegation(whereObj[key]);
            default:
                throw new IInsightFacade_1.InsightError(`Unknown Filter ${key}`);
        }
    }
    static handleMComparison(key, value) {
        return [QueryParser.parseMComparison(key, value)];
    }
    static handleLogicComparison(key, value) {
        return [QueryParser.parseLogicComparison(key, value)];
    }
    static handleSComparison(value) {
        return [QueryParser.parseSComparison(value)];
    }
    static handleNegation(value) {
        return [new Negation(QueryParser.parseBody(value))];
    }
    static parseMComparison(comparator, comparisonObj) {
        if (Object.keys(comparisonObj).length === 0 || Object.values(comparisonObj).length === 0) {
            throw new IInsightFacade_1.InsightError(`invalid keys`);
        }
        let key;
        let value;
        try {
            key = Object.keys(comparisonObj)[0];
            value = comparisonObj[key];
        }
        catch {
            throw new IInsightFacade_1.InsightError(`Invalid key or value`);
        }
        if (key.indexOf("_") === -1 || key.indexOf("_") === 0) {
            throw new IInsightFacade_1.InsightError(`Invalid key, error with underscore ${key}`);
        }
        const id = key.substring(0, key.indexOf("_"));
        const field = key.substring(key.indexOf("_") + 1, key.length);
        if (this.columnName === "") {
            this.columnName = id;
        }
        else if (this.columnName !== id) {
            throw new IInsightFacade_1.InsightError(`multiple dataset id 1, ${QueryParser.columnName},${id}`);
        }
        const validFields = ["avg", "pass", "fail", "audit", "year"];
        if (!validFields.includes(field)) {
            throw new IInsightFacade_1.InsightError(`Invalid mfield name ${field}`);
        }
        if (!(typeof value === "number" && !isNaN(value))) {
            throw new IInsightFacade_1.InsightError(`Not an integer ${value}`);
        }
        return new MComparison(comparator, key, value);
    }
    static parseLogicComparison(logic, filterlist) {
        const filters = filterlist.flatMap((filter) => QueryParser.parseBody(filter));
        return new LogicComparison(logic, filters);
    }
    static parseSComparison(comparisonObj) {
        if (Object.keys(comparisonObj).length === 0 || Object.values(comparisonObj).length === 0) {
            throw new IInsightFacade_1.InsightError(`invalid keys`);
        }
        let key;
        let value;
        try {
            key = Object.keys(comparisonObj)[0];
            value = comparisonObj[key];
        }
        catch {
            throw new IInsightFacade_1.InsightError(`Invalid key or value`);
        }
        if (key.indexOf("_") === -1 || key.indexOf("_") === 0) {
            throw new IInsightFacade_1.InsightError(`Invalid key, missing underscore ${key}`);
        }
        const id = key.substring(0, key.indexOf("_"));
        const field = key.substring(key.indexOf("_") + 1, key.length);
        if (this.columnName === "") {
            this.columnName = id;
        }
        else if (this.columnName !== id) {
            throw new IInsightFacade_1.InsightError(`multiple dataset id 2, ${id}`);
        }
        const validFields = ["dept", "id", "instructor", "title", "uuid"];
        if (!validFields.includes(field)) {
            throw new IInsightFacade_1.InsightError(`Invalid sfield name ${field}`);
        }
        if (typeof value !== "string") {
            throw new IInsightFacade_1.InsightError(`Not a string ${value}`);
        }
        return new SComparison(key, value);
    }
    static parseOptions(optionsObj) {
        const validFields = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
        let columns = [];
        let key = "";
        let value = "";
        try {
            columns = optionsObj.COLUMNS;
            key = Object.keys(optionsObj.COLUMNS)[0];
            value = optionsObj.COLUMNS[key];
            if (value === undefined) {
                throw new IInsightFacade_1.InsightError(`Value for the key "${key}" is undefined.`);
            }
        }
        catch {
            throw new IInsightFacade_1.InsightError(`Invalid Options object`);
        }
        let keyOptions = optionsObj.ORDER;
        if (columns.length === 0) {
            throw new IInsightFacade_1.InsightError(`No columns chosen`);
        }
        keyOptions = this.checkKeys(keyOptions, columns, validFields);
        const fields = [];
        for (const keyCol of columns) {
            if (keyCol.indexOf("_") === -1 || keyCol.indexOf("_") === 0) {
                throw new IInsightFacade_1.InsightError(`Invalid key, error with underscore ${keyCol}`);
            }
            const id = keyCol.substring(0, keyCol.indexOf("_"));
            const field = keyCol.substring(keyCol.indexOf("_") + 1, keyCol.length);
            this.addName(id);
            if (!validFields.includes(field)) {
                throw new IInsightFacade_1.InsightError(`Invalid field name ${field}`);
            }
            fields.push(field);
        }
        return new Options(fields, keyOptions);
    }
    static addName(id) {
        if (this.columnName === "") {
            this.columnName = id;
        }
        else if (this.columnName !== id) {
            throw new IInsightFacade_1.InsightError(`multiple dataset id, ${id}`);
        }
    }
    static checkKeys(keyOptions, columns, validFields) {
        let keyValue = "";
        if (keyOptions !== undefined) {
            try {
                if (keyOptions !== undefined && keyOptions.indexOf("_") === -1) {
                    throw new IInsightFacade_1.InsightError(`Invalid Order field name`);
                }
                keyValue = keyOptions.substring(keyOptions.indexOf("_") + 1, keyOptions.length);
                if (!validFields.includes(keyValue)) {
                    throw new IInsightFacade_1.InsightError(`Invalid Order field name`);
                }
                if (!columns.includes(keyOptions)) {
                    throw new IInsightFacade_1.InsightError(`Invalid Order field name`);
                }
            }
            catch {
                throw new IInsightFacade_1.InsightError(`Invalid Order field name`);
            }
        }
        return keyValue;
    }
}
exports.QueryParser = QueryParser;
class Body {
    filters;
    constructor(filters) {
        this.filters = filters;
    }
}
exports.Body = Body;
class LogicComparison {
    logic;
    filters;
    constructor(logic, filters) {
        this.logic = logic;
        this.filters = filters;
    }
}
exports.LogicComparison = LogicComparison;
class MComparison {
    comparator;
    mkey;
    value;
    constructor(comparator, mkey, value) {
        this.comparator = comparator;
        this.mkey = mkey;
        this.value = value;
    }
}
exports.MComparison = MComparison;
class SComparison {
    skey;
    value;
    constructor(skey, value) {
        this.skey = skey;
        this.value = value;
    }
}
exports.SComparison = SComparison;
class Negation {
    filters;
    constructor(filters) {
        this.filters = filters;
    }
}
exports.Negation = Negation;
class Options {
    columns;
    orderBy;
    constructor(columns, orderBy) {
        this.columns = columns;
        this.orderBy = orderBy;
    }
}
exports.Options = Options;
//# sourceMappingURL=QueryParser.js.map