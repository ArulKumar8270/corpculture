import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/auth";
import Spinner from "../../../components/Spinner";
import SeoData from "../../../SEO/SeoData";

const MAX_POLL_ATTEMPTS = 60;

const RETURN_PARAM_KEYS = [
    "order_id",
    "orderId",
    "status",
    "status_id",
    "signature",
    "signature_algorithm",
];

const PaymentReturn = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { auth } = useAuth();
    const [message, setMessage] = useState("Confirming your payment...");
    const [paymentUrl, setPaymentUrl] = useState(localStorage.getItem("hdfcPaymentUrl") || "");
    const [checking, setChecking] = useState(false);
    const attemptsRef = useRef(0);
    const cancelledRef = useRef(false);
    const timerRef = useRef(null);

    const hdfcOrderId = (
        searchParams.get("order_id") ||
        searchParams.get("orderId") ||
        localStorage.getItem("hdfcOrderId") ||
        ""
    ).trim();

    const returnParams = useMemo(
        () =>
            RETURN_PARAM_KEYS.reduce((acc, key) => {
                const value = searchParams.get(key);
                if (value != null && String(value).trim() !== "") acc[key] = value;
                return acc;
            }, {}),
        [searchParams]
    );

    const returnPath = hdfcOrderId
        ? `/payment-return.html?order_id=${encodeURIComponent(hdfcOrderId)}`
        : "/payment-return.html";

    const storeReceipt = (receipt, order) => {
        const payload = {
            receiptNumber: receipt?.receiptNumber || "",
            hdfcOrderId: receipt?.hdfcOrderId || hdfcOrderId,
            orderReferenceNo:
                receipt?.orderReferenceNo || order?.orderReferenceNo || "",
            amount: Number(receipt?.amount ?? order?.amount ?? 0),
            orderId: receipt?.orderId || order?._id || "",
            message: receipt?.message || "Payment successful",
        };
        localStorage.setItem("paymentReceipt", JSON.stringify(payload));
        return payload;
    };

    const goSuccess = useCallback(
        (orderId, receipt, order) => {
            const id = String(orderId);
            const saved = storeReceipt(receipt, order || { _id: id });
            localStorage.setItem("skipOrderId", id);
            localStorage.removeItem("hdfcOrderId");
            localStorage.removeItem("hdfcPaymentUrl");
            localStorage.removeItem("paymentFailureReason");
            localStorage.setItem("cart", JSON.stringify([]));
            const qs = new URLSearchParams({
                orderId: id,
                amount: String(saved.amount || ""),
                ref: saved.orderReferenceNo || "",
                receipt: saved.receiptNumber || "",
                hdfcOrderId: saved.hdfcOrderId || "",
            });
            navigate(`/shipping/confirm?${qs.toString()}`, { replace: true });
        },
        [navigate, hdfcOrderId]
    );

    const goFailed = useCallback(
        (reason, receipt) => {
            if (reason) localStorage.setItem("paymentFailureReason", reason);
            if (receipt) storeReceipt(receipt, null);
            localStorage.removeItem("hdfcPaymentUrl");
            navigate("/shipping/failed", { replace: true });
        },
        [navigate]
    );

    const verifyOnce = useCallback(
        async ({ forceFail = false } = {}) => {
            if (!hdfcOrderId) {
                toast.error("Payment reference missing");
                goFailed("Payment reference missing");
                return { done: true };
            }
            if (!auth?.token) {
                setMessage("Please login to complete payment confirmation.");
                return { done: false, needAuth: true };
            }

            const { data } = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/user/hdfc/verify`,
                forceFail
                    ? {
                          hdfcOrderId,
                          forceFail: true,
                          failureReason: "Payment confirmation timed out",
                          returnParams,
                      }
                    : { hdfcOrderId, returnParams },
                { headers: { Authorization: auth.token } }
            );

            if (data?.paymentUrl) {
                localStorage.setItem("hdfcPaymentUrl", data.paymentUrl);
                setPaymentUrl(data.paymentUrl);
            }

            if (data?.receipt) storeReceipt(data.receipt, data?.order);

            const orderId = data?.order?._id;
            const orderPaid =
                data?.paid === true ||
                String(data?.order?.paymentStatus || "").toLowerCase() === "paid";

            if (orderPaid && orderId) {
                goSuccess(orderId, data.receipt, data.order);
                return { done: true };
            }

            if (data?.pending) {
                setMessage(
                    data?.awaitingUpi
                        ? "Waiting for UPI approval. Open PhonePe/GPay and approve the request. Stay on this page until payment completes."
                        : data?.message || "Payment is still processing. Please wait..."
                );
                return { done: false, pending: true, data };
            }

            goFailed(data?.failureReason || data?.message || "Payment failed", data?.receipt);
            return { done: true };
        },
        [auth?.token, goFailed, goSuccess, hdfcOrderId, returnParams]
    );

    const scheduleNext = useCallback(
        (delayMs) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(async () => {
                if (cancelledRef.current) return;
                try {
                    const result = await verifyOnce();
                    if (cancelledRef.current || result?.done || result?.needAuth) return;
                    attemptsRef.current += 1;
                    if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
                        const lastTry = await verifyOnce();
                        if (lastTry?.done || lastTry?.needAuth) return;
                        await verifyOnce({ forceFail: true });
                        return;
                    }
                    scheduleNext(attemptsRef.current < 20 ? 2500 : 4000);
                } catch (error) {
                    if (cancelledRef.current) return;
                    toast.error(error.response?.data?.message || "Could not confirm payment");
                    goFailed(error.response?.data?.message || "Could not confirm payment");
                }
            }, delayMs);
        },
        [goFailed, verifyOnce]
    );

    useEffect(() => {
        if (hdfcOrderId) localStorage.setItem("hdfcOrderId", hdfcOrderId);
    }, [hdfcOrderId]);

    useEffect(() => {
        cancelledRef.current = false;
        attemptsRef.current = 0;
        if (!auth?.token) {
            setMessage("Please login to complete payment confirmation.");
            return undefined;
        }
        scheduleNext(0);
        return () => {
            cancelledRef.current = true;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [auth?.token, scheduleNext]);

    const handleCheckNow = async () => {
        if (!auth?.token) {
            navigate("/login", { state: returnPath });
            return;
        }
        setChecking(true);
        try {
            const result = await verifyOnce();
            if (!result?.done && result?.pending) {
                toast.info("Payment not confirmed yet. Keep this tab open.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not confirm payment");
        } finally {
            setChecking(false);
        }
    };

    return (
        <>
            <SeoData title="Confirming Payment" />
            <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] p-8">
                <Spinner />
                <p className="text-gray-700 font-medium mt-24 text-center max-w-md">{message}</p>
                {hdfcOrderId ? (
                    <p className="text-sm text-gray-500">Order: {hdfcOrderId}</p>
                ) : null}
                {!auth?.token ? (
                    <Link
                        to="/login"
                        state={returnPath}
                        className="mt-2 bg-[#019ee3] text-white font-semibold px-6 py-3 rounded-xl"
                    >
                        Login to continue
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={handleCheckNow}
                        disabled={checking}
                        className="mt-2 bg-[#019ee3] text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
                    >
                        {checking ? "Checking..." : "I've paid — go to success"}
                    </button>
                )}
                {paymentUrl && auth?.token && (
                    <button
                        type="button"
                        onClick={() => window.open(paymentUrl, "_blank", "noopener,noreferrer")}
                        className="mt-1 border border-[#019ee3] text-[#019ee3] font-semibold px-6 py-3 rounded-xl bg-white"
                    >
                        Open payment page
                    </button>
                )}
            </main>
        </>
    );
};

export default PaymentReturn;
