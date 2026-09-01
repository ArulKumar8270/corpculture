import mongoose from 'mongoose';

/**
 * Mongoose plugin for soft delete (trash) support.
 * Adds isDeleted/deletedAt/deletedBy fields and excludes trashed docs from queries by default.
 * Pass { includeDeleted: true } in query options to include trashed documents.
 */
export function softDeletePlugin(schema) {
    schema.add({
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
        deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    });

    const excludeDeleted = function (next) {
        if (this.getOptions().includeDeleted) {
            return next();
        }
        this.where({ isDeleted: { $ne: true } });
        next();
    };

    schema.pre('find', excludeDeleted);
    schema.pre('findOne', excludeDeleted);
    schema.pre('findOneAndUpdate', excludeDeleted);
    schema.pre('countDocuments', excludeDeleted);

    schema.statics.softDeleteById = async function (id, deletedBy = null) {
        return this.findOneAndUpdate(
            { _id: id },
            { isDeleted: true, deletedAt: new Date(), deletedBy },
            { new: true, includeDeleted: true }
        );
    };

    schema.statics.softDeleteOne = async function (filter, deletedBy = null) {
        return this.findOneAndUpdate(
            filter,
            { isDeleted: true, deletedAt: new Date(), deletedBy },
            { new: true, includeDeleted: true }
        );
    };
}
