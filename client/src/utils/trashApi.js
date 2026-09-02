import axios from 'axios';

export const buildTrashListUrl = (baseUrl, viewMode) => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    const status = viewMode === 'trash' ? 'trash' : 'active';
    return `${baseUrl}${separator}status=${status}`;
};

export const fetchTrashList = async (baseUrl, viewMode) => {
    const url = buildTrashListUrl(baseUrl, viewMode);
    return axios.get(url);
};

export const restoreFromTrash = async (baseUrl, id) => {
    const normalized = baseUrl.replace(/\/$/, '');
    return axios.post(`${normalized}/restore/${id}`);
};

export const isTrashView = (viewMode) => viewMode === 'trash';

export const formatRecordStatus = (record) => record?.recordStatus || (record?.isDeleted ? 'trash' : 'active');

/** Display name for a populated/linked ref; shows "(Trash)" when the linked record is trashed. */
export const formatLinkedLabel = (ref, nameKeys = ['companyName', 'name', 'productName', 'title', 'serviceTitle']) => {
    if (!ref) return '—';
    if (typeof ref === 'string') return ref;
    const name = nameKeys.map((key) => ref[key]).find(Boolean);
    if (!name) return '—';
    return ref.isDeleted || ref.recordStatus === 'trash' ? `${name} (Trash)` : name;
};

export const restoreProductFromTrash = (productId) =>
    axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/product/restore-product`, { productId });
