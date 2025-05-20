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

const Cart = () => {
    const { auth } = useAuth();
    //stripe details
    const publishKey = import.meta.env.VITE_STRIPE_PUBLISH_KEY;
    const secretKey = import.meta.env.VITE_STRIPE_SECRET_KEY;
    let frontendURL = window.location.origin; // Get the frontend URL
    const [cartItems, setCartItems, , , saveLaterItems] = useCart();

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
        handlePayment();
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
                            <div className="flex flex-col gap-2 sticky bottom-0 left-0 bg-white rounded-b-2xl border-t px-4 py-3">
                                {/* test card details */}
                                <div
                                    className={`text-xs p-2 mb-2 ${
                                        cartItems.length < 1
                                            ? "hidden"
                                            : "inline-block"
                                    } w-full bg-[#f7fafd] rounded-lg border`}
                                >
                                    <p className="mb-1 font-semibold text-gray-700">
                                        For payment purposes, you can use the following test card details:
                                    </p>
                                    <ul className="ml-4 list-disc text-gray-600">
                                        <li>
                                            <strong>Card Number:</strong> 4242 4242 4242 4242
                                        </li>
                                        <li>
                                            <strong>Expiry Date:</strong> Any future date (e.g., 12/25)
                                        </li>
                                        <li>
                                            <strong>CVV:</strong> Any 3-digit number (e.g., 123)
                                        </li>
                                    </ul>
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
                            </div>
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
