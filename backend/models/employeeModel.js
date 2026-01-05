import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        designation: {
            type: [String],
        },
        idCradNo: {
            type: String,
        },  
        phone: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        pincode: {
            type: [String],
            trim: true,
        },
        employeeType: {
            type: [String],
            required: true,
            enum: ['Service', 'Sales', "Rentals"], // Restrict values to 'Service', 'Sales', or 'Rentals'
        },
        hireDate: {
            type: Date,
            default: Date.now,
        },
        department: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category"
        }],
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        salary: {
            type: Number,
            min: 0,
        },
        image: {
            type: String,
            trim: true,
        },
        parentName: {
            type: String,
            trim: true,
        },
        parentPhone: {
            type: String,
            trim: true,
        },
        parentAddress: {
            type: String,
            trim: true,
        },
        parentRelation: {
            type: String,
            trim: true,
        },
        idProof: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true } // Adds createdAt and updatedAt timestamps
);

export default mongoose.model("Employee", employeeSchema);