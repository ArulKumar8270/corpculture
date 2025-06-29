import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // The user who is assigned the commission
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', // Reference to the order this commission is based on
        required: true
    },
    commissionAmount: {
        type: Number,
        required: true
    },
    percentageRate: {
        type: Number,
        required: function () {
            return this.commissionType === 'percentage';
        }
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Commission", commissionSchema);
