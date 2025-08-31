import RentalModel from "../../models/rentalModel.js";

// Create Rental
export const createrRental = async (req, res) => {
    try {
        const rental = new RentalModel(req.body);
        await rental.save();
        
        res.status(201).send({
            success: true,
            message: "Rental request created successfully",
            rental
        });
    } catch (error) {
        console.error("Error in rental creation:", error);
        res.status(500).send({
            success: false,
            message: "Error in rental creation",
            error
        });
    }
};

// Get All Services
export const getAllRental = async (req, res) => {
    try {
        const rental = await RentalModel.find({status: { $nin: ["Completed", "Cancelled"] }}).sort({ createdAt: -1 });
        res.status(200).send({
            success: true,
            rental
        });
    } catch (error) {
        console.error("Error in getting rental:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting rental",
            error
        });
    }
};

// Get Single Rental
export const getRentalById = async (req, res) => {
    try {
        const rentalId = req.params.id;
        const rental = await RentalModel.findById(rentalId);
        
        if (!rental) {
            return res.status(404).send({
                success: false,
                message: "Rental not found",
                errorType: "rentalNotFound"
            });
        }

        res.status(200).send({
            success: true,
            rental
        });
    } catch (error) {
        console.error("Error in getting rental:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting rental",
            error
        });
    }
};


// Get Service by assignedTo
export const getRentalAssignedTo = async (req, res) => {
    try {
        const { assignedTo } = req.params; // Assuming phone is passed as a URL parameter

        if (!assignedTo) {
            return res.status(400).send({
                success: false,
                message: "assignedTo is required",
                errorType: "missingParameter"
            });
        }

        const rental = await RentalModel.find({ employeeId: assignedTo, status: { $nin: ["Completed", "Cancelled"] } }).sort({ createdAt: -1 }); // Find services by phone number

        if (!rental || rental.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No rental found for this assignedTo",
                errorType: "servicesNotFound"
            });
        }

        res.status(200).send({
            success: true,
            rental
        });
    } catch (error) {
        console.error("Error in getting rental by phone:", error); // Log the error
        res.status(500).send({
            success: false,
            message: "Error in getting rental by phone",
            error
        });
    }
};

// Update Rental
export const updateRental = async (req, res) => {
    try {
        const rentalId = req.params.id;
        const rental = await RentalModel.findById(rentalId);

        if (!rental) {
            return res.status(404).send({
                success: false,
                message: "Rental not found",
                errorType: "rentalNotFound"
            });
        }

        const updatedRental = await RentalModel.findByIdAndUpdate(
            rentalId,
            req.body,
            { new: true }
        );

        res.status(200).send({
            success: true,
            message: "Rental updated successfully",
            rental: updatedRental
        });
    } catch (error) {
        console.error("Error in updating rental:", error);
        res.status(500).send({
            success: false,
            message: "Error in updating rental",
            error
        });
    }
};

// Delete Rental
export const deleteRental = async (req, res) => {
    try {
        const rentalId = req.params.id;
        const rental = await RentalModel.findById(rentalId);

        if (!rental) {
            return res.status(404).send({
                success: false,
                message: "Rental not found",
                errorType: "RentalNotFound"
            });
        }

        await RentalModel.findByIdAndDelete(rentalId);

        res.status(200).send({
            success: true,
            message: "Rental deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleting rental:", error);
        res.status(500).send({
            success: false,
            message: "Error in deleting rental",
            error
        });
    }
};

// Get Rental by Phone Number
export const getRentalByPhone = async (req, res) => {
    try {
        const { phone } = req.params; // Assuming phone is passed as a URL parameter

        if (!phone) {
            return res.status(400).send({
                success: false,
                message: "Phone number is required",
                errorType: "missingParameter"
            });
        }

        const rental = await RentalModel.find({ phone: phone }).sort({ createdAt: -1 }); // Find rental by phone number

        if (!rental || rental.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No rental found for this phone number",
                errorType: "rentalsNotFound"
            });
        }

        res.status(200).send({
            success: true,
            rental
        });
    } catch (error) {
        console.error("Error in getting rental by phone:", error); // Log the error
        res.status(500).send({
            success: false,
            message: "Error in getting rental by phone",
            error
        });
    }
};

// Get Rental by Rental Type
export const getRentalByType = async (req, res) => {
    try {
        const { rentalType } = req.params; // Assuming rentalType is passed as a URL parameter

        if (!rentalType) {
            return res.status(400).send({
                success: false,
                message: "Rental type is required",
                errorType: "missingParameter"
            });
        }

        const rental = await RentalModel.find({ rentalType: rentalType, status: { $nin: ["Completed", "Cancelled"] } }).sort({ createdAt: -1 });

        if (!rental || rental.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No rental found for this rental type",
                errorType: "rentalNotFound"
            });
        }

        res.status(200).send({
            success: true,
            rental
        });
    } catch (error) {
        console.error("Error in getting rental by rental type:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting rental by rental type",
            error
        });
    }
};

