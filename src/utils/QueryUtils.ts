import { InsightResult } from "../controller/IInsightFacade";
export const createWildcardRegex = (input: string): RegExp => {
	if (input.startsWith("*") && !input.endsWith("*")) {
		const trimmedInput = input.slice(1);
		return new RegExp(`${trimmedInput}$`);
	} else if (!input.startsWith("*") && input.endsWith("*")) {
		const trimmedInput = input.slice(0, -1);
		return new RegExp(`^${trimmedInput}`);
	} else if (input.startsWith("*") && input.endsWith("*")) {
		const trimmedInput = input.slice(1, -1);
		return new RegExp(`${trimmedInput}`);
	} else {
		return new RegExp(`^${input}$`);
	}
};

export const findSections = (dataset: any, comparator: string, value: any, field: string): InsightResult[] => {
	const sectionsResult: InsightResult[] = [];
	const sections = dataset.sections || [];
	for (const section of sections) {
		switch (comparator) {
			case "EQ":
				if (Number(section[field]) === value) {
					// console.log("section", section[field]);
					// console.log("value", value);
					// console.log(section[field]);
					// console.log(value);
					sectionsResult.push(section);
				}
				break;
			case "GT":
				if (Number(section[field]) > value) {
					sectionsResult.push(section);
				}
				break;
			case "LT":
				if (Number(section[field]) < value) {
					sectionsResult.push(section);
				}
				break;
			case "IS":
				if (value.test(String(section[field]))) {
					sectionsResult.push(section);
				}
				break;
			default:
				throw new Error(`Unsupported comparator: ${comparator}`);
		}
	}
	return sectionsResult;
};
