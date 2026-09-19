import mongoose from "mongoose";

/**
 * Normalize values that may arrive as:
 * - plain ObjectId / string id
 * - { _id: "..." }
 * - { $eq: "..." } / { $eq: { _id: "..." } }
 * - { $in: ["...", ...] }
 */
export function toObjectId(value) {
    if (value == null || value === "") return null;
    if (value instanceof mongoose.Types.ObjectId) return value;

    if (typeof value === "object") {
        if (value.$eq != null) return toObjectId(value.$eq);
        if (value._id != null) return toObjectId(value._id);
        return null;
    }

    const str = String(value).trim();
    if (!str || str.includes("{{")) return null;
    if (!mongoose.Types.ObjectId.isValid(str)) return null;
    return new mongoose.Types.ObjectId(str);
}

/**
 * Build a Mongoose-safe companyId filter from body/query values.
 * Accepts plain id, { $eq }, { $in }, or { _id }.
 */
export function normalizeCompanyIdFilter(companyId) {
    if (companyId == null || companyId === "") return undefined;

    if (typeof companyId === "object" && Array.isArray(companyId.$in)) {
        const ids = companyId.$in.map(toObjectId).filter(Boolean);
        if (!ids.length) return { __invalidCompanyId: true };
        return { $in: ids };
    }

    const id = toObjectId(companyId);
    if (!id) return { __invalidCompanyId: true };
    return id;
}

/**
 * Normalize a list of ids from:
 * - ["...", ...]
 * - [{ _id: "..." }, ...]
 * - { $in: ["...", ...] }
 */
export function toObjectIdList(value) {
    if (value == null || value === "") return [];
    const arr = Array.isArray(value)
        ? value
        : Array.isArray(value.$in)
            ? value.$in
            : [value];
    return arr.map((item) => toObjectId(item)).filter(Boolean);
}

/**
 * Apply normalized companyId onto a query object (mutates query).
 * Returns false if companyId was provided but invalid (caller should return empty list).
 */
export function applyCompanyIdFilter(query, companyId) {
    if (companyId == null || companyId === "") return true;
    const normalized = normalizeCompanyIdFilter(companyId);
    if (normalized?.__invalidCompanyId) return false;
    query.companyId = normalized;
    return true;
}
