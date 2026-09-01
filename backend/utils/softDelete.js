/**
 * Soft-delete (trash) a document by ID.
 * @param {import('mongoose').Model} Model
 * @param {string} id
 * @param {string|null} deletedBy - user id performing the trash action
 * @returns {Promise<import('mongoose').Document|null>}
 */
export const softDeleteById = async (Model, id, deletedBy = null) => {
    if (typeof Model.softDeleteById === 'function') {
        return Model.softDeleteById(id, deletedBy);
    }
    return Model.findOneAndUpdate(
        { _id: id },
        { isDeleted: true, deletedAt: new Date(), deletedBy },
        { new: true, includeDeleted: true }
    );
};

/**
 * Soft-delete (trash) a document by filter.
 * @param {import('mongoose').Model} Model
 * @param {object} filter
 * @param {string|null} deletedBy
 * @returns {Promise<import('mongoose').Document|null>}
 */
export const softDeleteOne = async (Model, filter, deletedBy = null) => {
    if (typeof Model.softDeleteOne === 'function') {
        return Model.softDeleteOne(filter, deletedBy);
    }
    return Model.findOneAndUpdate(
        filter,
        { isDeleted: true, deletedAt: new Date(), deletedBy },
        { new: true, includeDeleted: true }
    );
};

export const TRASH_SUCCESS_MESSAGE = 'Moved to trash successfully';
