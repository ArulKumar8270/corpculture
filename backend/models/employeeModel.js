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
        phone: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        employeeType: {
            type: String,
            required: true,
            enum: ['Service', 'Sales'], // Restrict values to 'Service' or 'Sales'
        },
        hireDate: {
            type: Date,
            default: Date.now,
        },
        department: {
            type: String,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        salary: {
            type: Number,
            min: 0,
        },
    },
    { timestamps: true } // Adds createdAt and updatedAt timestamps
);

export default mongoose.model("Employee", employeeSchema);