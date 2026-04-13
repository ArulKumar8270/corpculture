/**
 * Normalize sendDetailsTo into { name, email }[] for storage (email) and display (name).
 * Accepts: JSON array string of objects, array of objects, legacy newline-separated strings, legacy string arrays.
 */
const EMAIL_IN_LABEL = /Email:\s*([^\s,)]+)/i;

function parseLegacyLineToRecipient(line) {
    const s = String(line ?? "").trim();
    if (!s || s === "[object Object]") return null;
    const m = s.match(EMAIL_IN_LABEL);
    const email = m ? m[1].trim() : "";
    // No email in line: keep full label as display name (e.g. "GANESH (IT)").
    if (!email) {
        return { name: s, email: "" };
    }
    const paren = s.indexOf("(");
    let name =
        paren !== -1
            ? s.slice(0, paren).trim()
            : s
                  .replace(EMAIL_IN_LABEL, "")
                  .replace(/Mobile:\s*[^,)]*,?\s*/i, "")
                  .replace(/,\s*$/, "")
                  .trim();
    if (!name) name = s.replace(EMAIL_IN_LABEL, "").trim();
    return { name, email };
}

function recipientKey(r) {
    const e = (r.email || "").trim().toLowerCase();
    const n = (r.name || "").trim().toLowerCase();
    return e ? `e:${e}` : `n:${n}`;
}

/** Only accept primitives for name/email; never String(object) -> "[object Object]". */
function scalarContactField(v) {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        return String(v).trim();
    }
    return "";
}

function itemToRecipient(item) {
    if (item == null) return null;
    if (typeof item === "object" && !Array.isArray(item)) {
        let name = scalarContactField(item.name);
        let email = scalarContactField(item.email);
        if (!name && typeof item.name === "object" && item.name != null) {
            name = scalarContactField(item.name.name) || scalarContactField(item.name.label);
        }
        if (!email && typeof item.email === "object" && item.email != null) {
            email = scalarContactField(item.email.email) || scalarContactField(item.email.address);
        }
        if (!name || name === "[object Object]") return null;
        if (email === "[object Object]") email = "";
        return { name, email };
    }
    return parseLegacyLineToRecipient(item);
}

function rawListFromValue(value) {
    if (value == null || value === "") return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        if ("name" in value || "email" in value) {
            return [value];
        }
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];
        if (trimmed.startsWith("[")) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                // fall through
            }
        }
        return trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    }
    return [value];
}

export function normalizeSendDetailsTo(value) {
    const raw = rawListFromValue(value);
    const out = [];
    const seen = new Set();
    for (const item of raw) {
        const r = itemToRecipient(item);
        if (!r) continue;
        const k = recipientKey(r);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({ name: r.name, email: r.email });
    }
    return out;
}
