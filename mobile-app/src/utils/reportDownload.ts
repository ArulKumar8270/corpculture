export const REPORT_DOWNLOAD_BASE_URL =
  'https://pub-109709bff58d46faa2a7782c9bf60324.r2.dev';

function isLikelyImageLink(url: string): boolean {
  const path = String(url || '').split(/[?#]/)[0].toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp|heic|heif)(\/)?$/i.test(path);
}

export function collectReportDownloadCandidates(report: any): string[] {
  const id = report?.serviceId ? String(report.serviceId) : '';
  const ordered: string[] = [];
  const push = (url: string) => {
    const trimmed = String(url || '').trim();
    if (!trimmed || ordered.includes(trimmed)) return;
    ordered.push(trimmed);
  };

  if (id) {
    push(`${REPORT_DOWNLOAD_BASE_URL}/${id}`);
    push(`${REPORT_DOWNLOAD_BASE_URL}/${id}.pdf`);
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

export async function openReportDownload(report: any): Promise<string | null> {
  const candidates = collectReportDownloadCandidates(report);
  if (candidates.length === 0) return null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return url;
    } catch {
      /* try next */
    }
  }

  return candidates[0];
}
