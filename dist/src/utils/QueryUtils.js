"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSections = exports.createWildcardRegex = void 0;
const createWildcardRegex = (input) => {
    if (input.startsWith("*") && !input.endsWith("*")) {
        const trimmedInput = input.slice(1);
        return new RegExp(`${trimmedInput}$`);
    }
    else if (!input.startsWith("*") && input.endsWith("*")) {
        const trimmedInput = input.slice(0, -1);
        return new RegExp(`^${trimmedInput}`);
    }
    else if (input.startsWith("*") && input.endsWith("*")) {
        const trimmedInput = input.slice(1, -1);
        return new RegExp(`${trimmedInput}`);
    }
    else {
        return new RegExp(`^${input}$`);
    }
};
exports.createWildcardRegex = createWildcardRegex;
const findSections = (dataset, comparator, value, field) => {
    const sectionsResult = [];
    const sections = dataset.sections || [];
    for (const section of sections) {
        switch (comparator) {
            case "EQ":
                if (Number(section[field]) === value) {
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
exports.findSections = findSections;
//# sourceMappingURL=QueryUtils.js.map