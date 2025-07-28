import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    customerType: {
        type: String,
        required: false,
        enum: ['New', "Existing"] // You can add more customer types here
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
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
        required: true
    },
    locationDetail: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Company", companySchema);