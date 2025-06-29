/* eslint-disable react/prop-types */
import CircleIcon from "@mui/icons-material/Circle";
import { Link } from "react-router-dom";
import { formatDate } from "../../utils/functions";

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
    // Color mapping for order status
    const statusColor =
        orderStatus === "Delivered"
            ? "text-[#afcb09]"
            : orderStatus === "Shipped"
            ? "text-[#019ee3]"
            : orderStatus === "Out For Delivery"
            ? "text-[#afcb09]"
            : "text-[#019ee3]";

    return (
        <Link
            to={`./order_details/${orderId}`}
            className="flex flex-col sm:flex-row items-start bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] border border-[#019ee3]/20 rounded-2xl gap-5 px-4 sm:px-8 py-5 hover:shadow-xl transition mx-2 sm:mx-10"
        >
            {/* <!-- image container --> */}
            <div className="w-full sm:w-32 h-20 flex items-center justify-center bg-white rounded-xl shadow">
                <img
                    draggable="false"
                    className="h-full w-full object-contain"
                    src={item?.image}
                    alt={item?.name}
                />
            </div>
            {/* <!-- image container --> */}

            {/* <!-- order desc container --> */}
            <div className="flex flex-col sm:flex-row justify-between w-full">
                <div className="flex flex-col w-[300px] gap-1 overflow-hidden">
                    <p className="text-base font-semibold text-[#019ee3] truncate">
                        {item?.name.length > 40
                            ? `${item?.name.substring(0, 40)}...`
                            : item?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Quantity: {item?.quantity}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row mt-1 sm:mt-0 gap-2 sm:gap-20 sm:w-1/2">
                    <p className="text-base font-bold text-[#afcb09] w-[100px]">
                        ₹{amount}
                    </p>

                    <div className="flex flex-col gap-2">
                        <p className={`text-sm font-medium flex items-center gap-1 w-[250px] ${statusColor}`}>
                            <span className="pb-0.5">
                                <CircleIcon sx={{ fontSize: "14px" }} />
                            </span>
                            {orderStatus === "Shipped"
                                ? "Shipped"
                                : orderStatus === "Delivered"
                                ? "Delivered"
                                : orderStatus === "Out For Delivery"
                                ? "Out For Delivery"
                                : `Order received on ${formatDate(createdAt)}`}
                        </p>
                        {orderStatus === "Delivered" ? (
                            <p className="text-xs ml-1 text-[#afcb09]">
                                Item successfully delivered
                            </p>
                        ) : orderStatus === "Out For Delivery" ? (
                            <p className="text-xs ml-1 text-[#afcb09]">
                                Product is out for delivery
                            </p>
                        ) : orderStatus === "Shipped" ? (
                            <p className="text-xs ml-1 text-[#019ee3]">
                                You have processed this order
                            </p>
                        ) : (
                            <p className="text-xs ml-1 text-[#019ee3]">Order received</p>
                        )}
                    </div>
                </div>
            </div>
            {/* <!-- order desc container --> */}
        </Link>
    );
};

export default OrderItem;
