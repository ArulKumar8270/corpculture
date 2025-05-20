import { Link } from "react-router-dom";

const EmptyCart = () => {
    return (
        <div className="flex items-center flex-col gap-4 m-8 pb-12 bg-white rounded-2xl shadow-lg max-w-md mx-auto">
            <div className="w-56 h-48 mt-6">
                <img
                    draggable="false"
                    className="w-full h-full object-contain"
                    src="https://rukminim1.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png"
                    alt="Empty Cart"
                />
            </div>
            <span className="text-2xl font-bold text-gray-800 mt-2">Your cart is empty!</span>
            <p className="text-base text-gray-500">Add items to it now.</p>
            <Link
                to="/products"
                className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-lg font-semibold text-white px-14 py-3 rounded-xl shadow hover:from-[#017bbd] hover:to-[#8fae07] transition mt-4 mb-8"
            >
                Shop Now
            </Link>
        </div>
    );
};

export default EmptyCart;
