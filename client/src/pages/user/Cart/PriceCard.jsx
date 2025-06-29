/* eslint-disable react/prop-types */
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useEffect, useState } from "react";

const PriceCard = ({ cartItems }) => {
    return (
        <div className="flex sticky top-16 sm:h-screen flex-col sm:w-4/12 sm:px-1">
            {/* <!-- nav tiles --> */}
            <div className="flex flex-col bg-white rounded-2xl shadow-lg">
                <h1 className="px-8 py-5 border-b font-bold text-gray-800 text-xl rounded-t-2xl bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                    PRICE DETAILS
                </h1>

                <div className="flex flex-col gap-4 p-8 pb-5">
                    <p className="flex justify-between text-base">
                        Price ({cartItems?.length} item)
                        <span className="font-semibold text-gray-800">
                            ₹
                            {cartItems
                                .reduce(
                                    (sum, item) =>
                                        sum +
                                        item.discountPrice * item.quantity,
                                    0
                                )
                                .toLocaleString()}
                        </span>
                    </p>
                    <p className="flex justify-between text-base">
                        Discount
                        <span className="text-primaryGreen font-semibold">
                            - ₹
                            {cartItems
                                .reduce(
                                    (sum, item) =>
                                        sum +
                                        (item.price * item.quantity -
                                            item.discountPrice * item.quantity),
                                    0
                                )
                                .toLocaleString()}
                        </span>
                    </p>
                    <p className="flex justify-between text-base">
                        Delivery Charges
                        <span className="text-primaryGreen font-semibold">
                            {/* Calculate sum of delivery charges */} {/* {{ edit_1 }} */}
                            ₹ {/* {{ edit_1 }} */}
                            {cartItems // {{ edit_1 }}
                                .reduce( // {{ edit_1 }}
                                    (sum, item) => // {{ edit_1 }}
                                        sum + // {{ edit_1 }}
                                        (item?.deliveryCharge || 0), // Sum item.deliveryCharge, default to 0 if undefined // {{ edit_1 }}
                                    0 // {{ edit_1 }}
                                ) // {{ edit_1 }}
                                .toLocaleString()} {/* {{ edit_1 }} */}
                        </span>
                    </p>
                    <p className="flex justify-between text-base">
                        Instalation Charges
                        <span className="text-primaryGreen font-semibold">
                            {/* Calculate sum of installation charges */} {/* {{ edit_1 }} */}
                            ₹ {/* {{ edit_1 }} */}
                            {cartItems // {{ edit_1 }}
                                .reduce( // {{ edit_1 }}
                                    (sum, item) => // {{ edit_1 }}
                                        sum + // {{ edit_1 }}
                                        (item?.installationCost || 0), // Sum item.deliveryCharge, default to 0 if undefined // {{ edit_1 }}
                                    0 // {{ edit_1 }}
                                ) // {{ edit_1 }}
                                .toLocaleString()} {/* {{ edit_1 }} */}
                        </span>
                    </p>
                    <div className="border border-dashed"></div>
                    <p className="flex justify-between text-lg font-bold text-gray-900">
                        Total Amount
                        <span>
                            ₹
                            {cartItems
                                .reduce((sum, item) => {
                                    const quantity = item.quantity || 0;
                                    // Find matching price range
                                    const rangePrice = item?.priceRange.find(
                                        (range) =>
                                            quantity >= parseInt(range.from) &&
                                            quantity <= parseInt(range.to)
                                    );

                                    const rangeCost = rangePrice ? quantity * parseFloat(rangePrice.price) : 0;

                                    const deliveryCost = quantity ? item.deliveryCharge || 0 : 0;
                                    const installationCost = item.isInstalation ? item.installationCost || 0 : 0;

                                    return sum + rangeCost + deliveryCost + installationCost;
                                }, 0)
                                .toLocaleString()}

                        </span>
                    </p>
                    <div className="border border-dashed"></div>

                    <p className="font-bold text-primaryGreen text-base bg-[#f7fafd] rounded-lg px-3 py-2">
                        You will save ₹
                        {cartItems
                            .reduce(
                                (sum, item) =>
                                    sum +
                                    (item.price * item.quantity -
                                        item.discountPrice * item.quantity),
                                0
                            )
                            .toLocaleString()}{" "}
                        on this order
                    </p>
                </div>
            </div>
            <div className="flex gap-3 items-center my-4 p-3 bg-white rounded-xl shadow">
                <VerifiedUserIcon className="text-[#019ee3]" sx={{ fontSize: 28 }} />
                <p className="text-gray-600 w-full text-[15px] font-semibold">
                    Safe and Secure Payments. Easy returns. 100% Authentic products.
                </p>
            </div>
            {/* <!-- nav tiles --> */}
        </div>
    );
};

export default PriceCard;
