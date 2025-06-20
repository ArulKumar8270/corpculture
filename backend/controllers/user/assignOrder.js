import orderModel from "../../models/orderModel.js";
import userModel from "../../models/userModel.js";

const assignOrder = async (req, res) => {
    try {
        const { employeeId, orderId } = req.body; // orderId is now expected to be an array

        if (!Array.isArray(orderId) || orderId.length === 0) { // {{ edit_1 }}
            return res.status(400).send({ // {{ edit_1 }}
                success: false, // {{ edit_1 }}
                message: "orderId must be a non-empty array", // {{ edit_1 }}
            }); // {{ edit_1 }}
        } // {{ edit_1 }}

        const updatedOrders = []; // To store successfully updated orders // {{ edit_1 }}
        const failedOrders = []; // To store order IDs that failed to update // {{ edit_1 }}

        // Iterate through each orderId in the array
        for (const id of orderId) { // {{ edit_1 }}
            try { // {{ edit_1 }}
                // Update the order document to assign the employee
                const updatedOrder = await orderModel.findByIdAndUpdate( // {{ edit_1 }}
                    id, // Use the current order ID from the array // {{ edit_1 }}
                    { employeeId: employeeId }, // {{ edit_1 }}
                    { new: true } // {{ edit_1 }}
                ); // {{ edit_1 }}

                if (updatedOrder) { // {{ edit_1 }}
                    updatedOrders.push(updatedOrder); // Add to success list // {{ edit_1 }}
                    // Add the orderId to the employee's assignedOrders array
                    // Using $addToSet to avoid duplicates and updating the employee document once per order
                    // Alternatively, you could collect all orderIds and update the employee once after the loop
                    await userModel.findByIdAndUpdate( // {{ edit_1 }}
                        employeeId, // {{ edit_1 }}
                        { $addToSet: { assignedOrders: id } } // Add the current order ID // {{ edit_1 }}
                        // { new: true } // No need to get the updated employee object in the loop // {{ edit_1 }}
                    ); // {{ edit_1 }}
                } else { // {{ edit_1 }}
                    failedOrders.push(id); // Add to failed list if order not found // {{ edit_1 }}
                    console.warn(`Order with ID ${id} not found for update.`); // {{ edit_1 }}
                } // {{ edit_1 }}
            } catch (updateError) { // {{ edit_1 }}
                failedOrders.push(id); // Add to failed list on error // {{ edit_1 }}
                console.error(`Error updating order ${id}:`, updateError); // {{ edit_1 }}
            } // {{ edit_1 }}
        } // {{ edit_1 }}

        // Determine the response based on results
        if (updatedOrders.length > 0 && failedOrders.length === 0) { // {{ edit_1 }}
            // All orders updated successfully // {{ edit_1 }}
            res.status(200).send({ // {{ edit_1 }}
                success: true, // {{ edit_1 }}
                message: "All orders assigned and employee updated successfully", // {{ edit_1 }}
                updatedOrders: updatedOrders, // {{ edit_1 }}
            }); // {{ edit_1 }}
        } else if (updatedOrders.length > 0 && failedOrders.length > 0) { // {{ edit_1 }}
            // Some orders updated, some failed // {{ edit_1 }}
            res.status(207).send({ // 207 Multi-Status // {{ edit_1 }}
                success: false, // Indicate partial success/failure // {{ edit_1 }}
                message: "Some orders failed to update", // {{ edit_1 }}
                updatedOrders: updatedOrders, // {{ edit_1 }}
                failedOrders: failedOrders, // {{ edit_1 }}
            }); // {{ edit_1 }}
        } else { // {{ edit_1 }}
            // All orders failed to update // {{ edit_1 }}
            res.status(500).send({ // {{ edit_1 }}
                success: false, // {{ edit_1 }}
                message: "Failed to update any orders", // {{ edit_1 }}
                failedOrders: failedOrders, // {{ edit_1 }}
            }); // {{ edit_1 }}
        } // {{ edit_1 }}

    } catch (error) {
        console.error("Error in assigning orders:", error); // {{ edit_1 }}
        res.status(500).send({ // {{ edit_1 }}
            success: false, // {{ edit_1 }}
            message: "Internal server error during order assignment", // {{ edit_1 }}
            error: error.message, // {{ edit_1 }}
        }); // {{ edit_1 }}
    }
};

export default assignOrder;
