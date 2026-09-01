import rateLimit from "express-rate-limit";

/** Limit payment initiation / verification abuse. */
export const paymentRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many payment requests. Please try again later.",
    },
});

/** Stricter limit for order creation endpoints. */
export const orderCreateRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many order requests. Please try again later.",
    },
});
