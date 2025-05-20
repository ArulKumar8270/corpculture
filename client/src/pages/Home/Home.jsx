import React from 'react';
import ScrollToTopOnRouteChange from "../../utils/ScrollToTopOnRouteChange";
import Categories from "../../components/header/Categories";
import Banner from "./Banner/Banner";
import SeoData from "../../SEO/SeoData";
import ServiceSection from "../../components/ServiceSection";
import ProductSection from "../../components/ProductSection";
import OfferSection from "../../components/OfferSection";
import { AirVent, BookOpen, Camera, Monitor, PaintBucket, Printer, Smartphone } from "lucide-react";
const Home = () => {
    const services = [
        { 
          id: 1, 
          title: 'AC Service', 
          icon: <AirVent size={32} className="text-white" />, 
          bgColor: 'bg-gradient-to-br from-red-300 to-red-500',
          description: 'Professional AC installation, repair and maintenance services'
        },
        { 
          id: 2, 
          title: 'Printer Service', 
          icon: <Printer size={32} className="text-white" />, 
          bgColor: 'bg-gradient-to-br from-fuchsia-300 to-fuchsia-500',
          description: 'Expert printer repair, maintenance and troubleshooting'
        },
        { 
          id: 3, 
          title: 'Toner & Cartridge', 
          icon: <BookOpen size={32} className="text-white" />, 
          bgColor: 'bg-gradient-to-br from-amber-300 to-amber-500',
          description: 'Quality toner and cartridge refill for all printer models'
        },
        { 
          id: 4, 
          title: 'Waterproof & Paint', 
          icon: <PaintBucket size={32} className="text-white" />, 
          bgColor: 'bg-gradient-to-br from-lime-300 to-lime-500',
          description: 'Professional waterproofing and painting solutions'
        },
        { 
          id: 5, 
          title: 'Mobile Service', 
          icon: <Smartphone size={32} className="text-white" />, 
          bgColor: 'bg-gradient-to-br from-cyan-300 to-cyan-500',
          description: 'Complete mobile repair and maintenance services'
        },
        { 
          id: 6, 
          title: 'Computer Service', 
          icon: <Monitor size={32} className="text-white" />, 
          bgColor: 'bg-gradient-to-br from-purple-300 to-purple-500',
          description: 'Comprehensive computer repair and support services'
        },
        { 
          id: 7, 
          title: 'CCTV/Camera Fixing', 
          icon: <Camera size={32} className="text-white" />, 
          bgColor: 'bg-gradient-to-br from-violet-300 to-violet-500',
          description: 'Professional CCTV installation and maintenance services'
        }
      ];
    
      const products = [
        {
          id: 1,
          title: 'Foods',
          bgColor: 'bg-gradient-to-br from-red-400 to-red-600',
          status: 'COMING SOON',
          image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800'
        },
        {
          id: 2,
          title: 'Events Management',
          bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
          status: 'COMING SOON',
          image: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800'
        },
        {
          id: 3,
          title: 'Printer & Toner',
          bgColor: 'bg-gradient-to-br from-lime-400 to-lime-600',
          status: 'COMING SOON',
          image: 'https://images.pexels.com/photos/3843284/pexels-photo-3843284.jpeg?auto=compress&cs=tinysrgb&w=800'
        },
        {
          id: 4,
          title: 'CCTV Camera Fixing',
          bgColor: 'bg-gradient-to-br from-violet-400 to-violet-600',
          status: 'COMING SOON',
          image: 'https://images.pexels.com/photos/430208/pexels-photo-430208.jpeg?auto=compress&cs=tinysrgb&w=800'
        },
        {
          id: 5,
          title: 'Computer Service',
          bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
          status: 'COMING SOON',
          image: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=800'
        },
        {
          id: 6,
          title: 'Stationery',
          bgColor: 'bg-gradient-to-br from-gray-400 to-gray-600',
          status: 'COMING SOON',
          image: 'https://images.pexels.com/photos/6446709/pexels-photo-6446709.jpeg?auto=compress&cs=tinysrgb&w=800'
        }
      ];
    
    return (
        <>
            <SeoData title="Online Shopping Site for Mobiles, Electronics, Furniture, Grocery, Lifestyle, Books & More. Best Offers!" />
            <ScrollToTopOnRouteChange />
            {/* <Categories /> */}
            <main className="flex flex-col items-center gap-3 px-2 pb-5 sm:mt-2">
                <Banner />
                <OfferSection />
                <ServiceSection services={services} />
                <ProductSection products={products} />
            </main>
        </>
    );
};

export default Home;
