import mongoose from "mongoose";
import HdfcPaymentSession from "../../models/hdfcPaymentSessionModel.js";
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";
import { tryAutoAssignNewOrder } from "../../utils/tryAutoAssignNewOrder.js";
import {
    mapValidatedOrderItems,
    validateAndPriceOrderItems,
} from "../../utils/validateOrderItems.js";
import {
    createHdfcSession,
    getHdfcConfig,
    getHdfcOrder,
    isHdfcPaymentFailed,
    isHdfcPaymentSuccess,
    isHdfcOrderPaid,
    makeHdfcCustomerId,
    makeHdfcOrderId,
    refundHdfcOrder,
    sessionPaymentUrl,
} from "../../utils/hdfcSmartGateway.js";

const requiredShipping = ["address", "city", "country", "state", "pincode", "phoneNo"];

const LIVE_FRONTEND_ORIGIN = "https://corpculture.in";

const stripQuery = (url) => String(url || "").trim().replace(/\/$/, "").split("?")[0];

const merchantAppOrigin = (frontendURL) => {
    const origin = stripQuery(frontendURL);
    if (!origin) return "";
    try {
        return new URL(origin).origin;
    } catch {
        return origin;
    }
};

const isLocalOrigin = (origin) =>
    /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(String(origin || ""));

/** HDFC must redirect to the live merchant site (HTTPS). */
const resolveReturnUrl = () => {
    const configured = stripQuery(getHdfcConfig().returnUrl);
    if (configured) return configured;
    return `${LIVE_FRONTEND_ORIGIN}/shipping/payment-return`;
};

const validateCheckoutPayload = (body) => {
    const { orderItems, shippingInfo, orderReferenceNo } = body || {};
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return "No order items provided";
    }
    const ref = String(orderReferenceNo || "").trim();
    if (!ref) return "Order reference number is required";
    if (!shippingInfo || typeof shippingInfo !== "object") {
        return "Shipping info is required";
    }
    for (const key of requiredShipping) {
        if (shippingInfo[key] == null || String(shippingInfo[key]).trim() === "") {
            return `Shipping field '${key}' is required`;
        }
    }
    return null;
};

const mapOrderItems = (orderItems) => mapValidatedOrderItems(orderItems);

const reduceStock = async (orderItems) => {
    for (const item of orderItems) {
        const product = await productModel.findById(item?.productId);
        if (product) {
            product.stock -= item?.quantity;
            await product.save();
        }
    }
};

const splitName = (fullName = "") => {
    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] || "Customer",
        lastName: parts.slice(1).join(" ") || ".",
    };
};

export const initiateHdfcPayment = async (req, res) => {
    try {
        const error = validateCheckoutPayload(req.body);
        if (error) {
            return res.status(400).send({ success: false, message: error });
        }

        const { orderItems, shippingInfo, orderReferenceNo, companyId, frontendURL } = req.body;
        const priced = await validateAndPriceOrderItems(orderItems);
        if (priced.error) {
            return res.status(400).send({ success: false, message: priced.error });
        }
        const { items: validatedItems, amount } = priced;

        const hdfcOrderId = makeHdfcOrderId();
        const hdfcCustomerId = makeHdfcCustomerId(req.user._id);
        const { firstName, lastName } = splitName(req.user?.name);
        const frontendOrigin = (() => {
            const origin = merchantAppOrigin(frontendURL);
            if (origin && !isLocalOrigin(origin)) return origin;
            return LIVE_FRONTEND_ORIGIN;
        })();
        const returnUrl = resolveReturnUrl();
        const phone = shippingInfo.phoneNo || req.user?.phone;
        const email = req.user?.email || "customer@corpculture.in";

        const phoneDigits = String(phone || "").replace(/\D/g, "").slice(-10);
        if (phoneDigits.length !== 10) {
            return res.status(400).send({
                success: false,
                message: "A valid 10-digit customer phone is required for payment",
            });
        }

        const hdfcSession = await createHdfcSession({
            orderId: hdfcOrderId,
            amount,
            customerId: hdfcCustomerId,
            customerEmail: email,
            customerPhone: phoneDigits,
            firstName,
            lastName,
            returnUrl,
            description: `Corp Culture order ${String(orderReferenceNo).trim()}`,
        });

        const paymentLinks = hdfcSession?.payment_links || {};
        const paymentUrl = paymentLinks.web || paymentLinks.mobile || hdfcSession?.payment_link;
        if (!paymentUrl) {
            return res.status(502).send({
                success: false,
                message: "HDFC did not return a payment page link",
            });
        }

        const paymentSession = await HdfcPaymentSession.create({
            hdfcOrderId,
            buyer: req.user._id,
            hdfcCustomerId,
            orderItems: validatedItems,
            shippingInfo,
            orderReferenceNo: String(orderReferenceNo).trim(),
            companyId:
                companyId && mongoose.Types.ObjectId.isValid(companyId)
                    ? companyId
                    : undefined,
            amount,
            status: "pending",
            hdfcStatus: hdfcSession?.status || "NEW",
            paymentLinks,
            frontendOrigin,
        });

        return res.status(201).send({
            success: true,
            hdfcOrderId,
            amount,
            paymentUrl,
            paymentLinks,
            sdkPayload: hdfcSession?.sdk_payload || null,
            paymentSessionId: paymentSession._id,
            returnUrl,
        });
    } catch (err) {
        console.error("HDFC initiate payment error:", err);
        return res.status(err.status || 500).send({
            success: false,
            message: err.message || "Failed to start HDFC payment",
        });
    }
};

