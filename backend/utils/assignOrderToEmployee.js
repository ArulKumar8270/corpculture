import orderModel from "../models/orderModel.js";
import { findBestEmployeeForOrder } from "./orderEmployeeMatcher.js";
import { resolveNotificationUserId } from "./resolveNotificationUserId.js";
import { notifyAssignment } from "./expoPushNotification.js";

export const assignSingleOrderToEmployee = async (orderId, employeeId) => {
    const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { employeeId },
        { new: true }
    );

    if (!updatedOrder) {
        return { success: false, orderId, reason: "Order not found" };
    }

    return { success: true, order: updatedOrder };
};

/** Assign one order to the best-matching Sales employee (pincode + order amount). */
export const autoAssignOrderById = async (orderId, employees = null) => {
    const order = await orderModel.findById(orderId);
    if (!order) {
        return { success: false, orderId, reason: "Order not found" };
    }

    if (order.employeeId) {
        return {
            success: false,
            orderId,
            reason: "Order already assigned",
            employeeId: order.employeeId,
        };
    }

    const employee = await findBestEmployeeForOrder(order, employees);
    if (!employee) {
        return {
            success: false,
            orderId,
            reason: "No matching employee for pincode and order amount",
        };
    }

    const result = await assignSingleOrderToEmployee(orderId, employee._id);
    if (!result.success) return result;

    return {
        success: true,
        orderId,
        order: result.order,
        employeeId: employee._id,
        employeeName: employee.name,
    };
};

export const notifyEmployeeOfAssignment = async (employeeId, updatedOrders) => {
    if (!updatedOrders?.length) return;

    const userId = await resolveNotificationUserId(employeeId);
    if (!userId) return;

    const count = updatedOrders.length;
    const orderLabel = count === 1 ? "1 sales order" : `${count} sales orders`;

    notifyAssignment(userId, {
        type: "sales_order",
        title: "New Sales Order Assigned",
        body: `You have been assigned ${orderLabel}`,
        entityId: updatedOrders[0]?._id,
    }).catch((err) => console.error("Order assignment push failed:", err));
};
