import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import axios from "axios";
import SeoData from "../../../SEO/SeoData";
import { useAuth } from "../../../context/auth";

const OrderFailed = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [time, setTime] = useState(5);
    const [reason, setReason] = useState(
        () => localStorage.getItem("paymentFailureReason") || "Your payment could not be completed."
    );
    const [receipt, setReceipt] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("paymentReceipt") || "null");
        } catch {
            return null;
        }
    });
    const persistedRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        const persistFailure = async () => {
            if (persistedRef.current) return;
            persistedRef.current = true;
            const hdfcOrderId = (localStorage.getItem("hdfcOrderId") || "").trim();
            if (!hdfcOrderId || !auth?.token) {
                localStorage.removeItem("paymentFailureReason");
                return;
            }
            try {
                const { data } = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/user/hdfc/verify`,
                    {
                        hdfcOrderId,
                        forceFail: true,
                        failureReason: localStorage.getItem("paymentFailureReason") || "Payment failed",
                    },
                    { headers: { Authorization: auth.token } }
                );
                if (!cancelled && data?.failureReason) setReason(data.failureReason);
                if (!cancelled && data?.receipt) {
                    setReceipt(data.receipt);
                    localStorage.setItem("paymentReceipt", JSON.stringify(data.receipt));
                }
            } catch {
                /* UI still shows failure */
            } finally {
                localStorage.removeItem("hdfcOrderId");
                localStorage.removeItem("hdfcPaymentUrl");
                localStorage.removeItem("paymentFailureReason");
            }
        };
        persistFailure();
        return () => {
            cancelled = true;
        };
    }, [auth?.token]);

    useEffect(() => {
        if (time === 0) {
            navigate("/cart");
            return;
        }
        const intervalId = setInterval(() => {
            setTime((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [time, navigate]);

    return (
        <>
            <SeoData title={`Transaction Failed`} />

            <main className="w-full p-8 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
                <div className="flex flex-col gap-4 items-center justify-center sm:w-4/6 m-auto bg-white shadow-lg rounded-2xl p-10 min-h-[60vh]">
                    <div className="flex gap-4 items-center">
                        <ErrorOutlineIcon className="text-red-600" sx={{ fontSize: 48 }} />
                        <h1 className="text-3xl font-bold text-gray-800">
                            Transaction Failed
                        </h1>
                    </div>
                    <p className="mt-2 text-base text-gray-600 text-center max-w-md">{reason}</p>
                    {(receipt?.hdfcOrderId || receipt?.orderReferenceNo || receipt?.amount) ? (
                        <div className="mt-2 w-full max-w-md rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-700 space-y-2">
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Order number</span>
                                <span className="font-semibold text-right break-all">
                                    {receipt.orderReferenceNo || receipt.hdfcOrderId || "—"}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Amount</span>
                                <span className="font-semibold">
                                    ₹{Number(receipt.amount || 0).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                    ) : null}
                    <p className="mt-4 text-lg text-gray-700 font-medium">
                        Redirecting to cart in {time} sec
                    </p>
                    <Link
                        to="/cart"
                        className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] mt-4 py-3 px-8 text-lg font-semibold text-white uppercase shadow rounded-xl hover:from-[#017bbd] hover:to-[#8fae07] transition"
                    >
                        Go to Cart
                    </Link>
                </div>
            </main>
        </>
    );
};

export default OrderFailed;
