const SUCCESS_STATUSES = new Set(["CHARGED", "PARTIAL_CHARGED"]);
const FAILED_STATUSES = new Set([
    "AUTHENTICATION_FAILED",
    "AUTHORIZATION_FAILED",
    "JUSPAY_DECLINED",
    "FAILED",
]);
const PENDING_STATUSES = new Set([
    "NEW",
    "CREATED",
    "PENDING",
    "PENDING_VBV",
    "AUTHORIZING",
    "STARTED",
    "TO_BE_CHARGED",
]);

export const getHdfcConfig = () => {
    const apiKey = String(process.env.HDFC_API_KEY || "").trim();
    const baseUrl = String(process.env.HDFC_SMARTGATEWAY_BASE_URL || "https://smartgateway.hdfcuat.bank.in").replace(/\/$/, "");
    const isUat = baseUrl.includes("hdfcuat");
    const merchantId = String(process.env.HDFC_MERCHANT_ID || "").trim() || (isUat ? "hdfcmaster" : "");
    const paymentPageClientId = String(
        process.env.HDFC_PAYMENT_PAGE_CLIENT_ID || (isUat ? "hdfcmaster" : merchantId)
    ).trim();
    const returnUrl = String(process.env.HDFC_RETURN_URL || "https://corpculture.in/shipping/payment-return").trim();
    const resellerId = String(process.env.HDFC_RESELLER_ID || "").trim();

    return {
        apiKey,
        merchantId,
        paymentPageClientId,
        baseUrl,
        returnUrl,
        resellerId,
        responseKey: String(process.env.HDFC_RESPONSE_KEY || "").trim(),
        cardEncodingKey: String(process.env.HDFC_CARD_ENCODING_KEY || "").trim(),
    };
};

const basicAuthHeader = (apiKey) =>
    `Basic ${Buffer.from(`${apiKey}:`, "utf8").toString("base64")}`;

const hdfcHeaders = (config, customerId, extra = {}) => {
    const headers = {
        Authorization: basicAuthHeader(config.apiKey),
        "x-merchantid": config.merchantId,
        "x-customerid": customerId,
        ...extra,
    };
    if (config.resellerId) headers["x-resellerid"] = config.resellerId;
    return headers;
};

export const assertHdfcConfigured = () => {
    const config = getHdfcConfig();
    if (!config.apiKey) {
        throw new Error("HDFC_API_KEY is not configured");
    }
    if (!config.merchantId) {
        throw new Error("HDFC_MERCHANT_ID is not configured");
    }
    if (!config.paymentPageClientId) {
        throw new Error("HDFC_PAYMENT_PAGE_CLIENT_ID is not configured");
    }
    return config;
};

export const makeHdfcOrderId = () => {
    const raw = `CC${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
    return raw.slice(0, 21);
};

export const makeHdfcCustomerId = (userId) => {
    const compact = String(userId || "guest").replace(/[^a-zA-Z0-9]/g, "");
    return `C${compact.slice(-19)}`.slice(0, 20);
};

const parseHdfcResponse = async (response) => {
    const text = await response.text();
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = { raw: text };
    }
    if (!response.ok) {
        const message =
            json?.error_message ||
            json?.message ||
            json?.errorMessage ||
            json?.raw ||
            `HDFC request failed (${response.status})`;
        const error = new Error(message);
        error.status = response.status;
        error.payload = json;
        throw error;
    }
    return json;
};

export const createHdfcSession = async ({ orderId, amount, customerId, customerEmail, customerPhone, firstName, lastName, returnUrl, description }) => {
    const config = assertHdfcConfigured();
    const payload = {
        order_id: orderId,
        amount: Number(amount).toFixed(2),
        customer_id: customerId,
        customer_email: customerEmail,
        customer_phone: String(customerPhone || "").replace(/\D/g, "").slice(-10),
        payment_page_client_id: config.paymentPageClientId,
        action: "paymentPage",
        currency: "INR",
        return_url: returnUrl,
        description: description || "Complete your payment",
        first_name: firstName || "Customer",
        last_name: lastName || ".",
    };

    const response = await fetch(`${config.baseUrl}/session`, {
        method: "POST",
        headers: hdfcHeaders(config, customerId, { "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
    });
    return parseHdfcResponse(response);
};

export const getHdfcOrder = async (orderId, customerId) => {
    const config = assertHdfcConfigured();
    const response = await fetch(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
        method: "GET",
        headers: hdfcHeaders(config, customerId, {
            version: "2023-06-30",
            "Content-Type": "application/x-www-form-urlencoded",
        }),
    });
    return parseHdfcResponse(response);
};

export const refundHdfcOrder = async ({ orderId, customerId, amount, uniqueRequestId }) => {
    const config = assertHdfcConfigured();
    const body = new URLSearchParams({
        unique_request_id: uniqueRequestId,
        amount: Number(amount).toFixed(2),
    });
    const response = await fetch(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}/refunds`, {
        method: "POST",
        headers: hdfcHeaders(config, customerId, {
            "Content-Type": "application/x-www-form-urlencoded",
        }),
        body,
    });
    return parseHdfcResponse(response);
};

export const isHdfcPaymentSuccess = (status) =>
    SUCCESS_STATUSES.has(String(status || "").toUpperCase());

export const isHdfcPaymentFailed = (status) =>
    FAILED_STATUSES.has(String(status || "").toUpperCase());

export const isHdfcPaymentPending = (status) => {
    const value = String(status || "").toUpperCase();
    return !value || PENDING_STATUSES.has(value) || (!SUCCESS_STATUSES.has(value) && !FAILED_STATUSES.has(value));
};

const isBlankRef = (value) => {
    const ref = String(value || "").trim().toUpperCase();
    return !ref || ref === "NA" || ref === "N/A" || ref === "NULL" || ref === "0" || ref === "UNDEFINED";
};

const isDummyHdfcOrder = (order) => {
    if (order?.dummy === true || order?.is_dummy === true || order?.dummy_order === true) return true;
    const flags = [order?.order_type, order?.source, order?.product_id, order?.txn_detail?.gateway];
    return flags.some((value) => String(value || "").toUpperCase().includes("DUMMY"));
};

const hasValidBankRef = (order) => {
    const rrn = order?.payment_gateway_response?.rrn || order?.txn_detail?.rrn;
    const epg = order?.payment_gateway_response?.epg_txn_id;
    const authId = order?.payment_gateway_response?.auth_id_code;
    return !isBlankRef(rrn) || !isBlankRef(epg) || !isBlankRef(authId);
};

/** Only fulfill after a real capture. Dummy/UPI-collect-in-progress must not create an order. */
export const isHdfcOrderPaid = (order) => {
    const status = String(order?.status || "").toUpperCase();
    if (!SUCCESS_STATUSES.has(status)) return false;
    const txnStatus = String(order?.txn_detail?.status || "").toUpperCase();
    if (txnStatus && !SUCCESS_STATUSES.has(txnStatus)) return false;
    if (isDummyHdfcOrder(order)) return false;

    const method = String(order?.payment_method_type || order?.payment_method || "").toUpperCase();
    const isUpi =
        method.includes("UPI") ||
        String(order?.txn_flow_type || "").toUpperCase().includes("COLLECT") ||
        String(order?.txn_flow_type || "").toUpperCase().includes("INTENT");

    if (isUpi || !method) {
        return hasValidBankRef(order);
    }
    return true;
};

export const sessionPaymentUrl = (session) =>
    session?.paymentLinks?.web ||
    session?.paymentLinks?.mobile ||
    session?.payment_links?.web ||
    session?.payment_links?.mobile ||
    session?.paymentUrl ||
    "";
