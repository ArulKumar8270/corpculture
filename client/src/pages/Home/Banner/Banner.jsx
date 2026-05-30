/* eslint-disable react/prop-types */
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Banner.css";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Link } from "react-router-dom";
import oppo from "../../../assets/images/Banners/oppo-reno7.webp";
import samsung from "../../../assets/images/Banners/samsung.jpeg";
import infinix from "../../../assets/images/Banners/infinix.jpeg";
import flight from "../../../assets/images/Banners/flight.jpeg";
import flight2 from "../../../assets/images/Banners/flight2.jpeg";
import laptop from "../../../assets/images/Banners/laptop.png";
import mattress from "../../../assets/images/Banners/mattress.jpg";
import iphone from "../../../assets/images/Banners/iphone.jpg";
import { useFrontHomeSettings } from "../../../context/frontHomeSettings";

const FALLBACK_BANNERS = [
    iphone,
    laptop,
    flight,
    samsung,
    infinix,
    mattress,
    oppo,
    flight2,
];

export const PreviousBtn = ({ className, onClick }) => (
    <div className={className} onClick={onClick}>
        <ArrowBackIosIcon />
    </div>
);

export const NextBtn = ({ className, onClick }) => (
    <div className={className} onClick={onClick}>
        <ArrowForwardIosIcon />
    </div>
);

const Banner = () => {
    const { banner, loading } = useFrontHomeSettings();

    const mobileH = banner?.mobileHeight ?? 250;
    const desktopH = banner?.desktopHeight ?? 480;
    const autoplaySpeed = banner?.autoplaySpeed ?? 3000;
    const accentColor = banner?.accentColor ?? "#019ee3";

    const activeSlides = (banner?.slides || []).filter(
        (s) => s.active !== false && s.imageUrl
    );

    const useApiSlides = !loading && activeSlides.length > 0;
    const banners = useApiSlides
        ? activeSlides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : FALLBACK_BANNERS.map((src) => ({ imageUrl: src, link: "" }));

    const settings = {
        autoplay: true,
        autoplaySpeed,
        dots: false,
        infinite: true,
        speed: 1500,
        slidesToShow: 1,
        slidesToScroll: 1,
        prevArrow: <PreviousBtn />,
        nextArrow: <NextBtn />,
    };

    return (
        <section
            className="w-full rounded-sm shadow p-0 overflow-hidden mt-3 sm:m-2 banner-section"
            style={{ "--banner-accent": accentColor }}
        >
            <style>{`
                .banner-slide-img { height: ${mobileH}px; }
                @media (min-width: 640px) {
                    .banner-slide-img { height: ${desktopH}px; }
                }
            `}</style>
            <Slider {...settings}>
                {banners.map((el, i) => {
                    const src = useApiSlides ? el.imageUrl : el.imageUrl || el;
                    const img = (
                        <img
                            draggable="false"
                            className="banner-slide-img w-full object-cover"
                            src={src}
                            alt="banner"
                        />
                    );
                    return (
                        <div key={i}>
                            {useApiSlides && el.link ? (
                                <Link to={el.link}>{img}</Link>
                            ) : (
                                img
                            )}
                        </div>
                    );
                })}
            </Slider>
        </section>
    );
};

export default Banner;
