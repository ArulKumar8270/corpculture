/* eslint-disable react/prop-types */
import { getDiscount } from "../../../utils/functions";
import { useCart } from "../../../context/cart";

const SaveForLaterItem = ({ product }) => {
    const [, , , , saveLaterItems, addLater, moveToCart, removeLater] =
        useCart();

    const removeFromSaveForLaterHandler = (product) => {
        removeLater(product);
    };

    const moveToCartHandler = (product,quantity, sendInvoice, isInstalation) => {
        moveToCart(product,quantity, sendInvoice, isInstalation);
    };

    return (
        <div
            className="flex flex-col gap-3 py-5 pl-2 sm:pl-6 border-b bg-white rounded-2xl shadow-sm mb-4"
            key={product.productId}
        >
            <div
                className="flex flex-col sm:flex-row gap-5 items-stretch w-full"
                href="#"
            >
                {/* <!-- product image --> */}
                <div className="w-full sm:w-1/6 h-28 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center shadow">
                    <img
                        draggable="false"
                        className="h-full w-full object-contain rounded-xl"
                        src={product?.image}
                        alt={product?.name}
                    />
                </div>
                {/* <!-- product image --> */}

                {/* <!-- description --> */}
                <div className="flex flex-col gap-1 sm:gap-5 w-full p-1 pr-6">
                    {/* <!-- product title --> */}
                    <div className="flex justify-between items-start pr-5">
                        <div className="flex flex-col gap-0.5 w-11/12 sm:w-full">
                            <p className="font-semibold text-lg">
                                {product?.name?.length > 50
                                    ? `${product?.name?.substring(0, 50)}...`
                                    : product?.name}
                            </p>
                            <span className="text-sm text-gray-500">
                                Seller: {product?.brandName}
                            </span>
                        </div>
                    </div>
                    {/* <!-- product title --> */}

                    {/* <!-- price desc --> */}
                    <div className="flex items-baseline gap-2 text-xl font-semibold">
                        <span className="text-[#019ee3]">
                            ₹
                            {(
                                product?.price * product?.quantity
                            ).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-400 line-through font-normal">
                            ₹
                            {(
                                product?.discountPrice * product?.quantity
                            ).toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-primaryGreen">
                            {getDiscount(
                                product?.price,
                                product?.discountPrice
                            )}
                            %&nbsp;off
                        </span>
                    </div>
                    {/* <!-- price desc --> */}
                </div>
                {/* <!-- description --> */}
            </div>

            {/* <!-- move to cart --> */}
            <div className="flex justify-evenly sm:justify-start sm:gap-6 items-center">
                {/* <!-- quantity --> */}
                <div className="flex gap-2 items-center justify-between w-[130px]">
                    <span
                        className="w-8 h-8 text-2xl font-light bg-gray-100 rounded-full border flex items-center justify-center cursor-not-allowed"
                    >
                        <p>-</p>
                    </span>
                    <input
                        className="w-11 border outline-none text-center rounded-lg py-1 text-gray-700 font-semibold text-base qtyInput bg-gray-50"
                        value={product?.quantity}
                        disabled
                    />
                    <span
                        className="w-8 h-8 text-2xl font-light bg-gray-100 rounded-full border flex items-center justify-center cursor-not-allowed"
                    >
                        +
                    </span>
                </div>
                {/* <!-- quantity --> */}
                <button
                    onClick={() =>
                        moveToCartHandler(product, product?.quantity, product?.sendInvoice, product?.isInstalation)
                    }
                    className="sm:ml-4 font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white shadow hover:from-[#017bbd] hover:to-[#8fae07] transition"
                >
                    MOVE TO CART
                </button>
                <button
                    onClick={() => removeFromSaveForLaterHandler(product)}
                    className="font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-red-400 to-red-600 text-white shadow hover:from-red-500 hover:to-red-700 transition"
                >
                    REMOVE
                </button>
            </div>
            {/* <!-- move to cart --> */}
        </div>
    );
};

export default SaveForLaterItem;
