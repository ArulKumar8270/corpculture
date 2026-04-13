/**
 * Normalize sendDetailsTo from FormData / JSON into a deduplicated list of non-empty strings.
 * Accepts: string (newline-separated, or JSON array string), array, or scalar.
 */
export function normalizeSendDetailsTo(value) {
    if (value == null || value === "") return [];
    if (Array.isArray(value)) {
        return [
            ...new Set(
                value.map((v) => String(v ?? "").trim()).filter(Boolean)
            ),
        ];
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];
        if (trimmed.startsWith("[")) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return normalizeSendDetailsTo(parsed);
                }
            } catch {
                // fall through to line splitting
            }
        }
        return [
            ...new Set(
                trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
            ),
        ];
    }
    const one = String(value).trim();
    return one ? [one] : [];
}
