import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useCart } from "../../../context/cart";
import { useAuth } from "../../../context/auth";
import axios from "axios";
import Spinner from "./../../../components/Spinner";
import SeoData from "../../../SEO/SeoData";

const readStoredReceipt = () => {
    try {
        return JSON.parse(localStorage.getItem("paymentReceipt") || "null");
    } catch {
        return null;
    }
};

const OrderSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [time, setTime] = useState(3);
    const [cartItems, setCartItems, , , , , , , clearCart] = useCart();
    const { auth } = useAuth();
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasSavedPayment, setHasSavedPayment] = useState(false);
    const [receipt, setReceipt] = useState(() => {
        const stored = readStoredReceipt() || {};
        return {
            orderId: (searchParams.get("orderId") || searchParams.get("order_id") || stored.orderId || "").trim(),
            hdfcOrderId: (searchParams.get("hdfcOrderId") || stored.hdfcOrderId || "").trim(),
            orderReferenceNo: (searchParams.get("ref") || stored.orderReferenceNo || "").trim(),
            amount: Number(searchParams.get("amount") || stored.amount || 0),
            receiptNumber: (searchParams.get("receipt") || stored.receiptNumber || "").trim(),
            message: stored.message || "Payment successful",
        };
    });

    useEffect(() => {
        const storedSessionId = localStorage.getItem("sessionId");
        setSessionId(storedSessionId);
        const orderFromUrl = (
            searchParams.get("orderId") ||
            searchParams.get("order_id") ||
            ""
        ).trim();
        if (orderFromUrl) {
            localStorage.setItem("skipOrderId", orderFromUrl);
        }
        const stored = readStoredReceipt() || {};
        setReceipt((prev) => ({
            ...prev,
            orderId: orderFromUrl || prev.orderId || stored.orderId || "",
            hdfcOrderId: (searchParams.get("hdfcOrderId") || stored.hdfcOrderId || prev.hdfcOrderId || "").trim(),
            orderReferenceNo: (searchParams.get("ref") || stored.orderReferenceNo || prev.orderReferenceNo || "").trim(),
            amount: Number(searchParams.get("amount") || stored.amount || prev.amount || 0),
            receiptNumber: (searchParams.get("receipt") || stored.receiptNumber || prev.receiptNumber || "").trim(),
            message: stored.message || prev.message || "Payment successful",
        }));
    }, [searchParams]);

    useEffect(() => {
        const savePayment = async () => {
            try {
                setLoading(true);
                const payment = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/user/payment-success`,
                    {
                        sessionId: sessionId,
                        orderItems: cartItems,
                        shippingInfo: (() => {
                            try {
                                return JSON.parse(localStorage.getItem("shippingInfo") || "null");
                            } catch {
                                return null;
                            }
                        })(),
                        orderReferenceNo: (localStorage.getItem("orderReferenceNo") || "").trim(),
                    },
                    {
                        headers: {
                            Authorization: auth?.token,
                        },
                    }
                );

                if (payment.status === 200) {
                    if (auth?.user?.isCommissionEnabled) {
                        afterPaymentSuccess(payment?.data?.order, cartItems);
                    }
                    if (typeof clearCart === "function") clearCart();
                    else {
                        setCartItems([]);
                        localStorage.removeItem("cart");
                    }
                    localStorage.removeItem("sessionId");
                    localStorage.removeItem("shippingInfo");
                    localStorage.removeItem("orderReferenceNo");
                    setLoading(false);
                    setHasSavedPayment(true);
                }
            } catch (error) {
                console.log(error);
            }
        };

        const skipOrderId = (
            localStorage.getItem("skipOrderId") ||
            searchParams.get("orderId") ||
            searchParams.get("order_id") ||
            ""
        ).trim();

        if (!skipOrderId && !sessionId) {
            if (!hasSavedPayment) {
                setLoading(false);
                setHasSavedPayment(true);
                navigate("/shipping/failed", { replace: true });
            }
            return;
        }
        if ((skipOrderId || sessionId) && !hasSavedPayment) {
            if (sessionId && !skipOrderId && cartItems.length > 0) {
                savePayment();
                return;
            }
            if (typeof clearCart === "function") clearCart();
            else {
                setCartItems([]);
                localStorage.removeItem("cart");
            }
            localStorage.removeItem("shippingInfo");
            localStorage.removeItem("orderReferenceNo");
            localStorage.removeItem("skipOrderId");
            localStorage.removeItem("sessionId");
            localStorage.removeItem("hdfcOrderId");
            localStorage.removeItem("hdfcPaymentUrl");
            localStorage.removeItem("paymentMethod");
            // Keep paymentReceipt for success UI; cleared on leave via timer/navigate.
            setLoading(false);
            setHasSavedPayment(true);
            return;
        }
    }, [sessionId, auth?.token, cartItems, hasSavedPayment, setCartItems, clearCart, navigate, searchParams]);

    const commissionCalculation = (cartItems, amount) => {
        const totalCommission = cartItems.reduce((sum, item) => {
            const quantity = item.quantity || 0;

            // Find the matching price range, which contains the commission value
            const priceRange = item.priceRange?.find(
                (range) => quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
            );

            // Extract commission percentage from the found range, or default to 0
            const commissionPercent = priceRange ? parseFloat(priceRange.commission) : 0;

            // Calculate the commission for the current item
            // Note: This uses the 'amount' parameter from your original function.
            const commissionAmount = (amount * commissionPercent) / 100;

            return sum + commissionAmount;
        }, 0);
        return Number(totalCommission);
    };

    const afterPaymentSuccess = async (data, cartItems) => {
        try {
            setLoading(true);
            const apiParams = {
                userId: auth?.user?.parentId || auth?.user?._id,
                orderId: data?._id,
                commissionAmount: commissionCalculation(cartItems, data?.amount),
                percentageRate: data?.percentageRate,
                commissionFrom: "Sales"
            }
            const payment = await axios.post(
                `${import.meta.env.VITE_SERVER_URL
                }/api/v1/commissions`,
                apiParams,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );

            if (payment.status === 201) {
                setCartItems([]); // Clear cart items
                setLoading(false);
                setHasSavedPayment(true); // Mark the payment as saved to prevent further API calls
            }

        } catch (error) {
            console.log(error);
        }
    }

    // Timer to redirect after 3 sec
    let intervalId = useRef(null);
    useEffect(() => {
        intervalId.current = setInterval(() => {
            if (!loading)
                setTime((prev) => {
                    let temp = prev - 1;
                    if (temp === 0) {
                        clearInterval(intervalId.current);
                        navigate("/user/orders");
                    }
                    return temp;
                });
        }, 1000);
        return () => clearInterval(intervalId.current);
    }, [loading, navigate]);

    return (
        <>
            <SeoData title={`Transaction Successful`} />
            <main className="w-full p-8 relative min-h-[60vh] bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
                {loading ? (
                    <Spinner />
                ) : (
                    <div className="flex flex-col gap-4 items-center justify-center sm:w-4/6 m-auto bg-white shadow-lg rounded-2xl p-10 min-h-[60vh]">
                        <div className="flex gap-4 items-center">
                            <CheckCircleOutlineIcon className="text-primaryBlue" sx={{ fontSize: 48 }} />
                            <h1 className="text-3xl font-bold text-gray-800">
                                Transaction Successful
                            </h1>
                        </div>
                        <p className="text-base text-green-700 font-semibold">
                            {receipt.message || "Payment successful"}
                        </p>
                        <div className="mt-2 w-full max-w-md rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-700 space-y-2">
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Order number</span>
                                <span className="font-semibold text-right break-all">
                                    {receipt.orderReferenceNo || receipt.hdfcOrderId || receipt.orderId || "—"}
                                </span>
                            </div>
                            {receipt.hdfcOrderId ? (
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">Payment order ID</span>
                                    <span className="font-semibold text-right break-all">{receipt.hdfcOrderId}</span>
                                </div>
                            ) : null}
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500">Amount</span>
                                <span className="font-semibold">
                                    ₹{Number(receipt.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            {receipt.receiptNumber ? (
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">Receipt</span>
                                    <span className="font-semibold text-right break-all">{receipt.receiptNumber}</span>
                                </div>
                            ) : null}
                        </div>
                        <p className="mt-4 text-lg text-gray-700 font-medium">
                            Redirecting to orders in {time} sec
                        </p>
                        <Link
                            to="/user/orders"
                            className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] mt-4 py-3 px-8 text-lg font-semibold text-white uppercase shadow rounded-xl hover:from-[#017bbd] hover:to-[#8fae07] transition"
                        >
                            Go to Orders
                        </Link>
                    </div>
                )}
            </main>
        </>
    );
};

export default OrderSuccess;
