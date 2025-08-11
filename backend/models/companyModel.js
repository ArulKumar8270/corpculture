import mongoose from "mongoose";

const contactPersonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
}, { _id: false }); // _id: false to prevent Mongoose from adding _id to subdocuments

const deliveryAddressSchema = new mongoose.Schema({
    address: { type: String, required: true },
    pincode: { type: String, required: true },
}, { _id: false }); // _id: false to prevent Mongoose from adding _id to subdocuments


const companySchema = new mongoose.Schema({
    customerType: {
        type: String,
        required: false,
        enum: ['New', "Existing"],
        default: "New" // You can add more customer types here
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    billingAddress: {
        type: String,
        required: true
    },
    serviceDeliveryAddresses: [deliveryAddressSchema],
    invoiceType: {
        type: String,
        required: true,
        default: 'Corpculture Invoice'
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    gstNo: {
        type: String,
        required: false // GST No can be optional
    },
    contactPersons: [contactPersonSchema], // Array of embedded contact person objects
    customerComplaint: {
        type: String,
        required: false // Optional as marked in the form
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Company", companySchema);