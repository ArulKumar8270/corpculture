export interface FrontHomeSettings {
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    headerGradientFrom?: string;
    headerGradientTo?: string;
    homeBackgroundFrom?: string;
    homeBackgroundTo?: string;
  };
  logo?: {
    url?: string;
    useTextLogo?: boolean;
    textPrimary?: string;
    textAccent?: string;
  };
  banner?: {
    slides?: Array<{
      imageUrl?: string;
      link?: string;
      order?: number;
      active?: boolean;
    }>;
    mobileHeight?: number;
    desktopHeight?: number;
    autoplaySpeed?: number;
    accentColor?: string;
  };
  navTabs?: Array<{
    id: string;
    label: string;
    path?: string;
    visible?: boolean;
    muted?: boolean;
  }>;
  offerCategories?: Array<{
    id: string;
    category: string;
    description?: string;
    discount?: string;
    image?: string;
    themeColor?: string;
    visible?: boolean;
    order?: number;
  }>;
  services?: Array<{
    id: string;
    title: string;
    iconKey?: string;
    bgColor?: string;
    description?: string;
    imageUrl?: string;
    visible?: boolean;
    order?: number;
  }>;
  homeProducts?: Array<{
    id: string;
    title: string;
    bgColor?: string;
    status?: string;
    image?: string;
    visible?: boolean;
    order?: number;
    categorySlug?: string;
  }>;
  categoryBanners?: Array<{
    id: string;
    title: string;
    image?: string;
    themeColor?: string;
    link?: string;
    visible?: boolean;
    order?: number;
  }>;
  serviceDefaultImage?: string;
  rentalDefaultImage?: string;
  sales?: {
    assuredBadgeLabel?: string;
    showAssuredBadge?: boolean;
    creditOptionEnabled?: boolean;
    creditLabel?: string;
  };
  service?: {
    creditOptionEnabled?: boolean;
    creditLabel?: string;
  };
  categorySearch?: {
    enabled?: boolean;
    placeholder?: string;
    showOnHome?: boolean;
  };
}

export const DEFAULT_FRONT_HOME_SETTINGS: FrontHomeSettings = {
  theme: {
    primaryColor: '#019ee3',
    secondaryColor: '#afcb09',
    headerGradientFrom: '#0c115d',
    headerGradientTo: '#1a237e',
    homeBackgroundFrom: '#e6fbff',
    homeBackgroundTo: '#f7fafd',
  },
  logo: {
    useTextLogo: true,
    textPrimary: 'corp',
    textAccent: 'culture',
  },
  banner: {
    mobileHeight: 200,
    desktopHeight: 200,
    autoplaySpeed: 3000,
    slides: [],
  },
  sales: {
    assuredBadgeLabel: 'Corpculture Assured',
    showAssuredBadge: true,
    creditOptionEnabled: true,
    creditLabel: 'Pay on Company Credit',
  },
  service: {
    creditOptionEnabled: true,
    creditLabel: 'Request service on credit',
  },
  categorySearch: {
    enabled: true,
    placeholder: 'Search categories...',
    showOnHome: true,
  },
};
