import ServiceModel from "../models/serviceModel.js";
import RentalModel from "../models/rentalModel.js";
import { findBestEmployeeForEnquiry } from "./enquiryEmployeeMatcher.js";
import { resolveNotificationUserId } from "./resolveNotificationUserId.js";
import { notifyAssignment } from "./expoPushNotification.js";

const assignEnquiryRecord = async (Model, enquiryId, employeeUserId) => {
    const updated = await Model.findByIdAndUpdate(
        enquiryId,
        { employeeId: String(employeeUserId) },
        { new: true }
    );
    if (!updated) {
        return { success: false, enquiryId, reason: "Enquiry not found" };
    }
    return { success: true, enquiry: updated };
};

export const autoAssignServiceEnquiryById = async (
    serviceId,
    employees = null
) => {
    const service = await ServiceModel.findById(serviceId);
    if (!service) {
        return { success: false, enquiryId: serviceId, reason: "Enquiry not found" };
    }

    if (service.employeeId) {
        return {
            success: false,
            enquiryId: serviceId,
            reason: "Enquiry already assigned",
            employeeId: service.employeeId,
        };
    }

    const employee = await findBestEmployeeForEnquiry(
        service,
        "Service",
        ServiceModel,
        employees
    );

    if (!employee) {
        return {
            success: false,
            enquiryId: serviceId,
            reason: "No matching Service employee for pincode",
        };
    }

    const userId = String(employee.userId);
    const result = await assignEnquiryRecord(ServiceModel, serviceId, userId);
    if (!result.success) return { ...result, enquiryId: serviceId };

    return {
        success: true,
        enquiryId: serviceId,
        enquiry: result.enquiry,
        employeeId: userId,
        employeeName: employee.name,
    };
};

export const autoAssignRentalEnquiryById = async (
    rentalId,
    employees = null
) => {
    const rental = await RentalModel.findById(rentalId);
    if (!rental) {
        return { success: false, enquiryId: rentalId, reason: "Enquiry not found" };
    }

    if (rental.employeeId) {
        return {
            success: false,
            enquiryId: rentalId,
            reason: "Enquiry already assigned",
            employeeId: rental.employeeId,
        };
    }

    const employee = await findBestEmployeeForEnquiry(
        rental,
        "Rentals",
        RentalModel,
        employees
    );

    if (!employee) {
        return {
            success: false,
            enquiryId: rentalId,
            reason: "No matching Rentals employee for pincode",
        };
    }

    const userId = String(employee.userId);
    const result = await assignEnquiryRecord(RentalModel, rentalId, userId);
    if (!result.success) return { ...result, enquiryId: rentalId };

    return {
        success: true,
        enquiryId: rentalId,
        enquiry: result.enquiry,
        employeeId: userId,
        employeeName: employee.name,
    };
};

export const notifyEmployeeOfEnquiryAssignment = async (
    employeeUserId,
    enquiries,
    type
) => {
    if (!enquiries?.length) return;

    const userId = await resolveNotificationUserId(employeeUserId);
    if (!userId) return;

    const count = enquiries.length;
    const label = count === 1 ? "1 enquiry" : `${count} enquiries`;
    const isRental = type === "rental";

    notifyAssignment(userId, {
        type: isRental ? "rental_enquiry" : "service_enquiry",
        title: isRental ? "New Rental Enquiry Assigned" : "New Service Enquiry Assigned",
        body: `You have been assigned ${label}`,
        entityId: enquiries[0]?._id,
    }).catch((err) =>
        console.error("Enquiry assignment push failed:", err)
    );
};
