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