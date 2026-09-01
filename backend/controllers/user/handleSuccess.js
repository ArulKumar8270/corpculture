import stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";
import { tryAutoAssignNewOrder } from "../../utils/tryAutoAssignNewOrder.js";
import {
    mapValidatedOrderItems,
    validateAndPriceOrderItems,
} from "../../utils/validateOrderItems.js";

const handleSuccess = async (req, res) => {
    try {
        const { sessionId, orderItems, shippingInfo, orderReferenceNo } = req.body;

        if (!Array.isArray(orderItems) || !orderItems.length) {
            return res.status(400).send({
                success: false,
                message: "No order items received",
            });
        }
        if (!sessionId) {
            return res.status(400).send({
                success: false,
                message: "Payment session ID is required",
            });
        }

        const ref = String(orderReferenceNo || "").trim();
        if (!ref) {
            return res.status(400).send({
                success: false,
                message: "Order reference number is required",
            });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(503).send({
                success: false,
                message: "Stripe payment is not configured",
            });
        }

        const priced = await validateAndPriceOrderItems(orderItems);
        if (priced.error) {
            return res.status(400).send({ success: false, message: priced.error });
        }

        const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            return res.status(400).send({
                success: false,
                message: "Payment has not been completed",
            });
        }

        const paidAmount = Number(session.amount_total) / 100;
        if (paidAmount + 0.01 < priced.amount) {
            return res.status(400).send({
                success: false,
                message: "Paid amount does not match the order total",
            });
        }

        const paymentIntentId =
            typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id;

        if (!paymentIntentId) {
            return res.status(400).send({
                success: false,
                message: "Invalid payment session",
            });
        }

        const existingOrder = await orderModel.findOne({ paymentId: paymentIntentId });
        if (existingOrder) {
            return res.status(200).send({ success: true, order: existingOrder });
        }

        const orderObject = mapValidatedOrderItems(priced.items);

        const shippingObject =
            shippingInfo && typeof shippingInfo === "object"
                ? shippingInfo
                : {
                      address: session?.customer_details?.address?.line1,
                      city: session?.customer_details?.address?.city,
                      state: session?.customer_details?.address?.state,
                      country: session?.customer_details?.address?.country,
                      pincode: session?.customer_details?.address?.postal_code,
                      phoneNo: session?.customer_details?.phone || "Not Provided",
                      landmark:
                          session?.customer_details?.address?.line2 || "No Landmark",
                  };

        const combinedOrder = {
            paymentId: paymentIntentId,
            products: orderObject,
            buyer: req.user._id,
            orderReferenceNo: ref,
            shippingInfo: shippingObject,
            amount: priced.amount,
            paymentMethod: "online",
            paymentStatus: "Paid",
        };
        const order = new orderModel(combinedOrder);
        await order.save();

        await tryAutoAssignNewOrder(order);

        for (const item of priced.items) {
            const product = await productModel.findById(item.productId);
            if (product) {
                product.stock -= item.quantity;
                await product.save();
            } else {
                throw new Error(`Product with ID ${item.productId} not found`);
            }
        }

        return res.status(200).send({ success: true, order });
    } catch (error) {
        console.error("Error in handling payment success:", error);
        return res.status(500).send({
            success: false,
            message: "Error in handling payment success",
        });
    }
};

export default handleSuccess;
