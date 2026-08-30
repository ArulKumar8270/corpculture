import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/auth";
import Spinner from "../../../components/Spinner";
import SeoData from "../../../SEO/SeoData";

const PaymentReturn = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { auth } = useAuth();
    const [message, setMessage] = useState("Confirming your payment...");
    const [paymentUrl, setPaymentUrl] = useState(localStorage.getItem("hdfcPaymentUrl") || "");

    useEffect(() => {
        let cancelled = false;
        let timer;
        let attempts = 0;

        const hdfcOrderId = (
            searchParams.get("order_id") ||
            searchParams.get("orderId") ||
            localStorage.getItem("hdfcOrderId") ||
            ""
        ).trim();

        const verify = async () => {
            if (!hdfcOrderId) {
                toast.error("Payment reference missing");
                navigate("/shipping/failed");
                return;
            }
            if (!auth?.token) {
                setMessage("Please login to complete payment confirmation.");
                return;
            }

            try {
                const { data } = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/user/hdfc/verify`,
                    { hdfcOrderId },
                    { headers: { Authorization: auth.token } }
                );
                if (cancelled) return;
                if (data?.paymentUrl) {
                    localStorage.setItem("hdfcPaymentUrl", data.paymentUrl);
                    setPaymentUrl(data.paymentUrl);
                }
                if (data?.paid && data?.order?._id) {
                    localStorage.setItem("skipOrderId", String(data.order._id));
                    localStorage.removeItem("hdfcOrderId");
                    localStorage.removeItem("hdfcPaymentUrl");
                    localStorage.setItem("cart", JSON.stringify([]));
                    navigate("/shipping/confirm", { replace: true });
                    return;
                }
                if (data?.pending) {
                    attempts += 1;
                    setMessage(
                        data?.awaitingUpi
                            ? "Waiting for UPI approval. Open PhonePe/GPay and approve the request. Stay on this page until payment completes."
                            : "Payment is still processing. Please wait..."
                    );
                    timer = setTimeout(verify, attempts < 20 ? 3000 : 5000);
                    return;
                }
                navigate("/shipping/failed", { replace: true });
            } catch (error) {
                if (cancelled) return;
                toast.error(error.response?.data?.message || "Could not confirm payment");
                navigate("/shipping/failed", { replace: true });
            }
        };

        verify();
        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, [auth?.token, navigate, searchParams]);

    return (
        <>
            <SeoData title="Confirming Payment" />
            <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] p-8">
                <Spinner />
                <p className="text-gray-700 font-medium mt-24 text-center max-w-md">{message}</p>
                {paymentUrl && (
                    <button
                        type="button"
                        onClick={() => window.location.assign(paymentUrl)}
                        className="mt-4 bg-[#019ee3] text-white font-semibold px-6 py-3 rounded-xl"
                    >
                        Return to payment page
                    </button>
                )}
            </main>
        </>
    );
};

export default PaymentReturn;
