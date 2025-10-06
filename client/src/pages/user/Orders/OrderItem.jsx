/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import CircleIcon from "@mui/icons-material/Circle";
import { Link } from "react-router-dom";
import { formatDate } from "../../../utils/functions";

const OrderItem = ({
    item,
    orderId,
    orderStatus,
    createdAt,
    paymentId,
    buyer,
    shippingInfo,
    amount,
}) => {
    return (
        <Link
            to={`./order_details/${orderId}`}
            className="flex flex-col sm:flex-row items-start bg-white rounded-2xl shadow-lg gap-5 px-6 sm:px-10 py-6 hover:shadow-2xl mx-2 sm:mx-10 transition"
        >
            {/* <!-- image container --> */}
            <div className="w-full sm:w-36 h-24 rounded-xl bg-gray-50 flex items-center justify-center shadow">
                <img
                    draggable="false"
                    className="h-full w-full object-contain rounded-xl"
                    src={item?.image}
                    alt={item?.name}
                />
            </div>
            {/* <!-- image container --> */}

            {/* <!-- order desc container --> */}
            <div className="flex flex-col sm:flex-row justify-between w-full">
                <div className="flex flex-col w-[300px] gap-1 overflow-hidden">
                    <p className="text-base font-semibold text-gray-800">
                        {item?.name.length > 40
                            ? `${item?.name.substring(0, 40)}...`
                            : item?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Quantity: {item?.quantity}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row mt-1 sm:mt-0 gap-2 sm:gap-20 sm:w-1/2">
                    <p className="text-lg w-[100px] font-bold text-[#019ee3]">
                        ₹ {(item?.price)}
                    </p>

                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-semibold flex items-center gap-1 w-[250px]">
                            {orderStatus === "Shipped" ? (
                                <>
                                    <span className="text-orange pb-0.5">
                                        <CircleIcon sx={{ fontSize: "16px" }} />
                                    </span>
                                    Shipped
                                </>
                            ) : orderStatus === "Delivered" ? (
                                <>
                                    <span className="text-primaryGreen pb-0.5">
                                        <CircleIcon sx={{ fontSize: "16px" }} />
                                    </span>
                                    Delivered
                                </>
                            ) : orderStatus === "Out For Delivery" ? (
                                <>
                                    <span className="text-yellow-500 pb-0.5">
                                        <CircleIcon sx={{ fontSize: "16px" }} />
                                    </span>
                                    Out For Delivery
                                </>
                            ) : (
                                <>
                                    <span className="text-primaryBlue pb-0.5">
                                        <CircleIcon sx={{ fontSize: "16px" }} />
                                    </span>
                                    Ordered on {formatDate(createdAt)}
                                </>
                            )}
                        </p>
                        {orderStatus === "Delivered" ? (
                            <p className="text-xs ml-1 text-primaryGreen font-medium">
                                Your item has been Delivered
                            </p>
                        ) : orderStatus === "Shipped" ? (
                            <p className="text-xs ml-1 text-orange-500 font-medium">
                                Your item has been Shipped
                            </p>
                        ) : orderStatus === "Processed" ? (
                            <p className="text-xs ml-1 text-blue-500 font-medium">
                                Seller has processed your order
                            </p>
                        ) : orderStatus === "Out For Delivery" ? (
                            <p className="text-xs ml-1 text-yellow-600 font-medium">
                                Your order is Out for Delivery
                            </p>
                        ) : (
                            <p className="text-xs ml-1 text-gray-500 font-medium">
                                Your order has been placed
                            </p>
                        )}
                    </div>
                </div>
            </div>
            {/* <!-- order desc container --> */}
        </Link>
    );
};

export default OrderItem;
