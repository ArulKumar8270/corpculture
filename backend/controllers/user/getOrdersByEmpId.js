import orderModel from "../../models/orderModel.js";

// Get Orders by Employee ID
const getOrdersByEmployeeId = async (req, res) => {
    try {
        const { id } = req.params;
        // Find all orders assigned to this employee
        const orders = await orderModel.find({ employeeId: id })
        if (!orders || orders.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No orders found for this employee",
            });
        }

        res.status(200).send({
            success: true,
            message: "Orders fetched successfully",
            orders: orders,
        });

    } catch (error) {
        console.error("Error in getting orders by employee ID:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting orders by employee ID",
            error: error.message,
        });
    }
};
export default getOrdersByEmployeeId;