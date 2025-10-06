/* eslint-disable react/prop-types */
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useEffect, useState } from "react";

const PriceCard = ({ cartItems }) => {

    // Helper function to get the correct price for an item based on quantity
    const getPrice = (item) => {
        const quantity = item.quantity || 0;
        const priceRange = item.priceRange?.find(
            (range) => quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
        );
        // Return the price from the matching range, otherwise, fall back to discountPrice
        return priceRange ? parseFloat(priceRange.price) : (item.discountPrice || 0);
    };

    // Calculate total price based on priceRange
    const subtotal = cartItems.reduce((sum, item) => {
        const itemPrice = getPrice(item);
        return sum + itemPrice * (item.quantity || 0);
    }, 0);

    // Calculate total discount
    const totalDiscount = cartItems.reduce((sum, item) => {
        const regularPrice = item.price * (item.quantity || 0);
        const actualPrice = getPrice(item) * (item.quantity || 0);
        return sum + (regularPrice - actualPrice);
    }, 0);

    // Calculate total delivery charges
    const totalDeliveryCharges = cartItems.reduce((sum, item) => {
        return sum + (item.deliveryCharge || 0);
    }, 0);

    // Calculate total installation charges
    const totalInstallationCharges = cartItems.reduce((sum, item) => {
        return sum + (item.isInstalation ? (item.installationCost || 0) : 0);
    }, 0);

    const totalAmount = subtotal + totalDeliveryCharges + totalInstallationCharges;

    return (
        <div className="flex sticky top-16 sm:h-screen flex-col sm:w-4/12 sm:px-1">
            <div className="flex flex-col bg-white rounded-2xl shadow-lg">
                <h1 className="px-8 py-5 border-b font-bold text-gray-800 text-xl rounded-t-2xl bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                    PRICE DETAILS
                </h1>

                <div className="flex flex-col gap-4 p-8 pb-5">
                    <p className="flex justify-between text-base">
                        Price ({cartItems?.length} item)
                        <span className="font-semibold text-gray-800">
                            ₹{subtotal.toLocaleString()}
                        </span>
                    </p>
                    <p className="flex justify-between text-base">
                        Discount
                        <span className="text-primaryGreen font-semibold">
                            - ₹{totalDiscount.toLocaleString()}
                        </span>
                    </p>
                    <p className="flex justify-between text-base">
                        Delivery Charges
                        <span className="text-primaryGreen font-semibold">
                            ₹{totalDeliveryCharges.toLocaleString()}
                        </span>
                    </p>
                    <p className="flex justify-between text-base">
                        Instalation Charges
                        <span className="text-primaryGreen font-semibold">
                            ₹{totalInstallationCharges.toLocaleString()}
                        </span>
                    </p>
                    <div className="border border-dashed"></div>
                    <p className="flex justify-between text-lg font-bold text-gray-900">
                        Total Amount
                        <span>
                            ₹{totalAmount.toLocaleString()}
                        </span>
                    </p>
                    <div className="border border-dashed"></div>
                    <p className="font-bold text-primaryGreen text-base bg-[#f7fafd] rounded-lg px-3 py-2">
                        You will save ₹{totalDiscount.toLocaleString()} on this order
                    </p>
                </div>
            </div>
            <div className="flex gap-3 items-center my-4 p-3 bg-white rounded-xl shadow">
                <VerifiedUserIcon className="text-[#019ee3]" sx={{ fontSize: 28 }} />
                <p className="text-gray-600 w-full text-[15px] font-semibold">
                    Safe and Secure Payments. Easy returns. 100% Authentic products.
                </p>
            </div>
        </div>
    );
};

export default PriceCard;