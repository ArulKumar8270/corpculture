import { Linking } from 'react-native';

export const REPORT_DOWNLOAD_BASE_URL =
  'https://pub-109709bff58d46faa2a7782c9bf60324.r2.dev';

function isLikelyImageLink(url: string): boolean {
  const path = String(url || '').split(/[?#]/)[0].toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp|heic|heif)(\/)?$/i.test(path);
}

function reportDocumentId(report: any): string {
  // Match web: official R2 path is `/{report._id}` (service + rental reports).
  const raw = report?._id ?? report?.id;
  if (raw == null || raw === '') return '';
  if (typeof raw === 'object') {
    return String((raw as { _id?: string })._id || raw).trim();
  }
  return String(raw).trim();
}

/** Official service/rental report PDF download URLs (R2 by report id, then stored links). */
export function collectReportDownloadCandidates(
  report: any,
  downloadBaseUrl: string = REPORT_DOWNLOAD_BASE_URL
): string[] {
  const id = reportDocumentId(report);
  const ordered: string[] = [];
  const push = (url: string) => {
    const trimmed = String(url || '').trim();
    if (!trimmed || ordered.includes(trimmed)) return;
    ordered.push(trimmed);
  };

  if (id) {
    push(`${downloadBaseUrl}/${id}`);
    push(`${downloadBaseUrl}/${id}.pdf`);
  }

  const links: string[] = Array.isArray(report?.reportLink)
    ? (report.reportLink as unknown[])
        .map((x) => String(x || '').trim())
        .filter((s): s is string => s.length > 0)
    : [];

  const docLinks = links.filter((link) => !isLikelyImageLink(link));
  for (const link of docLinks) {
    if (/\.pdf(\?|#|$)/i.test(link)) push(link);
  }
  for (const link of docLinks) {
    push(link);
  }

  return ordered;
}

async function urlLooksAvailable(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (head.ok) return true;
  } catch {
    /* some R2/public buckets reject HEAD; try a ranged GET */
  }

  try {
    const ranged = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    });
    return ranged.ok || ranged.status === 206;
  } catch {
    return false;
  }
}

export async function openReportDownload(report: any): Promise<string | null> {
  const candidates = collectReportDownloadCandidates(report);
  if (candidates.length === 0) return null;

  for (const url of candidates) {
    if (await urlLooksAvailable(url)) return url;
  }

  return null;
}

export async function downloadReportAndOpen(report: any): Promise<boolean> {
  const url = await openReportDownload(report);
  if (!url) return false;
  await Linking.openURL(url);
  return true;
}
