import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ScrollToTopOnRouteChange from "../../utils/ScrollToTopOnRouteChange";
import Banner from "./Banner/Banner";
import SeoData from "../../SEO/SeoData";
import ServiceSection from "../../components/ServiceSection";
import ProductSection from "../../components/ProductSection";
import OfferSection from "../../components/OfferSection";
import HomeCategorySearch from "../../components/HomeCategorySearch";
import { useFrontHomeSettings } from '../../context/frontHomeSettings';
import { getServiceIcon } from '../../utils/serviceIcons';

const Home = () => {
    const {
        settings,
        loading,
        services: apiServices,
        homeProducts: apiProducts,
        offerCategories,
        categoryBanners,
        theme,
    } = useFrontHomeSettings();

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/category/all`
                );
                if (res.status === 200) {
                    setCategories(res.data.categories || []);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const services = (apiServices || [])
        .filter((s) => s.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((service) => ({
            id: service.id,
            title: service.title,
            icon: service.imageUrl ? (
                <img src={service.imageUrl} alt={service.title} className="w-8 h-8 object-contain" />
            ) : (
                getServiceIcon(service.iconKey)
            ),
            bgColor: `bg-gradient-to-br ${service.bgColor}`,
            description: service.description,
        }));

    const products = (apiProducts || [])
        .filter((p) => p.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((product) => ({
            id: product.id,
            title: product.title,
            bgColor: `bg-gradient-to-br ${product.bgColor}`,
            status: product.status,
            image: product.image,
            categorySlug: product.categorySlug,
        }));

    const visibleOffers = (offerCategories || [])
        .filter((o) => o.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const pageStyle = theme
        ? {
              background: `linear-gradient(to bottom right, ${theme.homeBackgroundFrom}, ${theme.homeBackgroundTo})`,
          }
        : undefined;

    return (
        <>
            <SeoData title="Corpculture | Home — Sales, Service & Rental" />
            <ScrollToTopOnRouteChange />
            <main
                className="flex flex-col items-center gap-3 px-2 pb-5 sm:mt-2 min-h-screen"
                style={pageStyle}
            >
                <Banner />
                {!loading && <HomeCategorySearch categories={categories} />}
                <OfferSection
                    books={visibleOffers}
                    categoryBanners={categoryBanners}
                />
                {services.length > 0 && <ServiceSection services={services} />}
                {products.length > 0 && (
                    <ProductSection products={products} categories={categories} />
                )}
            </main>
        </>
    );
};

export default Home;
