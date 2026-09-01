import ServiceModel from "../../models/serviceModel.js";
import { resolveNotificationUserId } from "../../utils/resolveNotificationUserId.js";
import { notifyAssignment } from "../../utils/expoPushNotification.js";
import { softDeleteById, TRASH_SUCCESS_MESSAGE } from "../../utils/softDelete.js";
import { resolveEnquiryPincode, attachEnquiryPincodes } from "../../utils/resolveEnquiryPincode.js";
import { tryAutoAssignNewServiceEnquiry } from "../../utils/tryAutoAssignNewEnquiry.js";

// Create Service
export const createService = async (req, res) => {
    try {
        const body = { ...req.body };
        body.pincode = await resolveEnquiryPincode(body);
        const service = new ServiceModel(body);
        await service.save();

        await tryAutoAssignNewServiceEnquiry(service);
        const refreshed = await ServiceModel.findById(service._id);
        
        res.status(201).send({
            success: true,
            message: "Service request created successfully",
            service: refreshed || service
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
        const {
            fromDate,
            toDate,
            companyName,
            serviceType,
            status,
            page = 1, // Default to page 1
            limit = 10 // Default to 10 items per page
        } = req.query; // Get parameters from query string

        let findQuery = {};

        // Filter by status (excluding "Completed" and "Cancelled" by default, but allowing override if status is provided)
        if (status) {
            findQuery.status = status;
        } else {
            findQuery.status = { $nin: ["Completed", "Cancelled"] };
        }

        // Filter by companyName (case-insensitive partial match)
        if (companyName) {
            findQuery.companyName = { $regex: companyName, $options: 'i' };
        }

        // Filter by serviceType
        if (serviceType) {
            findQuery.serviceTitle = serviceType; // Assuming serviceType maps to serviceTitle in the model
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

        const limitNum = limit !== undefined && limit !== '' ? parseInt(limit, 10) : 10;
        const pageNum = parseInt(page, 10) || 1;
        const usePagination = limitNum > 0; // limit=0 means return all (no pagination)

        // Calculate skip for pagination (when using limit)
        const skip = usePagination ? (pageNum - 1) * limitNum : 0;

        // Get total count of documents matching the filters (before pagination)
        const totalCount = await ServiceModel.countDocuments(findQuery);

        // Fetch services (with or without pagination: limit=0 or very high means return all)
        let query = ServiceModel.find(findQuery).sort({ createdAt: -1 }).skip(skip);
        if (usePagination) {
            query = query.limit(limitNum);
        }
        const services = await query;
        const servicesWithPincode = await attachEnquiryPincodes(services);
        
        res.status(200).send({
            success: true,
            services: servicesWithPincode,
            totalCount
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

        const previousEmployeeId = service.employeeId ? String(service.employeeId) : "";
        const updatedService = await ServiceModel.findByIdAndUpdate(
            serviceId,
            req.body,
            { new: true }
        );

        const newEmployeeId = req.body.employeeId ? String(req.body.employeeId) : "";
        if (newEmployeeId && newEmployeeId !== previousEmployeeId) {
            const userId = await resolveNotificationUserId(newEmployeeId);
            if (userId) {
                const label = updatedService.companyName || updatedService.serviceTitle || "Service enquiry";
                notifyAssignment(userId, {
                    type: "service_enquiry",
                    title: "New Service Enquiry Assigned",
                    body: `You have been assigned: ${label}`,
                    entityId: updatedService._id,
                }).catch((err) => console.error("Service assignment push failed:", err));
            }
        }

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

        await softDeleteById(ServiceModel, serviceId, req.user?._id);

        res.status(200).send({
            success: true,
            message: TRASH_SUCCESS_MESSAGE
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

