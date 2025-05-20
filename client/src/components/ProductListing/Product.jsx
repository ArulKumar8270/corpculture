/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { Link } from "react-router-dom";
import { getDiscount } from "../../utils/functions";
import { useEffect, useState } from "react";
import ScrollToTopOnRouteChange from "../../utils/ScrollToTopOnRouteChange";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../../context/auth";

const Product = ({
    _id,
    images,
    name,
    ratings,
    numOfReviews,
    price,
    discountPrice,
    wishlistItems,
    setWishlistItems,
}) => {
    const { auth, isAdmin } = useAuth();

    //check if item is present in user wishlist or not
    const itemInWishlist = wishlistItems?.some((itemId) => {
        return itemId === _id;
    });

    // Optimistic UI update
    const updateWishlistUI = (add) => {
        setWishlistItems((prev) =>
            add ? [...prev, _id] : prev.filter((item) => item !== _id)
        );
    };

    // add to wishlist function
    const addToWishlistHandler = async () => {
        const type = itemInWishlist ? "remove" : "add";
        try {
            // Update the UI before the API call
            updateWishlistUI(type === "add");

            const res = await axios.post(
                `${
                    import.meta.env.VITE_SERVER_URL
                }/api/v1/user/update-wishlist`,
                { productId: _id, type },
                { headers: { Authorization: auth.token } }
            );
        } catch (error) {
            console.error(error);
            if (error.message.includes("403")) {
                toast.error(
                    "Admins are not allowed to add items to the wishlist",
                    {
                        toastId: "error",
                    }
                );
            } else {
                toast.error("Something went wrong! Please try again later.", {
                    toastId: "error",
                });
            }
            // Revert UI update if there is an error
            updateWishlistUI(type !== "add");
        }
    };

    return (
        <>
            <ScrollToTopOnRouteChange />
            <div className="relative m-2">
                {/* <!-- wishlist badge --> */}
                <span
                    onClick={addToWishlistHandler}
                    className={`${
                        itemInWishlist
                            ? "text-red-500"
                            : "hover:text-red-500 text-gray-300"
                    }
                    ${isAdmin ? "hidden" : ""}
                    absolute z-10 top-3 right-4 cursor-pointer bg-white rounded-full shadow p-1 transition`}
                >
                    <FavoriteIcon sx={{ fontSize: "22px" }} />
                </span>
                {/* <!-- wishlist badge --> */}
                <div className="flex flex-col items-center gap-2 w-full px-4 py-6 relative hover:shadow-2xl rounded-2xl shadow border border-[#e6fbff] bg-white transition">
                    {/* <!-- image & product title --> */}
                    <Link
                        to={`/product/${_id}`}
                        className="flex flex-col items-center w-full text-center group"
                    >
                        <div className="w-44 h-48">
                            <img
                                draggable="false"
                                className="w-full h-full object-contain"
                                src={images && images[0]?.url}
                                alt={name}
                            />
                        </div>
                    </Link>
                    {/* <!-- image & product title --> */}

                    {/* <!-- product description --> */}
                    <div className="flex flex-col gap-2 items-start w-full">
                        <h2 className="text-base leading-6 font-semibold mt-4 group-hover:text-[#019ee3] text-left truncate">
                            {name.length > 25
                                ? `${name.substring(0, 25)}...`
                                : name}
                        </h2>
                        {/* <!-- rating badge --> */}
                        <span className="text-sm text-gray-500 font-medium flex gap-2 items-start justify-between">
                            <span className="text-xs px-2 py-1 bg-[#019ee3] rounded-full text-white flex items-center gap-1 font-semibold">
                                {ratings.toFixed(1)}
                                <StarIcon sx={{ fontSize: "15px" }} />
                            </span>
                            <span>({numOfReviews})</span>
                
                        </span>
                        {/* <!-- rating badge --> */}

                        {/* <!-- price container --> */}
                        <div className="flex items-center gap-2 text-md font-semibold">
                            <span className="text-[#afcb09]">₹{discountPrice.toLocaleString()}</span>
                            <span className="text-gray-400 line-through text-xs">
                                ₹{price.toLocaleString()}
                            </span>
                            <span className="text-xs text-[#019ee3] font-bold">
                                {getDiscount(price, discountPrice)}%&nbsp;off
                            </span>
                        </div>
                        {/* <!-- price container --> */}
                    </div>
                    {/* <!-- product description --> */}
                </div>
            </div>
        </>
    );
};

export default Product;
