import { useEffect, useState } from "react";
import OrderItem from "./OrderItem";
import SearchIcon from "@mui/icons-material/Search";
import Spinner from "../../components/Spinner";
import axios from "axios";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";

const AdminOrders = () => {
    const {auth} = useAuth();
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        // fetch orders from server
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `${
                        import.meta.env.VITE_SERVER_URL
                    }/api/v1/user/admin-orders`,
                    {
                        headers: {
                            Authorization: auth?.token,
                        },
                    }
                );
                console.log(response.data.orders);
                if (response?.data?.orders) {
                    setOrders(response.data.orders);
                    setLoading(false);
                }
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        };
        fetchOrders();
    }, [auth?.token]);

    return (
        <>
            <SeoData title="Admin Orders | Flipkart" />

            <main className="w-full px-4 sm:px-10 py-4 ">
                {/* <!-- row --> */}
                {/* <!-- orders column --> */}
                <div className="flex gap-3.5 w-full ">
                    {loading ? (
                        <Spinner />
                    ) : (
                        <div className="flex flex-col gap-3 w-full pb-5 overflow-hidden">
                            {/* <!-- searchbar --> */}
                            <form
                                className="flex items-center justify-between mx-auto w-full sm:w-10/12 bg-white border border-[#019ee3] rounded-2xl mb-4 shadow hover:shadow-lg transition"
                            >
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    type="search"
                                    name="search"
                                    placeholder="Search your orders here"
                                    className="p-3 text-sm outline-none flex-1 rounded-l-2xl bg-[#f7fafd]"
                                />
                                <button
                                    type="submit"
                                    className="h-full text-sm px-4 py-3 text-white bg-gradient-to-r from-[#019ee3] to-[#afcb09] hover:from-[#afcb09] hover:to-[#019ee3] rounded-r-2xl flex items-center gap-2 font-semibold transition"
                                >
                                    <SearchIcon sx={{ fontSize: "20px" }} />
                                    <span className="text-xs sm:text-sm">Search</span>
                                </button>
                            </form>
                            {/* <!-- search bar --> */}

                            {orders?.length === 0 && (
                                <div className="flex flex-col items-center gap-3 p-10 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] rounded-2xl shadow">
                                    <img
                                        draggable="false"
                                        src="https://rukminim1.flixcart.com/www/100/100/promos/23/08/2020/c5f14d2a-2431-4a36-b6cb-8b5b5e283d4f.png"
                                        alt="Empty Orders"
                                        className="mb-2"
                                    />
                                    <span className="text-lg font-semibold text-[#019ee3]">
                                        Sorry, no orders found
                                    </span>
                                    <p className="text-gray-500">Get some orders first</p>
                                </div>
                            )}

                            {orders
                                ?.map((order) => {
                                    const {
                                        _id,
                                        orderStatus,
                                        buyer,
                                        createdAt,
                                        paymentId,
                                        shippingInfo,
                                        amount,
                                        products,
                                    } = order;
                                    return products.map((item, index) => (
                                        <OrderItem
                                            item={item}
                                            key={index}
                                            orderId={_id}
                                            orderStatus={orderStatus}
                                            createdAt={createdAt}
                                            paymentId={paymentId}
                                            buyer={buyer}
                                            shippingInfo={shippingInfo}
                                            amount={amount}
                                        />
                                    ));
                                })
                                .reverse()}
                        </div>
                    )}
                </div>
                {/* <!-- orders column --> */}
                {/* <!-- row --> */}
            </main>
        </>
    );
};

export default AdminOrders;
