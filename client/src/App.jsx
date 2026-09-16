import "./App.css";
import Layout from "./layouts/Layout";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function App() {
    const { pathname, search } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    }, [pathname]);

    // Static /payment-return.html lands on /?hdfc_return=1&order_id=...
    useEffect(() => {
        const params = new URLSearchParams(search);
        if (params.get("hdfc_return") !== "1") return;
        const forwardKeys = [
            "order_id",
            "orderId",
            "status",
            "status_id",
            "signature",
            "signature_algorithm",
        ];
        const next = new URLSearchParams();
        forwardKeys.forEach((key) => {
            const value = params.get(key);
            if (value) next.set(key, value);
        });
        const orderId = (params.get("order_id") || params.get("orderId") || "").trim();
        if (orderId && !next.get("order_id")) next.set("order_id", orderId);
        const qs = next.toString();
        navigate(qs ? `/shipping/payment-return?${qs}` : "/shipping/payment-return", {
            replace: true,
        });
    }, [search, navigate]);

    return (
        <>
            <Layout />
        </>
    );
}

export default App;
