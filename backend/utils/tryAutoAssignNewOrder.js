import { autoAssignOrderById, notifyEmployeeOfAssignment } from "../utils/assignOrderToEmployee.js";

/** Try to auto-assign a newly created order; failures are logged, not thrown. */
export const tryAutoAssignNewOrder = async (order) => {
    if (!order?._id) return null;

    try {
        const result = await autoAssignOrderById(order._id);
        if (result.success) {
            await notifyEmployeeOfAssignment(result.employeeId, [result.order]);
            console.log(
                `Auto-assigned order ${order._id} to ${result.employeeName}`
            );
            return result;
        }
        console.warn(
            `Auto-assign skipped for order ${order._id}: ${result.reason}`
        );
        return null;
    } catch (error) {
        console.error(`Auto-assign failed for order ${order._id}:`, error);
        return null;
    }
};
