import stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
import orderModel from "../../models/orderModel.js";
import mongoose from "mongoose";
import productModel from "../../models/productModel.js";

const handleSuccess = async (req, res) => {
    try {
        // Retrieve the session ID from the request body
        const { sessionId, orderItems } = req.body;

        // Validate order items and session ID
        if (!orderItems.length) {
            return res.status(503).send("No OrderItems received from client!");
        }
        if (!sessionId) {
            return res
                .status(503)
                .send("No sessionId for payment received from client!");
        }

        // Fetch the payment intent associated with the session
        // const session = await stripeInstance.checkout.sessions.retrieve(
        //     sessionId
        // );
        let session = {
            payment_intent: "pi_3N7qf3Lw5q2q7Xw5720Y3720",
            // Calculate total amount from order items
            amount_total: orderItems.reduce((sum, item) => {
                const quantity = item.quantity || 0;
                // Find matching price range
                const rangePrice = item?.priceRange.find(
                    (range) =>
                        quantity >= parseInt(range.from) &&
                        quantity <= parseInt(range.to)
                );

                const rangeCost = rangePrice ? quantity * parseFloat(rangePrice.price) : 0;

                const deliveryCost = quantity ? item.deliveryCharge || 0 : 0;
                const installationCost = item.isInstalation ? item.installationCost || 0 : 0;

                return sum + rangeCost + deliveryCost + installationCost;
            }, 0)
                .toLocaleString(),

            customer_details: {
                address: {
                    line1: "123 Main Street",
                    city: "Anytown",
                    state: "CA",
                    country: "USA",
                    postal_code: "12345",
                },
                phone: "1234567890",
                name: "John Doe",
                email: "arulkumar8270@gmail.com"
            },
        }
        console.log("session: ", session);

        // Extract the payment intent ID from the retrieved session
        const paymentIntentId = session?.payment_intent;
        const amount = session.amount_total;

        // Map order items to the required format
        const orderObject = orderItems?.map((product) => ({
            name: product.name,
            image: product.image,
            sendInvoice: product.sendInvoice,
            isInstalation: product.isInstalation,
            brandName: product.brandName,
            price: product.price,
            discountPrice: product.discountPrice,
            deliveryCharge: product.deliveryCharge,
            installationCost: product.installationCost,
            quantity: product.quantity,
            productId: new mongoose.Types.ObjectId(product.productId),
            seller: new mongoose.Types.ObjectId(product.seller),
        }));

        // Construct shipping information
        const shippingObject = {
            address: session?.customer_details?.address?.line1,
            city: session?.customer_details?.address?.city,
            state: session?.customer_details?.address?.state,
            country: session?.customer_details?.address?.country,
            pincode: session?.customer_details?.address?.postal_code,
            phoneNo: session?.customer_details?.phone || "Not Provided",
            landmark:
                session?.customer_details?.address?.line2 || "No Landmark",
        };

        // Create and save the order in the database
        const combinedOrder = {
            paymentId: paymentIntentId,
            products: orderObject,
            buyer: req.user._id,
            shippingInfo: shippingObject,
            amount: amount,
        };
        const order = new orderModel(combinedOrder);
        await order.save();

        // Reduce stock for each product
        for (const item of orderItems) {
            const product = await productModel.findById(item?.productId);
            if (product) {
                product.stock -= item?.quantity;
                await product.save();
            } else {
                throw new Error(`Product with ID ${item.productId} not found`);
            }
        }
        // Send success response
        return res.status(200).send({ success: true, order: order });
    } catch (error) {
        console.error("Error in handling payment success:", error);
        // Ensure you only send one response
        return res.status(500).send("Error in handling payment success");
    }
};

export default handleSuccess;
