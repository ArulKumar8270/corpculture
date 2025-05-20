import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrderItem from "./OrderItem";
import SearchIcon from "@mui/icons-material/Search";
import MinCategory from "../../../components/MinCategory";
import Spinner from "../../../components/Spinner";
import axios from "axios";
import { useAuth } from "../../../context/auth";
import SeoData from "../../../SEO/SeoData";

const Orders = () => {
    const { auth } = useAuth();
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        // fetch orders from server
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/user/orders`,
                    {
                        headers: {
                            Authorization: auth?.token,
                        },
                    }
                );
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
            <SeoData title="My Orders | Flipkart" />

            <MinCategory />
            <main className="w-full px-4 sm:px-10 py-4 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
                {/* <!-- row --> */}
                {/* <!-- orders column --> */}
                <div className="flex gap-3.5 w-full ">
                    {loading ? (
                        <Spinner />
                    ) : (
                        <div className="flex flex-col gap-4 w-full pb-5 overflow-hidden">
                            {/* <!-- searchbar --> */}
                            <form
                                // onSubmit={searchOrders}
                                className="flex items-center justify-between mx-auto w-[100%] sm:w-10/12 bg-white rounded-2xl shadow-lg mb-3"
                            >
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    type="search"
                                    name="search"
                                    placeholder="Search your orders here"
                                    className="p-3 text-base outline-none flex-1 rounded-l-2xl"
                                />
                                <button
                                    type="submit"
                                    className="h-full text-base px-2 sm:px-6 py-3 text-white bg-primaryBlue hover:bg-blue-600 rounded-r-2xl flex items-center gap-2 font-semibold transition"
                                >
                                    <SearchIcon sx={{ fontSize: "22px" }} />
                                    <p className="text-[12px] sm:text-[16px]">
                                        Search
                                    </p>
                                </button>
                            </form>
                            {/* <!-- search bar --> */}

                            {orders?.length === 0 && (
                                <div className="flex items-center flex-col gap-3 p-12 bg-white rounded-2xl shadow-lg">
                                    <img
                                        draggable="false"
                                        src="https://rukminim1.flixcart.com/www/100/100/promos/23/08/2020/c5f14d2a-2431-4a36-b6cb-8b5b5e283d4f.png"
                                        alt="Empty Orders"
                                    />
                                    <span className="text-xl font-bold text-gray-800">
                                        Sorry, no orders found
                                    </span>
                                    <p className="text-base text-gray-500">Place a new order from here</p>
                                    <Link
                                        to="/products"
                                        className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] py-3 px-8 mt-2 text-white uppercase shadow rounded-xl text-base font-bold hover:from-[#017bbd] hover:to-[#8fae07] transition"
                                    >
                                        Products
                                    </Link>
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

export default Orders;
