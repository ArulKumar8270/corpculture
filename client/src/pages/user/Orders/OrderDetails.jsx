/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Tracker from "./Tracker";
import MinCategory from "../../../components/MinCategory";
import axios from "axios";
import { useAuth } from "../../../context/auth";
import Spinner from "../../../components/Spinner";
import SeoData from "../../../SEO/SeoData";

const OrderDetails = () => {
    const params = useParams();
    const orderId = params.id;

    const [loading, setLoading] = useState(false);
    const [orderDetails, setOrderDetails] = useState([]);
    const { auth } = useAuth();
    useEffect(() => {
        // fetch order detail from server
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL
                    }/api/v1/user/order-detail?orderId=${orderId}`,
                    {
                        headers: {
                            Authorization: auth?.token,
                        },
                    }
                );
                console.log(...response.data.orderDetails);
                if (response?.data?.orderDetails) {
                    setOrderDetails(...response.data.orderDetails);
                    setLoading(false);
                }
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        };
        fetchOrders();
    }, [auth?.token, orderId]);

    const amount = orderDetails?.amount;
    const orderItems = orderDetails?.products;
    const buyer = orderDetails?.buyer;
    const paymentId = orderDetails?.paymentId;
    const shippingInfo = orderDetails?.shippingInfo;
    const createdAt = orderDetails?.createdAt;
    const orderStatus = orderDetails?.orderStatus;

    return (
        <>
            <SeoData title="Order Details | Flipkart" />

            {/* <MinCategory /> */}
            <main className="w-full py-2 sm:py-8 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
                {loading ? (
                    <Spinner />
                ) : (
                    <>
                        <div className="flex flex-col gap-6 max-w-6xl mx-auto">
                            <div className="flex flex-col sm:flex-row bg-white shadow-lg rounded-2xl min-w-full">
                                <div className="sm:w-1/2 border-r">
                                    <div className="flex flex-col gap-3 my-10 mx-10">
                                        <h3 className="text-lg font-bold text-gray-800">
                                            Delivery Address
                                        </h3>
                                        <h4 className="font-semibold text-gray-700">
                                            {buyer?.name}
                                        </h4>
                                        <p className="text-sm text-gray-600">{`${shippingInfo?.address}, ${shippingInfo?.city}, ${shippingInfo?.state} - ${shippingInfo?.pincode}`}</p>
                                        <div className="flex gap-2 text-sm">
                                            <p className="font-medium text-gray-700">Email</p>
                                            <p>{buyer?.email}</p>
                                        </div>
                                        <div className="flex gap-2 text-sm">
                                            <p className="font-medium text-gray-700">
                                                Phone Number
                                            </p>
                                            <p>{shippingInfo?.phoneNo}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <div className="flex flex-col gap-3 my-10 mx-10">
                                        <h3 className="text-lg font-bold text-gray-800">
                                            More Actions
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[15px] text-gray-700">
                                                Download Invoice
                                            </span>
                                            <Link
                                                to="/"
                                                className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] py-2 px-6 w-[160px] text-center text-white uppercase rounded-xl text-[13px] font-bold shadow hover:from-[#017bbd] hover:to-[#8fae07] transition"
                                            >
                                                Download
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {orderItems?.map((item) => {
                                const {
                                    _id,
                                    image,
                                    name,
                                    discountPrice,
                                    quantity,
                                    seller,
                                    sendInvoice,
                                    isInstalation,
                                    deliveryCharge,
                                    installationCost,
                                    price
                                } = item;

                                return (
                                    <div
                                        className="flex flex-col sm:flex-row min-w-full shadow-lg rounded-2xl bg-white px-4 py-7 mb-2"
                                        key={_id}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:w-1/2 gap-4">
                                            <div className="w-full sm:w-36 h-24 rounded-xl bg-gray-50 flex items-center justify-center shadow">
                                                <img
                                                    draggable="false"
                                                    className="h-full w-full object-contain rounded-xl"
                                                    src={image}
                                                    alt={name}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 overflow-hidden">
                                                <p className="text-base font-semibold text-gray-800">
                                                    {name.length > 60
                                                        ? `${name.substring(
                                                            0,
                                                            60
                                                        )}...`
                                                        : name}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-2">
                                                    Quantity: {quantity}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Seller: {seller?.name}
                                                </p>
                                                <span className="font-bold text-[#019ee3] text-lg">
                                                    ₹
                                                    {price}
                                                </span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[15px] text-gray-700">
                                                        Send Invoice :
                                                    </span>
                                                    <span>
                                                        {sendInvoice
                                                            ? "Sent"
                                                            : "Not Sent"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[15px] text-gray-700">
                                                        Instalation :
                                                    </span>
                                                    <span>
                                                        {isInstalation
                                                            ? "Requested"
                                                            : "Not Requested"}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    Order Date:{" "}
                                                    {new Date(
                                                        createdAt
                                                    ).toDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col w-full sm:w-1/2">
                                            <Tracker
                                                orderOn={createdAt}
                                                activeStep={
                                                    orderStatus === "Delivered"
                                                        ? 3
                                                        : orderStatus ===
                                                            "Out For Delivery"
                                                            ? 2
                                                            : orderStatus ===
                                                                "Shipped"
                                                                ? 1
                                                                : 0
                                                }
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </>
    );
};

export default OrderDetails;
