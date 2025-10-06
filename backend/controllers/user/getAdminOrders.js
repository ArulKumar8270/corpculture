import orderModel from "../../models/orderModel.js";
import userModel from "../../models/userModel.js";

const getAdminOrders = async (req, res) => {
    try {
        const populatedOrder = await orderModel.find().populate("buyer", "name _id")
            .populate({ path: "products.seller", model: userModel })
            .populate("employeeId", "name _id")
                res.status(200).send({
                    success: true,
                    orders: populatedOrder,
                });
    } catch (error) {
        console.error("Error in getting Orders:", error);
        res.status(500).send("Error in getting orders");
    }
};

export default getAdminOrders;
