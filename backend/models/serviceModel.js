import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    customerType: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    customerComplaint: {
        type: String,
        required: false // Optional as marked in the form
    },
    contactPerson: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    addressDetail: {
        type: String,
        required: false
    },
    employeeId : {
        type: String,
        required: false
    },
    location: {
        type: String,
        required: false
    },
    serviceType: {
        type: String,
        required: true
    },
    serviceTitle : {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ["Pending", "In Progress", "Completed", "Cancelled"],
        default: "Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Service", serviceSchema);