const fulfillPaidSession = async (session, hdfcOrder) => {
    if (session.createdOrderId) {
        const existing = await orderModel.findById(session.createdOrderId);
        if (existing) return existing;
    }
    const existingByHdfc = await orderModel.findOne({ hdfcOrderId: session.hdfcOrderId });
    if (existingByHdfc) return existingByHdfc;

    const order = await orderModel.create({
        paymentId: hdfcOrder?.id || session.hdfcOrderId,
        hdfcOrderId: session.hdfcOrderId,
        products: mapOrderItems(session.orderItems),
        buyer: session.buyer,
        orderReferenceNo: session.orderReferenceNo,
        shippingInfo: session.shippingInfo,
        amount: session.amount,
        paymentMethod: "online",
        paymentStatus: "Paid",
        ...(session.companyId ? { companyId: session.companyId } : {}),
    });

    await tryAutoAssignNewOrder(order);
    await reduceStock(session.orderItems);

    session.status = "paid";
    session.hdfcStatus = hdfcOrder?.status || "CHARGED";
    session.createdOrderId = order._id;
    await session.save();
    return order;
};

export const verifyHdfcPayment = async (req, res) => {
    try {
        const hdfcOrderId = String(req.body?.hdfcOrderId || req.params?.orderId || "").trim();
        if (!hdfcOrderId) {
            return res.status(400).send({ success: false, message: "hdfcOrderId is required" });
        }

        const session = await HdfcPaymentSession.findOne({
            hdfcOrderId,
            buyer: req.user._id,
        });
        if (!session) {
            return res.status(404).send({ success: false, message: "Payment session not found" });
        }

        const hdfcOrder = await getHdfcOrder(hdfcOrderId, session.hdfcCustomerId);
        const hdfcStatus = String(hdfcOrder?.status || "").toUpperCase();
        session.hdfcStatus = hdfcStatus;
        const paymentUrl = sessionPaymentUrl(session);

        if (isHdfcPaymentSuccess(hdfcStatus) && isHdfcOrderPaid(hdfcOrder)) {
            const paidAmount = Number(hdfcOrder?.amount);
            if (!(paidAmount >= Number(session.amount))) {
                session.status = "failed";
                await session.save();
                return res.status(200).send({
                    success: false,
                    paid: false,
                    hdfcStatus,
                    message: "Paid amount does not match the order total",
                });
            }
            const order = await fulfillPaidSession(session, hdfcOrder);
            return res.status(200).send({
                success: true,
                paid: true,
                hdfcStatus,
                paymentUrl,
                order,
            });
        }

        if (isHdfcPaymentFailed(hdfcStatus)) {
            session.status = "failed";
            await session.save();
            return res.status(200).send({
                success: false,
                paid: false,
                hdfcStatus,
                paymentUrl,
                message: "Payment failed",
            });
        }

        await session.save();
        const awaitingUpi =
            hdfcStatus === "PENDING_VBV" ||
            hdfcStatus === "AUTHORIZING" ||
            hdfcStatus === "SUCCESS" ||
            (isHdfcPaymentSuccess(hdfcStatus) && !isHdfcOrderPaid(hdfcOrder));
        return res.status(200).send({
            success: true,
            paid: false,
            pending: true,
            awaitingUpi,
            resumePayment: false,
            hdfcStatus,
            paymentUrl,
            message: awaitingUpi
                ? "Waiting for UPI approval. Do not close the payment page."
                : "Payment is still pending",
        });
    } catch (err) {
        console.error("HDFC verify payment error:", err);
        return res.status(err.status || 500).send({
            success: false,
            message: err.message || "Failed to verify HDFC payment",
        });
    }
};

export const refundHdfcPayment = async (req, res) => {
    try {
        const hdfcOrderId = String(req.body?.hdfcOrderId || req.params?.orderId || "").trim();
        const amount = Number(req.body?.amount);
        if (!hdfcOrderId) {
            return res.status(400).send({ success: false, message: "hdfcOrderId is required" });
        }
        if (!(amount > 0)) {
            return res.status(400).send({ success: false, message: "Refund amount must be greater than 0" });
        }

        const session = await HdfcPaymentSession.findOne({ hdfcOrderId });
        if (!session) {
            return res.status(404).send({ success: false, message: "Payment session not found" });
        }

        const uniqueRequestId = String(req.body?.uniqueRequestId || `RF${Date.now()}`).replace(/[^a-zA-Z0-9]/g, "").slice(0, 21);
        const refund = await refundHdfcOrder({
            orderId: hdfcOrderId,
            customerId: session.hdfcCustomerId,
            amount,
            uniqueRequestId,
        });

        session.refunds.push({
            uniqueRequestId,
            amount,
            response: refund,
            createdAt: new Date(),
        });
        await session.save();

        return res.status(200).send({
            success: true,
            refund,
        });
    } catch (err) {
        console.error("HDFC refund error:", err);
        return res.status(err.status || 500).send({
            success: false,
            message: err.message || "Failed to refund HDFC payment",
        });
    }
};

export const hdfcPaymentReturn = async (req, res) => {
    try {
        const hdfcOrderId = String(req.query?.order_id || req.query?.orderId || "").trim();
        let frontendOrigin = LIVE_FRONTEND_ORIGIN;
        if (hdfcOrderId) {
            const session = await HdfcPaymentSession.findOne({ hdfcOrderId });
            if (session?.frontendOrigin && !isLocalOrigin(session.frontendOrigin)) {
                frontendOrigin = session.frontendOrigin;
            }
        }
        const target = new URL("/shipping/payment-return", `${String(frontendOrigin).replace(/\/$/, "")}/`);
        if (hdfcOrderId) target.searchParams.set("order_id", hdfcOrderId);
        return res.redirect(302, target.toString());
    } catch (err) {
        console.error("HDFC return redirect error:", err);
        return res.redirect(302, `${LIVE_FRONTEND_ORIGIN}/shipping/payment-return`);
    }
};
