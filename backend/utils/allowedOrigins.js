const DEFAULT_ORIGINS = [
    "https://corpculture.in",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
];

/** Allowed frontend origins for CORS and payment redirect validation. */
export const getAllowedOrigins = () => {
    const fromEnv = String(process.env.FRONTEND_URL || "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
    return [...new Set([...DEFAULT_ORIGINS, ...fromEnv])];
};

export const isAllowedFrontendOrigin = (url) => {
    const raw = String(url || "").trim();
    if (!raw) return false;
    try {
        const origin = new URL(raw).origin;
        return getAllowedOrigins().includes(origin);
    } catch {
        return getAllowedOrigins().includes(raw.replace(/\/$/, ""));
    }
};
