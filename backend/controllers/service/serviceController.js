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
        const services = await ServiceModel.find({status: { $nin: ["Completed", "Cancelled"] }}).sort({ createdAt: -1 });
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

// Get Service by Phone Number
export const getServiceByPhone = async (req, res) => {
    try {
        const { phone } = req.params; // Assuming phone is passed as a URL parameter

        if (!phone) {
            return res.status(400).send({
                success: false,
                message: "Phone number is required",
                errorType: "missingParameter"
            });
        }

        // Changed to use regex for partial matching
        const services = await ServiceModel.find({ phone: { $regex: phone, $options: 'i' } }).sort({ createdAt: -1 });

        if (!services || services.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No services found for this phone number",
                errorType: "servicesNotFound"
            });
        }

        res.status(200).send({
            success: true,
            services
        });
    } catch (error) {
        console.error("Error in getting services by phone:", error); // Log the error
        res.status(500).send({
            success: false,
            message: "Error in getting services by phone",
            error
        });
    }
};

// Get Service by assignedTo
export const getServiceAssignedTo = async (req, res) => {
    try {
        const { assignedTo } = req.params; // Assuming phone is passed as a URL parameter

        if (!assignedTo) {
            return res.status(400).send({
                success: false,
                message: "assignedTo is required",
                errorType: "missingParameter"
            });
        }

        // Find services by employeeId, excluding those with status 'Completed' or 'Cancelled'
        const services = await ServiceModel.find({ 
            employeeId: assignedTo,
            status: { $nin: ["Completed", "Cancelled"] } 
        }).sort({ createdAt: -1 });

        if (!services || services.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No services found for this phone number",
                errorType: "servicesNotFound"
            });
        }

        res.status(200).send({
            success: true,
            services
        });
    } catch (error) {
        console.error("Error in getting services by phone:", error); // Log the error
        res.status(500).send({
            success: false,
            message: "Error in getting services by phone",
            error
        });
    }
};

// Get Service by Service Type
export const getServiceByType = async (req, res) => {
    try {
        const { serviceType } = req.params; // Assuming serviceType is passed as a URL parameter

        if (!serviceType) {
            return res.status(400).send({
                success: false,
                message: "Service type is required",
                errorType: "missingParameter"
            });
        }

        const services = await ServiceModel.find({ serviceType: serviceType, status: { $nin: ["Completed", "Cancelled"] } }).sort({ createdAt: -1 });

        if (!services || services.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No services found for this service type",
                errorType: "servicesNotFound"
            });
        }

        res.status(200).send({
            success: true,
            services
        });
    } catch (error) {
        console.error("Error in getting services by service type:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting services by service type",
            error
        });
    }
};

