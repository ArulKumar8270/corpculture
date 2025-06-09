/* eslint-disable no-unused-vars */
import CartItem from "./CartItem";
import EmptyCart from "./EmptyCart";
import { useCart } from "../../../context/cart";
import SaveForLater from "./SaveForLater";
import ScrollToTopOnRouteChange from "./../../../utils/ScrollToTopOnRouteChange";
import SeoData from "../../../SEO/SeoData";
import PriceCard from "./PriceCard";
import { useAuth } from "../../../context/auth";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Cart = () => {
    const { auth } = useAuth();
    //stripe details
    const publishKey = import.meta.env.VITE_STRIPE_PUBLISH_KEY;
    const secretKey = import.meta.env.VITE_STRIPE_SECRET_KEY;
    let frontendURL = window.location.origin; // Get the frontend URL
    const [cartItems, setCartItems, , , saveLaterItems] = useCart();
    const navigate = useNavigate();
    // Sample data for existing users
    const existingUsers = [
        { id: 1, email: "alice@example.com" },
        { id: 2, email: "bob@example.com" },
        { id: 3, email: "charlie@example.com" },
    ];

    // State for selected users and new emails
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [additionalEmails, setAdditionalEmails] = useState([]);


    const handleAddEmail = () => {
        if (
            newUserEmail &&
            !additionalEmails.includes(newUserEmail) &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserEmail)
        ) {
            setAdditionalEmails([...additionalEmails, newUserEmail]);
            setNewUserEmail("");
        }
    };

    const handleRemoveEmail = (email) => {
        setAdditionalEmails(additionalEmails.filter((e) => e !== email));
    };

    //PAYMENT USING STRIPE
    const handlePayment = async () => {
        const stripe = await loadStripe(publishKey);

        const response = await axios.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/v1/user/create-checkout-session`,
            {
                products: cartItems,
                frontendURL: frontendURL,
                customerEmail: auth?.user?.email,
            },
            {
                headers: {
                    Authorization: auth?.token,
                },
            }
        );
        const session = response.data.session;
        console.log("session: ", session);
        //storing session id to retrieve payment details after successful
        localStorage.setItem("sessionId", session.id);
        const result = stripe.redirectToCheckout({
            sessionId: session.id,
        });
        console.log("result: ", result);

        if (result.error) {
            console.log(result.error);
        }
    };

    const placeOrderHandler = () => {
        localStorage.setItem("sessionId", "sdfas09df8as7");
        navigate("/shipping/confirm")
        // handlePayment();
    };

    return (
        <>
            <ScrollToTopOnRouteChange />
            <SeoData title="Shopping Cart | Flipkart.com" />
            <main className="w-full pt-5 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
                {/* <!-- row --> */}
                <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-11/12 mt-0 sm:mt-4 m-auto">
                    {/* <!-- cart column --> */}
                    <div className="flex-1">
                        {/* <!-- cart items container --> */}
                        <div className="flex flex-col rounded-2xl shadow-lg bg-white">
                            <span className="font-semibold text-xl px-4 sm:px-8 py-5 border-b rounded-t-2xl bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                                My Cart ({cartItems?.length})
                            </span>
                            {cartItems?.length === 0 ? (
                                <EmptyCart />
                            ) : (
                                cartItems?.map((item, i) => (
                                    <CartItem
                                        product={item}
                                        inCart={true}
                                        key={i}
                                    />
                                ))
                            )}
                            {/* <!-- place order btn --> */}
                            {auth?.user && <div className="flex flex-col gap-4 sticky bottom-0 left-0 bg-white rounded-b-2xl border-t px-4 py-3">
                                {/* Select existing users */}
                                <label className="font-semibold text-sm mb-1">Send Invoice To Existing Users:</label>
                                <div className="flex flex-wrap gap-3 mb-2">
                                    {existingUsers.map((user) => (
                                        <label
                                            key={user.id}
                                            className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                value={String(user.id)}
                                                checked={selectedUserIds.includes(String(user.id))}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedUserIds([...selectedUserIds, String(user.id)]);
                                                    } else {
                                                        setSelectedUserIds(selectedUserIds.filter(id => id !== String(user.id)));
                                                    }
                                                }}
                                                className="accent-primaryBlue"
                                            />
                                            <span className="text-gray-700 font-medium">{user.email}</span>
                                        </label>
                                    ))}
                                </div>
                                {/* Show selected users as chips */}
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedUserIds.map((id) => {
                                        const user = existingUsers.find(u => String(u.id) === id);
                                        return user ? (
                                            <span
                                                key={user.id}
                                                className="bg-primaryBlue/10 text-primaryBlue px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold"
                                            >
                                                {user.email}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedUserIds(selectedUserIds.filter(uid => uid !== id))
                                                    }
                                                    className="text-red-500 font-bold ml-1 hover:text-red-700"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                                {/* Add new user emails */}
                                <label className="font-semibold text-sm mb-1">Add New User Email(s):</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="email"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        placeholder="Enter email"
                                        className="border rounded-lg p-2 flex-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddEmail}
                                        className="bg-primaryBlue text-white px-4 py-2 rounded-lg font-semibold"
                                    >
                                        Add
                                    </button>
                                </div>
                                {/* Show added emails as chips */}
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {additionalEmails.map((email) => (
                                        <span
                                            key={email}
                                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2"
                                        >
                                            {email}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveEmail(email)}
                                                className="text-red-500 font-bold ml-1"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={placeOrderHandler}
                                    disabled={cartItems.length < 1}
                                    className={`transition-all duration-200 ${
                                        cartItems.length < 1
                                            ? "hidden"
                                            : "bg-gradient-to-r from-[#fb641b] to-[#ff9f00] hover:from-[#ff7f54] hover:to-[#ffe066]"
                                    } w-full sm:w-1/3 mx-auto my-2 py-4 font-bold text-lg text-white shadow-lg rounded-xl uppercase tracking-wide`}
                                >
                                    PLACE ORDER
                                </button>
                            </div>}
                            {/* <!-- place order btn --> */}
                        </div>
                        {/* <!-- cart items container --> */}

                        {/* <!-- saved for later items container --> */}
                        <div className="flex flex-col mt-7 rounded-2xl shadow-lg bg-white mb-8">
                            <span className="font-semibold text-xl px-4 sm:px-8 py-5 border-b rounded-t-2xl bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                                Saved For Later ({saveLaterItems?.length})
                            </span>
                            {saveLaterItems?.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">No items saved for later.</div>
                            ) : (
                                saveLaterItems?.map((item, i) => (
                                    <SaveForLater product={item} key={i} />
                                ))
                            )}
                        </div>
                        {/* <!-- saved for later container --> */}
                    </div>
                    {/* <!-- cart column --> */}

                    <PriceCard cartItems={cartItems} />
                </div>
                {/* <!-- row --> */}
            </main>
        </>
    );
};

export default Cart;
