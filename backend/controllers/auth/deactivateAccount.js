import userModel from "../../models/userModel.js";
import Employee from "../../models/employeeModel.js";
import { softDeleteById, TRASH_SUCCESS_MESSAGE } from "../../utils/softDelete.js";

const trashLinkedEmployee = async (user, deletedBy) => {
    if (Number(user.role) !== 3) return;

    const employee = await Employee.findOne({ userId: user._id });
    if (employee) {
        await softDeleteById(Employee, employee._id, deletedBy);
    }
};

// Account trash (soft delete) — self-service with email + phone verification
export const deactivateController = async (req, res) => {
    try {
        const { email, phone } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).send({
                success: false,
                message: "User Not Found!",
                errorType: "invalidUser",
            });
        }

        if (phone !== user.phone) {
            return res.status(401).send({
                success: false,
                message: "Mobile Number does not match!",
                errorType: "phoneMismatch",
            });
        }

        const deletedBy = req.user?._id || user._id;
        await softDeleteById(userModel, user._id, deletedBy);
        await trashLinkedEmployee(user, deletedBy);

        res.status(200).send({
            success: true,
            message: TRASH_SUCCESS_MESSAGE,
        });
    } catch (error) {
        console.log("Deactivation Error: " + error);
        res.status(500).send({
            success: false,
            message: "Error in moving account to trash",
            error,
        });
    }
};

// Admin trash user account (soft delete)
export const deactivateUserByAdminController = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).send({
                success: false,
                message: "User ID is required",
            });
        }

        if (String(userId) === String(req.user._id)) {
            return res.status(400).send({
                success: false,
                message: "You cannot trash your own account from the admin panel",
            });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found",
            });
        }

        await softDeleteById(userModel, user._id, req.user._id);
        await trashLinkedEmployee(user, req.user._id);

        res.status(200).send({
            success: true,
            message: TRASH_SUCCESS_MESSAGE,
        });
    } catch (error) {
        console.log("Admin deactivation error: " + error);
        res.status(500).send({
            success: false,
            message: "Error in moving user account to trash",
            error,
        });
    }
};
