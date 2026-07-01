import orderModel from "../../models/orderModel.js";
import Employee from "../../models/employeeModel.js";
import {
    assignSingleOrderToEmployee,
    notifyEmployeeOfAssignment,
    autoAssignOrderById,
} from "../../utils/assignOrderToEmployee.js";
import {
    findBestEmployeeForOrder,
    employeeMatchesOrder,
} from "../../utils/orderEmployeeMatcher.js";

const autoAssignOrders = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!Array.isArray(orderId) || orderId.length === 0) {
            return res.status(400).send({
                success: false,
                message: "orderId must be a non-empty array",
            });
        }

        const employees = await Employee.find({}).select("-password").lean();

        const assigned = [];
        const failed = [];

        const notificationsByEmployee = new Map();

        for (const id of orderId) {
            try {
                const result = await autoAssignOrderById(id, employees);

                if (result.success) {
                    assigned.push({
                        orderId: id,
                        employeeId: result.employeeId,
                        employeeName: result.employeeName,
                    });

                    const list = notificationsByEmployee.get(result.employeeId) || [];
                    list.push(result.order);
                    notificationsByEmployee.set(result.employeeId, list);
                } else {
                    failed.push({
                        orderId: id,
                        reason: result.reason || "Assignment failed",
                    });
                }
            } catch (err) {
                failed.push({ orderId: id, reason: err.message });
            }
        }

        for (const [employeeId, orders] of notificationsByEmployee) {
            await notifyEmployeeOfAssignment(employeeId, orders);
        }

        if (assigned.length > 0 && failed.length === 0) {
            return res.status(200).send({
                success: true,
                message: "All orders auto-assigned successfully",
                assigned,
            });
        }

        if (assigned.length > 0) {
            return res.status(207).send({
                success: false,
                message: "Some orders could not be auto-assigned",
                assigned,
                failed,
            });
        }

        return res.status(404).send({
            success: false,
            message: "No orders could be auto-assigned",
            failed,
        });
    } catch (error) {
        console.error("Error in autoAssignOrders:", error);
        return res.status(500).send({
            success: false,
            message: "Internal server error during auto assignment",
            error: error.message,
        });
    }
};

/** Suggest matching employees for an order (preview, no DB write). */
export const suggestEmployeesForOrder = async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).send({
                success: false,
                message: "Order not found",
            });
        }

        const employees = await Employee.find({}).select("-password").lean();
        const orderPincode = order.shippingInfo?.pincode;
        const orderAmount = order.amount ?? 0;

        const matches = employees
            .filter((emp) => employeeMatchesOrder(emp, orderAmount, orderPincode))
            .map((emp) => ({
                _id: emp._id,
                name: emp.name,
                pincode: emp.pincode,
                orderPriceFrom: emp.orderPriceFrom,
                orderPriceTo: emp.orderPriceTo,
            }));

        const best = await findBestEmployeeForOrder(order, employees);

        return res.status(200).send({
            success: true,
            orderId: order._id,
            pincode: orderPincode,
            amount: orderAmount,
            suggestedEmployeeId: best?._id || null,
            suggestedEmployeeName: best?.name || null,
            matches,
        });
    } catch (error) {
        console.error("Error suggesting employees:", error);
        return res.status(500).send({
            success: false,
            message: "Error finding employee suggestions",
            error: error.message,
        });
    }
};

export default autoAssignOrders;
