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
    complaint: {
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
    companyId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    location: {
        type: String,
        required: false
    },
    serviceType: {
        type: String,
        required: true
    },
    oldServiceId: {
        type: String,
        required: false
    },
    serviceImage : {
        type: String,
        required: false
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