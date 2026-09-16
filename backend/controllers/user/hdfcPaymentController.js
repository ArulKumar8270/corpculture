import mongoose from "mongoose";
import HdfcPaymentSession from "../../models/hdfcPaymentSessionModel.js";
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";
import { tryAutoAssignNewOrder } from "../../utils/tryAutoAssignNewOrder.js";
import {
    mapValidatedOrderItems,
    validateAndPriceOrderItems,
} from "../../utils/validateOrderItems.js";
import { isAllowedFrontendOrigin } from "../../utils/allowedOrigins.js";
import {
    createHdfcSession,
    getHdfcConfig,
    getHdfcOrderDualInquiry,
    isHdfcPaymentFailed,
    isHdfcPaymentSuccess,
    isHdfcOrderPaid,
    makeHdfcCustomerId,
    makeHdfcOrderId,
    refundHdfcOrder,
    sessionPaymentUrl,
    verifyHdfcReturnSignature,
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

const resolveReturnUrl = (frontendOrigin) => {
    const { returnUrl: configured, isUat } = getHdfcConfig();
    const origin = stripQuery(frontendOrigin);
    if (origin) {
        // Prod/audit parity: only allow http localhost return URLs on UAT.
        if (isLocalOrigin(origin)) {
            if (!isUat) return stripQuery(configured) || `${LIVE_FRONTEND_ORIGIN}/shipping/payment-return`;
            return `${origin}/payment-return.html`;
        }
        if (!/^https:/i.test(origin) && !isUat) {
            return `${LIVE_FRONTEND_ORIGIN}/shipping/payment-return`;
        }
        return `${origin}/shipping/payment-return`;
    }
    const fallback = stripQuery(configured);
    if (fallback) return fallback;
    return `${LIVE_FRONTEND_ORIGIN}/shipping/payment-return`;
};

const resolveFrontendOrigin = (frontendURL) => {
    const { isUat } = getHdfcConfig();
    const origin = merchantAppOrigin(frontendURL);
    if (!origin) return LIVE_FRONTEND_ORIGIN;
    // Reject origins outside the allowlist (URL redirection validation).
    if (!isAllowedFrontendOrigin(origin) && !isLocalOrigin(origin)) {
        return LIVE_FRONTEND_ORIGIN;
    }
    // On UAT, keep localhost so local checkout can complete after payment.
    if (isLocalOrigin(origin)) return isUat ? origin : LIVE_FRONTEND_ORIGIN;
    return origin;
};

const makeReceiptNumber = (hdfcOrderId) =>
    `R${String(hdfcOrderId || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 18)
        .toUpperCase()}`;

const receiptPayload = (session, order = null) => ({
    receiptNumber: session?.receiptNumber || makeReceiptNumber(session?.hdfcOrderId),
    hdfcOrderId: session?.hdfcOrderId || "",
    orderReferenceNo: session?.orderReferenceNo || order?.orderReferenceNo || "",
    amount: Number(session?.amount ?? order?.amount ?? 0),
    orderId: order?._id || session?.createdOrderId || null,
    paymentStatus: order?.paymentStatus || (session?.status === "paid" ? "Paid" : session?.status),
    message:
        session?.status === "paid" || order?.paymentStatus === "Paid"
            ? "Payment successful"
            : session?.failureReason || "Payment update",
});

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
        const frontendOrigin = resolveFrontendOrigin(frontendURL);
        const preferredReturnUrl = resolveReturnUrl(frontendOrigin);
        const configuredReturnUrl = stripQuery(getHdfcConfig().returnUrl) || `${LIVE_FRONTEND_ORIGIN}/shipping/payment-return`;
        const phone = shippingInfo.phoneNo || req.user?.phone;
        const email = req.user?.email || "customer@corpculture.in";

        const phoneDigits = String(phone || "").replace(/\D/g, "").slice(-10);
        if (phoneDigits.length !== 10) {
            return res.status(400).send({
                success: false,
                message: "A valid 10-digit customer phone is required for payment",
            });
        }

        let returnUrl = preferredReturnUrl;
        let hdfcSession;
        try {
            hdfcSession = await createHdfcSession({
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
        } catch (sessionErr) {
            // Gateway may reject http://localhost return_url — fall back to HTTPS merchant URL.
            if (returnUrl !== configuredReturnUrl) {
                console.warn("HDFC session with app return_url failed; retrying with configured return_url:", sessionErr.message);
                returnUrl = configuredReturnUrl;
                hdfcSession = await createHdfcSession({
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
            } else {
                throw sessionErr;
            }
        }

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
            receiptNumber: makeReceiptNumber(hdfcOrderId),
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
            receipt: receiptPayload(paymentSession),
        });
    } catch (err) {
        console.error("HDFC initiate payment error:", err);
        return res.status(err.status || 500).send({
            success: false,
            message: err.message || "Failed to start HDFC payment",
        });
    }
};

const snapshotGateway = (hdfcOrder) => {
    if (!hdfcOrder || typeof hdfcOrder !== "object") return null;
    return {
        id: hdfcOrder.id,
        status: hdfcOrder.status,
        amount: hdfcOrder.amount,
        currency: hdfcOrder.currency,
        order_id: hdfcOrder.order_id,
        payment_method: hdfcOrder.payment_method || hdfcOrder.payment_method_type,
        txn_id: hdfcOrder.txn_id,
        dummy: hdfcOrder.dummy ?? hdfcOrder.is_dummy ?? hdfcOrder.dummy_order,
        txn_detail: hdfcOrder.txn_detail
            ? {
                  status: hdfcOrder.txn_detail.status,
                  gateway: hdfcOrder.txn_detail.gateway,
                  rrn: hdfcOrder.txn_detail.rrn,
              }
            : undefined,
        payment_gateway_response: hdfcOrder.payment_gateway_response
            ? {
                  rrn: hdfcOrder.payment_gateway_response.rrn,
                  epg_txn_id: hdfcOrder.payment_gateway_response.epg_txn_id,
                  auth_id_code: hdfcOrder.payment_gateway_response.auth_id_code,
                  resp_message: hdfcOrder.payment_gateway_response.resp_message,
              }
            : undefined,
        capturedAt: new Date().toISOString(),
    };
};

const fulfillPaidSession = async (session, hdfcOrder) => {
    if (!session.receiptNumber) {
        session.receiptNumber = makeReceiptNumber(session.hdfcOrderId);
    }
    if (session.createdOrderId) {
        const existing = await orderModel.findById(session.createdOrderId);
        if (existing) {
            if (existing.paymentStatus !== "Paid") {
                existing.paymentStatus = "Paid";
                existing.paymentId = hdfcOrder?.id || session.hdfcOrderId;
                await existing.save();
            }
            return existing;
        }
    }
    const existingByHdfc = await orderModel.findOne({ hdfcOrderId: session.hdfcOrderId });
    if (existingByHdfc) {
        if (existingByHdfc.paymentStatus !== "Paid") {
            existingByHdfc.paymentStatus = "Paid";
            existingByHdfc.paymentId = hdfcOrder?.id || session.hdfcOrderId;
            await existingByHdfc.save();
        }
        session.status = "paid";
        session.hdfcStatus = hdfcOrder?.status || "CHARGED";
        session.createdOrderId = existingByHdfc._id;
        session.failureReason = "";
        session.lastGatewayResponse = snapshotGateway(hdfcOrder);
        await session.save();
        return existingByHdfc;
    }

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
    session.failureReason = "";
    session.lastGatewayResponse = snapshotGateway(hdfcOrder);
    await session.save();
    return order;
};

/** Persist a Failed order when payment does not complete. Does not reduce stock. */
const fulfillFailedSession = async (session, hdfcOrder, reason) => {
    session.status = "failed";
    session.hdfcStatus = String(hdfcOrder?.status || session.hdfcStatus || "FAILED").toUpperCase();
    session.failureReason = String(reason || "Payment failed").slice(0, 500);
    session.lastGatewayResponse = snapshotGateway(hdfcOrder) || session.lastGatewayResponse;
    if (!session.receiptNumber) {
        session.receiptNumber = makeReceiptNumber(session.hdfcOrderId);
    }

    if (session.createdOrderId) {
        const existing = await orderModel.findById(session.createdOrderId);
        if (existing) {
            if (existing.paymentStatus === "Paid") {
                await session.save();
                return existing;
            }
            existing.paymentStatus = "Failed";
            await existing.save();
            await session.save();
            return existing;
        }
    }

    let order = await orderModel.findOne({ hdfcOrderId: session.hdfcOrderId });
    if (order) {
        if (order.paymentStatus !== "Paid") {
            order.paymentStatus = "Failed";
            await order.save();
        }
        session.createdOrderId = order._id;
        await session.save();
        return order;
    }

    order = await orderModel.create({
        paymentId: hdfcOrder?.id || `FAILED-${session.hdfcOrderId}`,
        hdfcOrderId: session.hdfcOrderId,
        products: mapOrderItems(session.orderItems),
        buyer: session.buyer,
        orderReferenceNo: session.orderReferenceNo,
        shippingInfo: session.shippingInfo,
        amount: session.amount,
        paymentMethod: "online",
        paymentStatus: "Failed",
        orderStatus: "Cancelled",
        ...(session.companyId ? { companyId: session.companyId } : {}),
    });

    session.createdOrderId = order._id;
    await session.save();
    return order;
};

const collectReturnSignatureParams = (req) => {
    const fromBody = req.body?.returnParams && typeof req.body.returnParams === "object"
        ? req.body.returnParams
        : {};
    const fromQuery = req.query && typeof req.query === "object" ? req.query : {};
    return { ...fromQuery, ...fromBody };
};

export const verifyHdfcPayment = async (req, res) => {
    try {
        const hdfcOrderId = String(req.body?.hdfcOrderId || req.params?.orderId || "").trim();
        const forceFail = Boolean(req.body?.forceFail);
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

        // Response tampering: if gateway sent a signed return payload, validate with RESPONSE_KEY.
        const { responseKey } = getHdfcConfig();
        const returnParams = collectReturnSignatureParams(req);
        if (returnParams?.signature && responseKey) {
            const sigCheck = verifyHdfcReturnSignature(returnParams, responseKey);
            if (!sigCheck.ok && !sigCheck.skipped) {
                return res.status(400).send({
                    success: false,
                    paid: false,
                    message: "Invalid payment response signature",
                    failureReason: "Response signature validation failed",
                    receipt: receiptPayload(session),
                });
            }
            // Bind signature order_id to this session when present.
            const signedOrderId = String(returnParams.order_id || returnParams.orderId || "").trim();
            if (signedOrderId && signedOrderId !== hdfcOrderId) {
                return res.status(400).send({
                    success: false,
                    paid: false,
                    message: "Payment response order mismatch",
                    failureReason: "Signed order id does not match session",
                    receipt: receiptPayload(session),
                });
            }
        }

        if (session.status === "paid" && session.createdOrderId) {
            const order = await orderModel.findById(session.createdOrderId);
            return res.status(200).send({
                success: true,
                paid: true,
                hdfcStatus: session.hdfcStatus,
                paymentUrl: sessionPaymentUrl(session),
                order,
                receipt: receiptPayload(session, order),
                message: "Payment successful",
            });
        }

        if (session.status === "failed" && session.createdOrderId && !forceFail) {
            const order = await orderModel.findById(session.createdOrderId);
            return res.status(200).send({
                success: false,
                paid: false,
                hdfcStatus: session.hdfcStatus,
                paymentUrl: sessionPaymentUrl(session),
                order,
                failureReason: session.failureReason,
                message: session.failureReason || "Payment failed",
                receipt: receiptPayload(session, order),
            });
        }

        let hdfcOrder = null;
        let hdfcStatus = String(session.hdfcStatus || "").toUpperCase();
        let dualConsistent = true;
        try {
            // Mandatory dual inquiry (Status API called twice on response).
            const dual = await getHdfcOrderDualInquiry(hdfcOrderId, session.hdfcCustomerId);
            dualConsistent = dual.consistent;
            hdfcOrder = dual.consistent ? dual.second : dual.first;
            hdfcStatus = String(hdfcOrder?.status || "").toUpperCase();
            session.hdfcStatus = hdfcStatus;
            session.lastGatewayResponse = {
                ...snapshotGateway(hdfcOrder),
                dualInquiry: {
                    consistent: dual.consistent,
                    firstStatus: dual.first?.status,
                    secondStatus: dual.second?.status,
                    firstAmount: dual.first?.amount,
                    secondAmount: dual.second?.amount,
                },
            };
            if (!dual.consistent) {
                await session.save();
                return res.status(200).send({
                    success: true,
                    paid: false,
                    pending: true,
                    awaitingUpi: false,
                    resumePayment: Boolean(sessionPaymentUrl(session)),
                    hdfcStatus,
                    paymentUrl: sessionPaymentUrl(session),
                    message: "Confirming payment with bank (dual inquiry). Please wait...",
                    receipt: receiptPayload(session),
                });
            }
        } catch (gatewayErr) {
            if (!forceFail) {
                console.error("HDFC order status fetch error:", gatewayErr);
                await session.save();
                return res.status(200).send({
                    success: true,
                    paid: false,
                    pending: true,
                    awaitingUpi: false,
                    resumePayment: Boolean(sessionPaymentUrl(session)),
                    hdfcStatus: session.hdfcStatus,
                    paymentUrl: sessionPaymentUrl(session),
                    message: "Could not reach payment gateway. Retrying...",
                    receipt: receiptPayload(session),
                });
            }
        }

        const paymentUrl = sessionPaymentUrl(session);
        const { allowUatDummy } = getHdfcConfig();
        // On UAT, any gateway success status is enough to create the order and show success UI.
        const uatCharged =
            allowUatDummy && hdfcOrder && isHdfcPaymentSuccess(hdfcStatus);
        const paidOk =
            dualConsistent &&
            ((hdfcOrder && isHdfcPaymentSuccess(hdfcStatus) && isHdfcOrderPaid(hdfcOrder)) ||
                uatCharged);

        if (paidOk) {
            const paidAmount = Number(hdfcOrder?.amount);
            if (!(paidAmount >= Number(session.amount))) {
                const order = await fulfillFailedSession(
                    session,
                    hdfcOrder,
                    "Paid amount does not match the order total"
                );
                return res.status(200).send({
                    success: false,
                    paid: false,
                    hdfcStatus,
                    order,
                    failureReason: session.failureReason,
                    message: session.failureReason,
                    receipt: receiptPayload(session, order),
                });
            }
            // Extra response binding: gateway order_id must match session.
            const gatewayOrderId = String(hdfcOrder?.order_id || "").trim();
            if (gatewayOrderId && gatewayOrderId !== session.hdfcOrderId) {
                const order = await fulfillFailedSession(
                    session,
                    hdfcOrder,
                    "Gateway order id does not match payment session"
                );
                return res.status(200).send({
                    success: false,
                    paid: false,
                    hdfcStatus,
                    order,
                    failureReason: session.failureReason,
                    message: session.failureReason,
                    receipt: receiptPayload(session, order),
                });
            }
            const order = await fulfillPaidSession(session, hdfcOrder);
            return res.status(200).send({
                success: true,
                paid: true,
                hdfcStatus,
                paymentUrl,
                order,
                receipt: receiptPayload(session, order),
                message: "Payment successful",
            });
        }

        if (forceFail || (hdfcOrder && isHdfcPaymentFailed(hdfcStatus))) {
            const reason = forceFail
                ? String(req.body?.failureReason || "Payment confirmation timed out").slice(0, 500)
                : `Payment failed (${hdfcStatus || "FAILED"})`;
            const order = await fulfillFailedSession(session, hdfcOrder, reason);
            return res.status(200).send({
                success: false,
                paid: false,
                hdfcStatus: session.hdfcStatus,
                paymentUrl,
                order,
                failureReason: session.failureReason,
                message: session.failureReason || "Payment failed",
                receipt: receiptPayload(session, order),
            });
        }

        await session.save();
        const awaitingUpi =
            !allowUatDummy &&
            (hdfcStatus === "PENDING_VBV" ||
                hdfcStatus === "AUTHORIZING" ||
                hdfcStatus === "SUCCESS" ||
                (isHdfcPaymentSuccess(hdfcStatus) && !isHdfcOrderPaid(hdfcOrder)));
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
            receipt: receiptPayload(session),
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

        const uniqueRequestId = String(req.body?.uniqueRequestId || `RF${Date.now()}`).replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
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
        const { isUat, responseKey } = getHdfcConfig();

        // Validate signed return payload when present (response tampering protection).
        if (req.query?.signature && responseKey) {
            const sigCheck = verifyHdfcReturnSignature(req.query, responseKey);
            if (!sigCheck.ok && !sigCheck.skipped) {
                const failTarget = new URL("/shipping/failed", `${LIVE_FRONTEND_ORIGIN}/`);
                failTarget.searchParams.set("reason", "invalid_signature");
                return res.redirect(302, failTarget.toString());
            }
        }

        let frontendOrigin = LIVE_FRONTEND_ORIGIN;
        if (hdfcOrderId) {
            const session = await HdfcPaymentSession.findOne({ hdfcOrderId });
            if (session?.frontendOrigin) {
                const origin = stripQuery(session.frontendOrigin);
                // Non-local: must be on FRONTEND_URL allowlist. Local: UAT only.
                const allowed = Boolean(
                    origin &&
                        (isLocalOrigin(origin)
                            ? isUat
                            : isAllowedFrontendOrigin(origin))
                );
                if (allowed) frontendOrigin = origin;
            }
        }
        const target = new URL(
            isLocalOrigin(frontendOrigin) ? "/payment-return.html" : "/shipping/payment-return",
            `${String(frontendOrigin).replace(/\/$/, "")}/`
        );
        // Forward gateway return params needed for signature re-check on verify.
        for (const key of ["order_id", "orderId", "status", "status_id", "signature", "signature_algorithm"]) {
            const value = req.query?.[key];
            if (value != null && String(value).trim() !== "") {
                target.searchParams.set(key, String(value));
            }
        }
        if (hdfcOrderId && !target.searchParams.get("order_id")) {
            target.searchParams.set("order_id", hdfcOrderId);
        }
        return res.redirect(302, target.toString());
    } catch (err) {
        console.error("HDFC return redirect error:", err);
        return res.redirect(302, `${LIVE_FRONTEND_ORIGIN}/shipping/payment-return`);
    }
};
