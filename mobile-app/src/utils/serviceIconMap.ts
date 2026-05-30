/** Maps web Lucide icon keys to MaterialIcons names used in the mobile app. */
export const SERVICE_ICON_MAP: Record<string, string> = {
  AirVent: 'ac-unit',
  Printer: 'print',
  BookOpen: 'inventory',
  PaintBucket: 'format-paint',
  Smartphone: 'phone-android',
  Monitor: 'computer',
  Camera: 'videocam',
};

export const SERVICE_COLOR_MAP: Record<string, string> = {
  AirVent: '#EF4444',
  Printer: '#A855F7',
  BookOpen: '#F59E0B',
  PaintBucket: '#84CC16',
  Smartphone: '#06B6D4',
  Monitor: '#9333EA',
  Camera: '#8B5CF6',
};

export const PRODUCT_BADGE_COLORS = [
  '#EF4444',
  '#9333EA',
  '#84CC16',
  '#8B5CF6',
  '#2563EB',
  '#6B7280',
];

export const getServiceIconName = (iconKey?: string) =>
  SERVICE_ICON_MAP[iconKey || ''] || 'build';

export const getServiceColor = (iconKey?: string, index = 0) =>
  SERVICE_COLOR_MAP[iconKey || ''] || PRODUCT_BADGE_COLORS[index % PRODUCT_BADGE_COLORS.length];
