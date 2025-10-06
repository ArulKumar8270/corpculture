/* eslint-disable react/prop-types */
// import { addItemsToCart, removeItemsFromCart } from "../../actions/cartAction";
import { toast } from "react-toastify";
import { getDeliveryDate, getDiscount } from "../../../utils/functions";
import { Link } from "react-router-dom";
import { useCart } from "../../../context/cart";
import { useState, useEffect } from "react";

const CartItem = ({ product, inCart }) => {
    const [, , addItems, removeItems, , addLater] = useCart();
    // console.log(product);
    const [quantity, setQuantity] = useState(0);
    const [sendInvoice, setSendInvoice] = useState(false);
    const [isInstalation, setIsInstalation] = useState(false);

    useEffect(() => {
        addItems(product, quantity, sendInvoice, isInstalation);
    }, [sendInvoice, isInstalation])

    const increaseQuantity = (product) => {
        const newQty = quantity + 1;
        if (newQty > product?.stock) {
            toast.warning("Product Stock is Limited!", {
                style: {
                    top: "40px",
                },
            });
            return;
        }
        setQuantity(newQty);
        addItems(product, newQty, sendInvoice, isInstalation);
    };

    const decreaseQuantity = (product) => {
        const newQty = quantity - 1;
        if (newQty < 1) return;
        setQuantity(newQty);
        addItems(product, newQty, sendInvoice, isInstalation);
    };

    const removeCartItem = (product) => {
        removeItems(product);
    };

    const saveForLaterHandler = (product) => {
        // dispatch(saveForLater(id));
        addLater(product);
        // console.log("Save for later clicked");
        // enqueueSnackbar("Saved For Later", { variant: "success" });
    };

    return (
        <div className="flex flex-col gap-3 py-5 pl-2 sm:pl-6 border-b overflow-hidden bg-white rounded-2xl shadow-sm mb-4">
            <div
                className="flex flex-col sm:flex-row gap-5 items-stretch w-full"
            >
                <Link
                    to={`/product/${product?.productId}`} >
                    {/* <!-- product image --> */}
                    <div className="w-full sm:w-6/6 h-28 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center shadow">
                        <img
                            draggable="false"
                            className="h-full w-full object-contain rounded-xl"
                            src={product?.image}
                            alt={product?.name}
                        />
                    </div>
                    {/* <!-- product image --> */}
                </Link>
                {/* <!-- description --> */}
                <div className="flex flex-col sm:gap-5 w-full">
                    {/* <!-- product title --> */}
                    <div className="flex flex-col sm:flex-row justify-between items-start pr-5 gap-1 sm:gap-0">
                        <div className="flex flex-col gap-0.5 group sm:w-3/5">
                            <p className="group-hover:text-primaryBlue font-semibold text-lg">
                                {product?.name?.length > 30
                                    ? `${product?.name?.substring(0, 30)}...`
                                    : product?.name}
                            </p>
                            <span className="text-sm text-gray-500">
                                Seller: {product?.brandName}
                            </span>
                        </div>

                        <div className="flex flex-col sm:gap-2 w-[50%]">
                            <p className="text-sm">
                                Delivery by {getDeliveryDate()} |{" "}
                                <span className="line-through">₹{40}</span>{" "}
                                <span className="text-primaryGreen">Free</span>
                            </p>
                            {/* Invoice send option */}
                            <label className="flex items-center gap-2 mt-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    value={sendInvoice}
                                    className="accent-primaryBlue w-4 h-4"
                                    onChange={() => setSendInvoice((prev) => !prev)} // Add handler if you want to track selection
                                />
                                Send Quotation with this item
                            </label>
                            <label className="flex items-center gap-2 mt-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    value={isInstalation}
                                    className="accent-primaryBlue w-4 h-4"
                                    onChange={() => setIsInstalation((prev) => !prev)} // Add handler if you want to track selection
                                />
                                Installation Required
                            </label>
                        </div>
                    </div>
                    {/* <!-- product title --> */}

                    {/* <!-- price desc --> */}
                    <div className="flex items-baseline gap-2 text-xl font-semibold">
                        <span className="text-sm text-gray-400 line-through font-normal">
                            ₹ {(product?.discountPrice).toLocaleString()}
                        </span>
                        <span className="text-[#019ee3]">
                            ₹
                            {(product?.price).toLocaleString()}
                        </span>
{/* 
                        <span className="text-sm font-bold text-primaryGreen">
                            {getDiscount(
                                product?.price,
                                product?.discountPrice
                            )}
                            %&nbsp;off
                        </span> */}
                    </div>
                    {/* <!-- price desc --> */}
                </div>
                {/* <!-- description --> */}
            </div>

            {/* <!-- save for later --> */}
            <div className="flex justify-between pr-4 sm:pr-0 sm:justify-start sm:gap-6 items-center">
                {/* <!-- quantity --> */}
                <div className="flex gap-2 items-center justify-between w-[130px]">
                    <span
                        onClick={() => decreaseQuantity(product)}
                        className="w-8 h-8 text-2xl font-light select-none bg-gray-100 rounded-full border flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
                    >
                        <p>-</p>
                    </span>
                    <input
                        className="w-11 border outline-none text-center select-none rounded-lg py-1 text-gray-700 font-semibold text-base qtyInput bg-gray-50"
                        value={quantity}
                        disabled
                    />
                    <span
                        onClick={() => increaseQuantity(product)}
                        className="w-8 h-8 text-2xl font-light select-none bg-gray-100 rounded-full border flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
                    >
                        +
                    </span>
                </div>
                {/* <!-- quantity --> */}
                {inCart && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => saveForLaterHandler(product)}
                            className="sm:ml-4 font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white shadow hover:from-[#017bbd] hover:to-[#8fae07] transition"
                        >
                            SAVE FOR LATER
                        </button>
                        <button
                            onClick={() => removeCartItem(product)}
                            className="font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-red-400 to-red-600 text-white shadow hover:from-red-500 hover:to-red-700 transition"
                        >
                            REMOVE
                        </button>
                    </div>
                )}
            </div>
            {/* <!-- save for later --> */}
        </div>
    );
};

export default CartItem;
