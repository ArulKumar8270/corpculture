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

/**
 * Restore a trashed document by ID.
 * @param {import('mongoose').Model} Model
 * @param {string} id
 * @returns {Promise<import('mongoose').Document|null>}
 */
export const restoreById = async (Model, id) => {
    if (typeof Model.restoreById === 'function') {
        return Model.restoreById(id);
    }
    return Model.findOneAndUpdate(
        { _id: id, isDeleted: true },
        { isDeleted: false, deletedAt: null, deletedBy: null },
        { new: true, includeDeleted: true }
    );
};

/**
 * Restore a trashed document by filter.
 * @param {import('mongoose').Model} Model
 * @param {object} filter
 * @returns {Promise<import('mongoose').Document|null>}
 */
export const restoreOne = async (Model, filter) => {
    if (typeof Model.restoreOne === 'function') {
        return Model.restoreOne(filter);
    }
    return Model.findOneAndUpdate(
        { ...filter, isDeleted: true },
        { isDeleted: false, deletedAt: null, deletedBy: null },
        { new: true, includeDeleted: true }
    );
};

/** Parse ?status=trash or ?trashed=true from list requests. */
export const parseTrashStatusQuery = (req) => {
    const status = String(req.query.status || req.query.trashed || '').toLowerCase();
    if (status === 'trash' || status === 'trashed' || status === 'true') {
        return 'trash';
    }
    return 'active';
};

/** Build filter + mongoose options for listing active vs trashed records. */
export const getTrashListQuery = (req, baseFilter = {}) => {
    const viewStatus = parseTrashStatusQuery(req);
    if (viewStatus === 'trash') {
        return {
            filter: { ...baseFilter, isDeleted: true },
            options: { includeDeleted: true },
            viewStatus,
        };
    }
    return {
        filter: baseFilter,
        options: {},
        viewStatus,
    };
};

/** Attach recordStatus (active | trash) without overwriting business status fields. */
export const withRecordStatus = (doc) => {
    if (!doc) return doc;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    obj.recordStatus = obj.isDeleted ? 'trash' : 'active';
    return obj;
};

export const mapWithRecordStatus = (docs) => docs.map(withRecordStatus);

export const TRASH_SUCCESS_MESSAGE = 'Moved to trash successfully';
export const RESTORE_SUCCESS_MESSAGE = 'Restored from trash successfully';

/** Mongoose query options — include trashed docs when resolving linked/reference records. */
export const LINKED_REF_QUERY_OPTIONS = { includeDeleted: true };

/** Run a find while including trashed linked records (for manual ref lookups, not list endpoints). */
export const findLinkedRefs = (Model, filter) =>
    Model.find(filter).setOptions(LINKED_REF_QUERY_OPTIONS);

export const findOneLinkedRef = (Model, filter) =>
    Model.findOne(filter).setOptions(LINKED_REF_QUERY_OPTIONS);

export const findLinkedRefById = (Model, id) =>
    Model.findById(id).setOptions(LINKED_REF_QUERY_OPTIONS);
