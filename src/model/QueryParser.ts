import { InsightError } from "../controller/IInsightFacade";

type Logic = "AND" | "OR";
type MComparator = "LT" | "GT" | "EQ";

export type Filter = LogicComparison | MComparison | SComparison | Negation;

export interface Query {
	filters: Filter[];
	options: Options;
}

export class QueryParser {
	public static columnName = "";

	public static parse(queryObj: any): Query {
		this.columnName = "";
		const validKeys = ["WHERE", "OPTIONS"];
		const queryKeys = Object.keys(queryObj);
		for (const key of queryKeys) {
			if (!validKeys.includes(key)) {
				throw new InsightError(`Invalid key "${key}" in query`);
			}
		}

		const filters = QueryParser.parseBody(queryObj.WHERE);
		const options = QueryParser.parseOptions(queryObj.OPTIONS);
		return { filters, options };
	}

	private static parseBody(whereObj: any): Filter[] {
		const emptyFilter: Filter[] = [];
		if (!whereObj) {
			return emptyFilter;
		}

		const keys = Object.keys(whereObj);
		if (keys.length === 0) {
			return emptyFilter;
		}

		if (keys.length > 1) {
			throw new InsightError(`Invalid WHERE format: multiple filters at the top level`);
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
				throw new InsightError(`Unknown Filter ${key}`);
		}
	}

	private static handleMComparison(key: MComparator, value: any): Filter[] {
		return [QueryParser.parseMComparison(key, value)];
	}

	private static handleLogicComparison(key: Logic, value: any): Filter[] {
		return [QueryParser.parseLogicComparison(key, value)];
	}

	private static handleSComparison(value: any): Filter[] {
		return [QueryParser.parseSComparison(value)];
	}

	private static handleNegation(value: any): Filter[] {
		return [new Negation(QueryParser.parseBody(value))];
	}

	private static parseMComparison(comparator: MComparator, comparisonObj: any): MComparison {
		if (Object.keys(comparisonObj).length === 0 || Object.values(comparisonObj).length === 0) {
			throw new InsightError(`invalid keys`);
		}
		let key: string;
		let value: any;

		try {
			key = Object.keys(comparisonObj)[0];
			value = comparisonObj[key];
		} catch {
			throw new InsightError(`Invalid key or value`);
		}

		if (key.indexOf("_") === -1 || key.indexOf("_") === 0) {
			throw new InsightError(`Invalid key, error with underscore ${key}`);
		}
		const id = key.substring(0, key.indexOf("_"));
		const field = key.substring(key.indexOf("_") + 1, key.length);

		if (this.columnName === "") {
			this.columnName = id;
		} else if (this.columnName !== id) {
			throw new InsightError(`multiple dataset id 1, ${QueryParser.columnName},${id}`);
		}

		const validFields = ["avg", "pass", "fail", "audit", "year"];

		if (!validFields.includes(field)) {
			throw new InsightError(`Invalid mfield name ${field}`);
		}

		if (!(typeof value === "number" && !isNaN(value))) {
			throw new InsightError(`Not an integer ${value}`);
		}
		return new MComparison(comparator, key, value);
	}

	private static parseLogicComparison(logic: Logic, filterlist: Filter[]): LogicComparison {
		const filters = filterlist.flatMap((filter) => QueryParser.parseBody(filter));
		return new LogicComparison(logic, filters);
	}

	private static parseSComparison(comparisonObj: any): SComparison {
		if (Object.keys(comparisonObj).length === 0 || Object.values(comparisonObj).length === 0) {
			throw new InsightError(`invalid keys`);
		}

		let key: string;
		let value: any;
		try {
			key = Object.keys(comparisonObj)[0];
			value = comparisonObj[key];
		} catch {
			throw new InsightError(`Invalid key or value`);
		}

		if (key.indexOf("_") === -1 || key.indexOf("_") === 0) {
			throw new InsightError(`Invalid key, missing underscore ${key}`);
		}
		const id = key.substring(0, key.indexOf("_"));
		const field = key.substring(key.indexOf("_") + 1, key.length);

		if (this.columnName === "") {
			this.columnName = id;
		} else if (this.columnName !== id) {
			throw new InsightError(`multiple dataset id 2, ${id}`);
		}

		const validFields = ["dept", "id", "instructor", "title", "uuid"];

		if (!validFields.includes(field)) {
			throw new InsightError(`Invalid sfield name ${field}`);
		}

		if (typeof value !== "string") {
			throw new InsightError(`Not a string ${value}`);
		}
		return new SComparison(key, value);
	}

