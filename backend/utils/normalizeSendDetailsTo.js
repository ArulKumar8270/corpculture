/**
 * Normalize sendDetailsTo into { name, email, mobile }[] for storage; UI can show name only.
 * Accepts: JSON array string of objects, array of objects, legacy newline-separated strings, legacy string arrays.
 */
const EMAIL_IN_LABEL = /Email:\s*([^\s,)]+)/i;
const MOBILE_IN_LABEL = /Mobile:\s*([^\s,)]+)/i;

function parseLegacyLineToRecipient(line) {
    const s = String(line ?? "").trim();
    if (!s || s === "[object Object]") return null;
    const mEmail = s.match(EMAIL_IN_LABEL);
    const email = mEmail ? mEmail[1].trim() : "";
    const mMob = s.match(MOBILE_IN_LABEL);
    const mobile = mMob ? mMob[1].trim() : "";
    // No email in line: keep full label as display name (e.g. "GANESH (IT)").
    if (!email) {
        return { name: s, email: "", mobile };
    }
    const paren = s.indexOf("(");
    let name =
        paren !== -1
            ? s.slice(0, paren).trim()
            : s
                  .replace(EMAIL_IN_LABEL, "")
                  .replace(MOBILE_IN_LABEL, "")
                  .replace(/,\s*$/, "")
                  .trim();
    if (!name) name = s.replace(EMAIL_IN_LABEL, "").replace(MOBILE_IN_LABEL, "").trim();
    return { name, email, mobile };
}

function recipientKey(r) {
    const e = (r.email || "").trim().toLowerCase();
    if (e) return `e:${e}`;
    const m = (r.mobile || "").trim().toLowerCase();
    if (m) return `m:${m}`;
    return `n:${(r.name || "").trim().toLowerCase()}`;
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
        let mobile = scalarContactField(item.mobile);
        if (!name && typeof item.name === "object" && item.name != null) {
            name = scalarContactField(item.name.name) || scalarContactField(item.name.label);
        }
        if (!email && typeof item.email === "object" && item.email != null) {
            email = scalarContactField(item.email.email) || scalarContactField(item.email.address);
        }
        if (!mobile && typeof item.mobile === "object" && item.mobile != null) {
            mobile =
                scalarContactField(item.mobile.mobile) ||
                scalarContactField(item.mobile.phone) ||
                scalarContactField(item.mobile.number);
        }
        if (!name || name === "[object Object]") return null;
        if (email === "[object Object]") email = "";
        if (mobile === "[object Object]") mobile = "";
        return { name, email, mobile };
    }
    return parseLegacyLineToRecipient(item);
}

function rawListFromValue(value) {
    if (value == null || value === "") return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        if ("name" in value || "email" in value || "mobile" in value) {
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
        out.push({ name: r.name, email: r.email, mobile: r.mobile || "" });
    }
    return out;
}
