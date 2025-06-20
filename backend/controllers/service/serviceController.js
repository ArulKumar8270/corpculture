import ServiceModel from "../../models/serviceModel.js";

// Create Service
export const createService = async (req, res) => {
    try {
        const service = new ServiceModel(req.body);
        await service.save();
        
        res.status(201).send({
            success: true,
            message: "Service request created successfully",
            service
        });
    } catch (error) {
        console.error("Error in service creation:", error);
        res.status(500).send({
            success: false,
            message: "Error in service creation",
            error
        });
    }
};

// Get All Services
export const getAllServices = async (req, res) => {
    try {
        const services = await ServiceModel.find({}).sort({ createdAt: -1 });
        res.status(200).send({
            success: true,
            services
        });
    } catch (error) {
        console.error("Error in getting services:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting services",
            error
        });
    }
};

// Get Single Service
export const getServiceById = async (req, res) => {
    try {
        const serviceId = req.params.id;
        const service = await ServiceModel.findById(serviceId);
        
        if (!service) {
            return res.status(404).send({
                success: false,
                message: "Service not found",
                errorType: "serviceNotFound"
            });
        }

        res.status(200).send({
            success: true,
            service
        });
    } catch (error) {
        console.error("Error in getting service:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting service",
            error
        });
    }
};

// Update Service
export const updateService = async (req, res) => {
    try {
        const serviceId = req.params.id;
        const service = await ServiceModel.findById(serviceId);

        if (!service) {
            return res.status(404).send({
                success: false,
                message: "Service not found",
                errorType: "serviceNotFound"
            });
        }

        const updatedService = await ServiceModel.findByIdAndUpdate(
            serviceId,
            req.body,
            { new: true }
        );

        res.status(200).send({
            success: true,
            message: "Service updated successfully",
            service: updatedService
        });
    } catch (error) {
        console.error("Error in updating service:", error);
        res.status(500).send({
            success: false,
            message: "Error in updating service",
            error
        });
    }
};

// Delete Service
export const deleteService = async (req, res) => {
    try {
        const serviceId = req.params.id;
        const service = await ServiceModel.findById(serviceId);

        if (!service) {
            return res.status(404).send({
                success: false,
                message: "Service not found",
                errorType: "serviceNotFound"
            });
        }

        await ServiceModel.findByIdAndDelete(serviceId);

        res.status(200).send({
            success: true,
            message: "Service deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleting service:", error);
        res.status(500).send({
            success: false,
            message: "Error in deleting service",
            error
        });
    }
};

// Get Service by Phone Number {{ edit_1 }}
export const getServiceByPhone = async (req, res) => { // {{ edit_1 }}
    try { // {{ edit_1 }}
        const { phone } = req.params; // Assuming phone is passed as a URL parameter {{ edit_1 }}

        if (!phone) { // {{ edit_1 }}
            return res.status(400).send({ // {{ edit_1 }}
                success: false, // {{ edit_1 }}
                message: "Phone number is required", // {{ edit_1 }}
                errorType: "missingParameter" // {{ edit_1 }}
            }); // {{ edit_1 }}
        } // {{ edit_1 }}

        const services = await ServiceModel.find({ phone: phone }).sort({ createdAt: -1 }); // Find services by phone number {{ edit_1 }}

        if (!services || services.length === 0) { // {{ edit_1 }}
            return res.status(404).send({ // {{ edit_1 }}
                success: false, // {{ edit_1 }}
                message: "No services found for this phone number", // {{ edit_1 }}
                errorType: "servicesNotFound" // {{ edit_1 }}
            }); // {{ edit_1 }}
        } // {{ edit_1 }}

        res.status(200).send({ // {{ edit_1 }}
            success: true, // {{ edit_1 }}
            services // {{ edit_1 }}
        }); // {{ edit_1 }}
    } catch (error) { // {{ edit_1 }}
        console.error("Error in getting services by phone:", error); // Log the error {{ edit_1 }}
        res.status(500).send({ // {{ edit_1 }}
            success: false, // {{ edit_1 }}
            message: "Error in getting services by phone", // {{ edit_1 }}
            error // {{ edit_1 }}
        }); // {{ edit_1 }}
    } // {{ edit_1 }}
}; // {{ edit_1 }}