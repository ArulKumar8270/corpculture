import axios from 'axios';
import { getApiBaseUrl } from '../services/api';

export type TrashViewMode = 'active' | 'trash';

export const buildTrashListUrl = (path: string, viewMode: TrashViewMode) => {
    const base = `${getApiBaseUrl()}${path}`;
    const separator = base.includes('?') ? '&' : '?';
    const status = viewMode === 'trash' ? 'trash' : 'active';
    return `${base}${separator}status=${status}`;
};

export const buildTrashedListUrl = (path: string) => {
    const base = `${getApiBaseUrl()}${path}`;
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}trashed=true`;
};

export const restoreFromTrash = (path: string, id: string, token?: string) => {
    const normalized = path.replace(/\/$/, '');
    return axios.post(`${getApiBaseUrl()}${normalized}/restore/${id}`, {}, {
        headers: token ? { Authorization: token } : undefined,
    });
};

export const restoreProductFromTrash = (productId: string, token?: string) =>
    axios.post(`${getApiBaseUrl()}/product/restore-product`, { productId }, {
        headers: token ? { Authorization: token } : undefined,
    });

export const restoreUserFromTrash = (userId: string, token?: string) =>
    axios.post(`${getApiBaseUrl()}/auth/restore-user`, { userId }, {
        headers: token ? { Authorization: token } : undefined,
    });

export const isTrashView = (viewMode: TrashViewMode) => viewMode === 'trash';

/** Display name for a populated/linked ref; shows "(Trash)" when the linked record is trashed. */
export const formatLinkedLabel = (
    ref: any,
    nameKeys: string[] = ['companyName', 'name', 'productName', 'title', 'serviceTitle']
) => {
    if (!ref) return '—';
    if (typeof ref === 'string') return ref;
    const name = nameKeys.map((key) => ref[key]).find(Boolean);
    if (!name) return '—';
    return ref.isDeleted || ref.recordStatus === 'trash' ? `${name} (Trash)` : name;
};
