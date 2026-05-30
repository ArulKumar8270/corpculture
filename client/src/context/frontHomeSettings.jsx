import { createContext, useContext, useEffect, useState, useMemo } from "react";
import axios from "axios";

const FrontHomeSettingsContext = createContext(null);

const API = `${import.meta.env.VITE_SERVER_URL}/api/v1/front-home-settings`;

export const FrontHomeSettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get(API);
            if (data?.success) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error("Failed to load front home settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const value = useMemo(
        () => ({
            settings,
            loading,
            refreshSettings: fetchSettings,
            theme: settings?.theme,
            logo: settings?.logo,
            banner: settings?.banner,
            navTabs: settings?.navTabs || [],
            offerCategories: settings?.offerCategories || [],
            services: settings?.services || [],
            homeProducts: settings?.homeProducts || [],
            categoryBanners: settings?.categoryBanners || [],
            serviceDefaultImage: settings?.serviceDefaultImage || "",
            rentalDefaultImage: settings?.rentalDefaultImage || "",
            sales: settings?.sales,
            serviceSettings: settings?.service,
            categorySearch: settings?.categorySearch,
        }),
        [settings, loading]
    );

    return (
        <FrontHomeSettingsContext.Provider value={value}>
            {children}
        </FrontHomeSettingsContext.Provider>
    );
};

export const useFrontHomeSettings = () => {
    const ctx = useContext(FrontHomeSettingsContext);
    if (!ctx) {
        return {
            settings: null,
            loading: false,
            refreshSettings: async () => {},
            theme: undefined,
            logo: undefined,
            banner: undefined,
            navTabs: [],
            offerCategories: [],
            services: [],
            homeProducts: [],
            categoryBanners: [],
            serviceDefaultImage: "",
            rentalDefaultImage: "",
            sales: undefined,
            serviceSettings: undefined,
            categorySearch: undefined,
        };
    }
    return ctx;
};

export default FrontHomeSettingsContext;
