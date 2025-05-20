/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { getDiscount } from "../../../utils/functions";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import { useState } from "react";

const Product = (props) => {
    const {
        _id,
        name,
        price,
        discountPrice,
        images,
        ratings,
        numOfReviews,
        func,
    } = props;
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteProduct = async () => {
        setIsDeleting(true);
        try {
            // Make the delete request here
            await func(_id);
        } catch (error) {
            // Handle any errors if necessary
        } finally {
            setIsDeleting(false);
        }
    };
    // Check if 'images' is defined before rendering
    const shouldRenderImage = images && images.length > 0;

    return (
        <div className="flex gap-4 bg-white rounded-2xl shadow-lg border-b p-5 sm:pb-10 w-full group overflow-hidden mb-4">
            <div className="w-1/6 h-32 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center shadow">
                <img
                    draggable="false"
                    className="h-full w-full object-contain rounded-xl"
                    src={shouldRenderImage ? images[0].url : ""}
                    alt={name}
                />
            </div>

            {/* <!-- description --> */}
            <div className="flex flex-col gap-5 w-full p-1">
                {/* <!-- product title --> */}
                <div className="flex justify-between items-start sm:pr-5">
                    <Link
                        to={`/product/${_id}`}
                        className="flex flex-col gap-0.5"
                    >
                        <p className="group-hover:text-primaryBlue w-56 sm:w-full truncate text-lg font-semibold text-gray-800">
                            {name?.length > 70
                                ? `${name?.substring(0, 70)}...`
                                : name}
                        </p>
                        {/* <!-- rating badge --> */}
                        <span className="text-sm text-gray-500 font-medium flex gap-2 items-center mt-1">
                            <span className="text-xs px-2 py-0.5 bg-[#22ba20] rounded-md text-white flex items-center gap-1 font-bold">
                                {ratings} <StarIcon sx={{ fontSize: "16px" }} />
                            </span>
                            <span>({numOfReviews?.toLocaleString()})</span>
                            <span>
                                <img
                                    draggable="false"
                                    className="w-[60px] h-[20px] ml-4 object-contain"
                                    src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png"
                                    alt={name}
                                />
                            </span>
                        </span>
                        {/* <!-- rating badge --> */}
                    </Link>
                    <button
                        onClick={deleteProduct}
                        className="text-gray-400 hover:text-red-500 bg-gray-100 rounded-full p-2 transition shadow"
                        disabled={isDeleting}
                    >
                        <span>
                            <DeleteIcon />
                        </span>
                    </button>
                </div>
                {/* <!-- product title --> */}

                {/* <!-- price desc --> */}
                <div className="flex items-center gap-3 text-2xl font-bold">
                    <span className="text-[#019ee3]">₹{discountPrice?.toLocaleString()}</span>
                    <span className="text-sm text-gray-400 line-through font-normal mt-1">
                        ₹{price?.toLocaleString()}
                    </span>
                    <span className="text-sm text-primaryGreen mt-1 font-bold">
                        {getDiscount(price, discountPrice)}%&nbsp;off
                    </span>
                </div>
                {/* <!-- price desc --> */}
            </div>
            {/* <!-- description --> */}
        </div>
    );
};

export default Product;
