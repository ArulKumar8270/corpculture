import stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
import { getCartItemLineTotal } from "../../utils/orderAmountUtil.js";
import { validateAndPriceOrderItems } from "../../utils/validateOrderItems.js";
import { isAllowedFrontendOrigin } from "../../utils/allowedOrigins.js";

const createSession = async (req, res) => {
    try {
        const { products, frontendURL } = req.body;

        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(503).send({
                success: false,
                message: "Stripe payment is not configured",
            });
        }

        if (!frontendURL || !isAllowedFrontendOrigin(frontendURL)) {
            return res.status(400).send({
                success: false,
                message: "Invalid frontend URL",
            });
        }

        const priced = await validateAndPriceOrderItems(products);
        if (priced.error) {
            return res.status(400).send({ success: false, message: priced.error });
        }

        const successPath = "/shipping/confirm";
        const cancelPath = "/shipping/failed";
        const baseUrl = String(frontendURL).replace(/\/$/, "");
        const successURL = `${baseUrl}${successPath}`;
        const cancelURL = `${baseUrl}${cancelPath}`;

        const lineItems = priced.items.map((item) => {
            const lineTotal = getCartItemLineTotal(item);
            return {
                price_data: {
                    currency: "inr",
                    unit_amount: Math.round(lineTotal * 100),
                    product_data: {
                        name: item.name,
                    },
                },
                quantity: 1,
            };
        });

        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ["card"],
            currency: "inr",
            line_items: lineItems,
            mode: "payment",
            success_url: successURL,
            cancel_url: cancelURL,
            customer_email: req.user?.email,
            shipping_address_collection: {
                allowed_countries: ["IN"],
            },
            phone_number_collection: {
                enabled: true,
            },
            metadata: {
                buyerId: String(req.user._id),
                orderAmount: String(priced.amount),
            },
        });

        res.send({ session });
    } catch (error) {
        console.error("Error in creating stripe session:", error.message);
        res.status(500).send({
            success: false,
            message: "Error in Payment Gateway",
        });
    }
};
export default createSession;
