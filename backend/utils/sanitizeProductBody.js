const isBlank = (value) =>
    value === undefined ||
    value === null ||
    String(value).trim() === "" ||
    String(value) === "undefined" ||
    String(value) === "null";

const toOptionalNumber = (value) => {
    if (isBlank(value)) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
};

const parseJsonList = (value) => {
    if (isBlank(value)) return [];
    const list = Array.isArray(value) ? value : [value];
    return list
        .map((item) => {
            if (item == null) return null;
            if (typeof item === "object") return item;
            try {
                return JSON.parse(item);
            } catch {
                return null;
            }
        })
        .filter(Boolean);
};

const OPTIONAL_NUMBERS = [
    "installationCost",
    "deliveryCharge",
    "weight",
    "length",
    "width",
    "height",
    "discountPrice",
    "warranty",
];

export const sanitizeProductBody = (body = {}) => {
    const next = { ...body };
    for (const key of OPTIONAL_NUMBERS) {
        const n = toOptionalNumber(next[key]);
        if (n === undefined) delete next[key];
        else next[key] = n;
    }
    if (next.specifications !== undefined) {
        next.specifications = parseJsonList(next.specifications);
    }
    next.priceRange = parseJsonList(next.priceRange);
    return next;
};
