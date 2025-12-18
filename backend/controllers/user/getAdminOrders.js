import orderModel from "../../models/orderModel.js";
import userModel from "../../models/userModel.js";

const getAdminOrders = async (req, res) => {
    try {
        const {
            fromDate,
            toDate,
            buyerName,
            employeeId,
            orderStatus,
            search,
            page = 1, // Default to page 1
            limit = 10 // Default to 10 items per page
        } = req.query; // Get parameters from query string

        let findQuery = {};

        // Filter by orderStatus
        if (orderStatus) {
            findQuery.orderStatus = orderStatus;
        }

        // Filter by employeeId
        if (employeeId) {
            findQuery.employeeId = employeeId;
        }

        // Filter by buyerName (search in buyer's name)
        if (buyerName) {
            const matchingBuyers = await userModel.find({
                name: { $regex: buyerName, $options: 'i' } // Case-insensitive partial match
            }).select('_id');

            const buyerIds = matchingBuyers.map(buyer => buyer._id);

            if (buyerIds.length > 0) {
                findQuery.buyer = { $in: buyerIds };
            } else {
                // If no buyers match the name, no orders will match, so return empty
                return res.status(200).send({ success: true, message: 'No Orders found for the given buyer name', orders: [], totalCount: 0 });
            }
        }

        // Filter by date range (createdAt)
        if (fromDate || toDate) {
            findQuery.createdAt = {};
            if (fromDate) {
                findQuery.createdAt.$gte = new Date(fromDate);
            }
            if (toDate) {
                // Set to the end of the day for the toDate
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                findQuery.createdAt.$lte = endOfDay;
            }
        }

        // Search filter (searches in order ID, buyer name, or address)
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            
            // First, try to find matching buyers
            const matchingBuyers = await userModel.find({
                name: searchRegex
            }).select('_id');

            const buyerIds = matchingBuyers.map(buyer => buyer._id);

            // Build search query
            const searchQuery = {
                $or: [
                    { _id: { $regex: search, $options: 'i' } }, // Search in order ID
                    { 'shippingInfo.address': searchRegex } // Search in address
                ]
            };

            // If we found matching buyers, add them to the search
            if (buyerIds.length > 0) {
                searchQuery.$or.push({ buyer: { $in: buyerIds } });
            }

            // Combine with existing filters
            findQuery = { ...findQuery, ...searchQuery };
        }

        // Calculate skip for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count of documents matching the filters (before pagination)
        const totalCount = await orderModel.countDocuments(findQuery);

        // Fetch orders with pagination and populate necessary fields
        const populatedOrder = await orderModel.find(findQuery)
            .populate("buyer", "name _id")
            .populate({ path: "products.seller", model: userModel })
            .populate("employeeId", "name _id")
            .sort({ createdAt: -1 }) // Sort by creation date, newest first
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).send({
            success: true,
            orders: populatedOrder,
            totalCount
        });
    } catch (error) {
        console.error("Error in getting Orders:", error);
        res.status(500).send({ success: false, message: "Error in getting orders", error: error.message });
    }
};

export default getAdminOrders;