	private static parseOptions(optionsObj: any): Options {
		const validFields = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
		let columns: string[] = [];
		let key = "";
		let value = "";

		try {
			columns = optionsObj.COLUMNS;
			key = Object.keys(optionsObj.COLUMNS)[0];
			value = optionsObj.COLUMNS[key];

			if (value === undefined) {
				throw new InsightError(`Value for the key "${key}" is undefined.`);
			}
		} catch {
			throw new InsightError(`Invalid Options object`);
		}

		let keyOptions = optionsObj.ORDER;

		if (columns.length === 0) {
			throw new InsightError(`No columns chosen`);
		}

		keyOptions = this.checkKeys(keyOptions, columns, validFields);

		const fields = [];

		for (const keyCol of columns) {
			if (keyCol.indexOf("_") === -1 || keyCol.indexOf("_") === 0) {
				throw new InsightError(`Invalid key, error with underscore ${keyCol}`);
			}
			const id = keyCol.substring(0, keyCol.indexOf("_"));
			const field = keyCol.substring(keyCol.indexOf("_") + 1, keyCol.length);
			this.addName(id);

			if (!validFields.includes(field)) {
				throw new InsightError(`Invalid field name ${field}`);
			}
			fields.push(field);
		}

		return new Options(fields, keyOptions);
	}

	private static addName(id: string): void {
		if (this.columnName === "") {
			this.columnName = id;
		} else if (this.columnName !== id) {
			throw new InsightError(`multiple dataset id, ${id}`);
		}
	}

	private static checkKeys(keyOptions: any, columns: string[], validFields: string[]): string {
		let keyValue = "";
		if (keyOptions !== undefined) {
			try {
				if (keyOptions !== undefined && keyOptions.indexOf("_") === -1) {
					throw new InsightError(`Invalid Order field name`);
				}

				keyValue = keyOptions.substring(keyOptions.indexOf("_") + 1, keyOptions.length);

				if (!validFields.includes(keyValue)) {
					throw new InsightError(`Invalid Order field name`);
				}

				if (!columns.includes(keyOptions)) {
					throw new InsightError(`Invalid Order field name`);
				}
			} catch {
				throw new InsightError(`Invalid Order field name`);
			}
		}
		return keyValue;
	}
}

// Body Class
export class Body {
	public filters: Filter[];

	constructor(filters: Filter[]) {
		this.filters = filters;
	}
}

// LogicComparison Class
export class LogicComparison {
	public logic: Logic;
	public filters: Filter[];

	constructor(logic: Logic, filters: Filter[]) {
		this.logic = logic;
		this.filters = filters;
	}
}

// MComparison Class
export class MComparison {
	public comparator: MComparator;
	public mkey: string;
	public value: number;

	constructor(comparator: MComparator, mkey: string, value: number) {
		this.comparator = comparator;
		this.mkey = mkey;
		this.value = value;
	}
}

// SComparison Class (for IS)
export class SComparison {
	public skey: string;
	public value: string;

	constructor(skey: string, value: string) {
		this.skey = skey;
		this.value = value;
	}
}

// Negation Class
export class Negation {
	public filters: Filter[];

	constructor(filters: Filter[]) {
		this.filters = filters;
	}
}

// Options Class
export class Options {
	public columns: string[];
	public orderBy: string;

	constructor(columns: string[], orderBy: string) {
		this.columns = columns;
		this.orderBy = orderBy;
	}
}
