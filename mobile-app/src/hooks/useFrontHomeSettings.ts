import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { getApiBaseUrl } from '../services/api';
import {
  DEFAULT_FRONT_HOME_SETTINGS,
  FrontHomeSettings,
} from '../types/frontHomeSettings';
import { getServiceColor, getServiceIconName, PRODUCT_BADGE_COLORS } from '../utils/serviceIconMap';

const FALLBACK_BANNERS = [
  { id: '1', image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
  { id: '2', image: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
  { id: '3', image: 'https://images.pexels.com/photos/163117/airplane-flight-sky-clouds-163117.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
];

const FALLBACK_OFFERS = [
  {
    id: '1',
    title: 'Rental',
    description: 'Equipment and asset rental solutions.',
    image: 'https://images.pexels.com/photos/5834/nature-grass-leaf-green.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    color: '#34C759',
    discount: '25% OFF',
    type: 'rental',
  },
  {
    id: '2',
    title: 'Credit',
    description: 'Flexible credit for company customers.',
    image: 'https://images.pexels.com/photos/3747139/pexels-photo-3747139.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    color: '#7c3aed',
    discount: '25% OFF',
    type: 'credit',
  },
  {
    id: '3',
    title: 'AMC / AMLC',
    description: 'Annual maintenance contracts.',
    image: 'https://images.pexels.com/photos/5834/nature-grass-leaf-green.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    color: '#0284c7',
    discount: '25% OFF',
    type: 'amc',
  },
];

const FALLBACK_SERVICES = [
  { id: '1', title: 'AC Service', description: 'Professional AC installation, repair and maintenance', icon: 'ac-unit', color: '#EF4444' },
  { id: '2', title: 'Printer Service', description: 'Expert printer repair and maintenance', icon: 'print', color: '#A855F7' },
  { id: '3', title: 'Toner & Cartridge', description: 'Quality toner and cartridge refill', icon: 'inventory', color: '#F59E0B' },
  { id: '4', title: 'Waterproof & Paint', description: 'Waterproofing and painting solutions', icon: 'format-paint', color: '#84CC16' },
  { id: '5', title: 'Mobile Service', description: 'Mobile repair and maintenance', icon: 'phone-android', color: '#06B6D4' },
  { id: '6', title: 'Computer Service', description: 'Computer repair and support', icon: 'computer', color: '#9333EA' },
  { id: '7', title: 'CCTV/Camera Fixing', description: 'CCTV installation and maintenance', icon: 'videocam', color: '#8B5CF6' },
];

const FALLBACK_PRODUCTS = [
  { id: '1', title: 'Foods', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800', badgeColor: '#EF4444', status: 'COMING SOON', categorySlug: '' },
  { id: '2', title: 'Events Management', image: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800', badgeColor: '#9333EA', status: 'COMING SOON', categorySlug: '' },
  { id: '3', title: 'Printer & Toner', image: 'https://images.pexels.com/photos/3843284/pexels-photo-3843284.jpeg?auto=compress&cs=tinysrgb&w=800', badgeColor: '#84CC16', status: 'COMING SOON', categorySlug: '' },
];

export function useFrontHomeSettings() {
  const [settings, setSettings] = useState<FrontHomeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${getApiBaseUrl()}/front-home-settings`);
      if (data?.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.warn('Front home settings fetch failed, using defaults', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [fetchSettings])
  );

  const effective = useMemo(
    () => ({
      ...DEFAULT_FRONT_HOME_SETTINGS,
      ...settings,
      theme: { ...DEFAULT_FRONT_HOME_SETTINGS.theme, ...settings?.theme },
      logo: { ...DEFAULT_FRONT_HOME_SETTINGS.logo, ...settings?.logo },
      banner: { ...DEFAULT_FRONT_HOME_SETTINGS.banner, ...settings?.banner },
      sales: { ...DEFAULT_FRONT_HOME_SETTINGS.sales, ...settings?.sales },
      service: { ...DEFAULT_FRONT_HOME_SETTINGS.service, ...settings?.service },
      categorySearch: {
        ...DEFAULT_FRONT_HOME_SETTINGS.categorySearch,
        ...settings?.categorySearch,
      },
    }),
    [settings]
  );

  const bannerData = useMemo(() => {
    const slides = (effective.banner?.slides || []).filter(
      (s) => s.active !== false && s.imageUrl
    );
    if (slides.length) {
      return [...slides]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((s, i) => ({ id: String(i), image: s.imageUrl as string }));
    }
    return FALLBACK_BANNERS;
  }, [effective.banner?.slides]);

  const bannerHeight = effective.banner?.mobileHeight ?? 200;

  const serviceCategories = useMemo(() => {
    const items = (effective.offerCategories || [])
      .filter((o) => o.visible !== false)
      .filter((o) => {
        if (o.category?.toLowerCase() === 'credit' && !effective.sales?.creditOptionEnabled) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (!items.length) return FALLBACK_OFFERS;

    return items.map((o) => ({
      id: o.id,
      title: o.category,
      description: o.description || '',
      image: o.image || '',
      color: o.themeColor || '#019ee3',
      discount: o.discount || '',
      type: o.category?.toLowerCase() === 'credit' ? 'credit' : o.id,
    }));
  }, [effective.offerCategories, effective.sales?.creditOptionEnabled]);

  const services = useMemo(() => {
    const items = (effective.services || [])
      .filter((s) => s.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (!items.length) return FALLBACK_SERVICES;

    return items.map((s, i) => ({
      id: s.id,
      title: s.title,
      description: s.description || '',
      icon: getServiceIconName(s.iconKey),
      color: getServiceColor(s.iconKey, i),
      imageUrl: s.imageUrl,
    }));
  }, [effective.services]);

  const products = useMemo(() => {
    const items = (effective.homeProducts || [])
      .filter((p) => p.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (!items.length) return FALLBACK_PRODUCTS;

    return items.map((p, i) => ({
      id: p.id,
      title: p.title,
      image: p.image || '',
      badgeColor: PRODUCT_BADGE_COLORS[i % PRODUCT_BADGE_COLORS.length],
      status: p.status || 'COMING SOON',
      categorySlug: p.categorySlug,
    }));
  }, [effective.homeProducts]);

  const categoryBanners = useMemo(
    () =>
      (effective.categoryBanners || [])
        .filter((b) => b.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [effective.categoryBanners]
  );

  return {
    loading,
    settings: effective,
    rawSettings: settings,
    refresh: fetchSettings,
    theme: effective.theme,
    logo: effective.logo,
    bannerData,
    bannerHeight,
    serviceCategories,
    services,
    products,
    categoryBanners,
    serviceDefaultImage: effective.serviceDefaultImage || '',
    rentalDefaultImage: effective.rentalDefaultImage || '',
    sales: effective.sales,
    serviceSettings: effective.service,
    categorySearch: effective.categorySearch,
  };
}
