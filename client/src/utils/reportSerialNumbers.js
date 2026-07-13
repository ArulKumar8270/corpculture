/** Ignore empty / placeholder serial values saved during data entry. */
export const isPlaceholderSerial = (value) => {
    const v = String(value ?? '').trim();
    if (!v || v === '—' || v === 'N/A' || v === '-') return true;
    if (/^x+$/i.test(v)) return true;
    return false;
};

/** Collect serial numbers from report-level and material line items. */
export const collectReportSerialNumbers = (report) => {
    if (!report || typeof report !== 'object') return '—';

    const serials = new Set();
    const add = (value) => {
        const v = String(value ?? '').trim();
        if (!isPlaceholderSerial(v)) serials.add(v);
    };

    (report.materialGroups || []).forEach((group) => {
        add(group?.serialNo);
        (group?.products || []).forEach((product) => add(product?.serialNo));
    });

    (report.materials || []).forEach((material) => add(material?.serialNo));

    add(report.serialNo);

    return serials.size > 0 ? Array.from(serials).join(', ') : '—';
};

import { REPORT_TYPE_LABELS } from './reportNavigation';

export const formatReportTypeLabel = (type) =>
    REPORT_TYPE_LABELS[type] ||
    String(type || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    'Report';
