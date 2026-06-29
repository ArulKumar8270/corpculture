import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import employeeModel from "../models/employeeModel.js";

/**
 * Resolve an employee reference (User._id or Employee._id) to the User id
 * used for login and push token storage.
 */
export async function resolveNotificationUserId(employeeRef) {
    if (!employeeRef) return null;

    const id = String(employeeRef).trim();
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

    const user = await userModel.findById(id).select("_id");
    if (user) return String(user._id);

    const employee = await employeeModel.findById(id).select("userId");
    if (employee?.userId) return String(employee.userId);

    return null;
}
