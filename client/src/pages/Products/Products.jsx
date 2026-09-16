/* eslint-disable react/jsx-key */
import { useState, useEffect, useRef, useCallback } from "react";
import Product from "../../components/ProductListing/Product";
import { useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "./../../components/Spinner";
import axios from "axios";
import SeoData from "../../SEO/SeoData";
import SideFilter from "../../components/ProductListing/SideFilter";
import { useAuth } from "../../context/auth";

const PRODUCTS_PER_BATCH = 8;

const Products = () => {
    const location = useLocation();
    const { auth, isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [price, setPrice] = useState([0, 200000]);
    const getCategoryFromSearch = (search) => {
        const params = new URLSearchParams(search);
        const raw = params.get("category");
        return raw ? decodeURIComponent(raw.replace(/\+/g, " ")) : "";
    };

    const [category, setCategory] = useState(() => getCategoryFromSearch(location.search));
    const [ratings, setRatings] = useState(0);
    const [products, setProducts] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_BATCH);
    const [filterHeight, setFilterHeight] = useState(null);

    const sentinelRef = useRef(null);
    const filterRef = useRef(null);
    const listScrollRef = useRef(null);
    const loadingMoreRef = useRef(false);
    const productsLengthRef = useRef(0);

    const visibleProducts = products.slice(0, visibleCount);
    const hasMore = visibleCount < products.length;
    productsLengthRef.current = products.length;

    const loadMore = useCallback(() => {
        if (loadingMoreRef.current) return;
        const total = productsLengthRef.current;
        setVisibleCount((prev) => {
            if (prev >= total) return prev;
            loadingMoreRef.current = true;
            setLoadingMore(true);
            const next = Math.min(prev + PRODUCTS_PER_BATCH, total);
            requestAnimationFrame(() => {
                setLoadingMore(false);
                loadingMoreRef.current = false;
            });
            return next;
        });
    }, []);

    useEffect(() => {
        const fromUrl = getCategoryFromSearch(location.search);
        setCategory(fromUrl);
        setVisibleCount(PRODUCTS_PER_BATCH);
    }, [location.search]);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Keep products panel max-height in sync with filter sidebar height
    useEffect(() => {
        const el = filterRef.current;
        if (!el) return;

        const syncHeight = () => {
            const height = Math.ceil(el.getBoundingClientRect().height);
            setFilterHeight(height > 0 ? height : null);
        };

        syncHeight();
        const observer = new ResizeObserver(syncHeight);
        observer.observe(el);
        window.addEventListener("resize", syncHeight);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", syncHeight);
        };
    }, [categories, loading]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/category/all`,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );

            if (res.status === 200) {
                setCategories(res.data.categories);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error(
                error.response?.data?.message ||
                "Error fetching categories. Please try again."
            );
        }
    };

    useEffect(() => {
        const fetchFilteredData = async () => {
            try {
                setLoading(true);
                setVisibleCount(PRODUCTS_PER_BATCH);
                const res = await axios.get(
                    `${
                        import.meta.env.VITE_SERVER_URL
                    }/api/v1/product/filtered-products`,
                    {
                        params: {
                            category: category,
                            priceRange: [
                                parseInt(price[0].toFixed()),
                                parseInt(price[1].toFixed()),
                            ],
                            ratings: ratings,
                        },
                    }
                );

                res.status === 404 &&
                    toast.error("No Products Found!", {
                        toastId: "productNotFound",
                    });

                res.status === 201 && setProducts(res.data.products || []);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);

                error.response?.status === 500 &&
                    toast.error(
                        "Something went wrong! Please try after sometime.",
                        {
                            toastId: "error",
                        }
                    );
            }
        };
        fetchFilteredData();
    }, [price, category, ratings]);

    useEffect(() => {
        const fetchWishlistItems = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/user/wishlist`,
                    {
                        headers: {
                            Authorization: auth?.token,
                        },
                    }
                );
                setWishlistItems(res.data.wishlistItems);
            } catch (error) {
                console.error(
                    "Error fetching data from wishlist product page:",
                    error
                );
                error.response?.status === 500 &&
                    toast.error("Error in Fetching Wishlist Items!", {
                        toastId: "error",
                    });
            }
        };
        auth?.token && !isAdmin && fetchWishlistItems();
    }, [auth?.token, isAdmin]);

    // Infinite scroll inside the products panel (root = list when height-matched)
    useEffect(() => {
        if (loading || !hasMore) return;

        const node = sentinelRef.current;
        if (!node) return;

        const root =
            filterHeight && listScrollRef.current
                ? listScrollRef.current
                : null;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !loadingMoreRef.current) {
                    loadMore();
                }
            },
            { root, rootMargin: "160px", threshold: 0 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [loading, hasMore, loadMore, filterHeight]);

    return (
        <>
            <SeoData title="All Products | Corpculture" />

            <main className="w-full pt-2 pb-5 sm:mt-0 min-h-screen bg-gradient-to-br from-[#e6fbff] to-[#f7fafd]">
                {category && (
                    <div className="mx-3 mt-2 sm:mx-3 bg-white rounded-xl shadow border border-[#e6fbff] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-gray-700">
                            Showing products in{" "}
                            <span className="font-semibold text-[#019ee3]">{category}</span>
                        </p>
                        <Link
                            to="/products"
                            className="text-sm font-medium text-[#019ee3] hover:underline"
                        >
                            Clear category filter
                        </Link>
                    </div>
                )}
                <div className="flex gap-3 mt-2 sm:mt-2 sm:mx-3 m-auto items-start">
                    <SideFilter
                        ref={filterRef}
                        price={price}
                        category={category}
                        ratings={ratings}
                        setPrice={setPrice}
                        setCategory={setCategory}
                        setRatings={setRatings}
                        categories={categories}
                    />

                    <div
                        ref={listScrollRef}
                        className="flex-1 relative sm:overflow-y-auto sm:overscroll-contain"
                        style={
                            filterHeight
                                ? { maxHeight: `${filterHeight}px` }
                                : undefined
                        }
                    >
                        {!loading && products?.length === 0 && (
                            <div className="flex flex-col items-center justify-start gap-3 bg-white shadow-xl rounded-2xl p-6 sm:p-16 border border-[#e6fbff] h-full">
                                <img
                                    draggable="true"
                                    className="w-1/2 h-44 object-contain"
                                    src="https://static-assets-web.flixcart.com/www/linchpin/fk-cp-zion/img/error-no-search-results_2353c5.png"
                                    alt="Search Not Found"
                                />
                                <h1 className="text-2xl font-medium text-[#019ee3]">
                                    Sorry, no results found!
                                </h1>
                                <p className="text-xl text-center text-primary-grey">
                                    Please check the spelling or try searching
                                    for something else.
                                </p>
                            </div>
                        )}

                        {loading ? (
                            <Spinner />
                        ) : (
                            products?.length !== 0 && (
                                <div className="flex flex-col gap-2 pb-4 w-full bg-white rounded-2xl shadow-xl border border-[#e6fbff]">
                                    <div className="sticky top-0 z-10 w-full px-4 py-3 text-sm text-gray-500 bg-white border-b border-[#e6fbff] rounded-t-2xl">
                                        Showing {visibleProducts.length} of{" "}
                                        {products.length} products
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 w-full place-content-start pb-4 bg-[#f7fafd] rounded-b-2xl">
                                        {visibleProducts.map((product) => (
                                            <Product
                                                key={product._id}
                                                {...product}
                                                wishlistItems={wishlistItems}
                                                setWishlistItems={
                                                    setWishlistItems
                                                }
                                            />
                                        ))}
                                    </div>

                                    <div
                                        ref={sentinelRef}
                                        className="w-full flex flex-col items-center justify-center py-4 min-h-[48px]"
                                    >
                                        {loadingMore && (
                                            <div className="flex items-center gap-2 text-[#019ee3] text-sm font-medium">
                                                <span className="inline-block h-5 w-5 rounded-full border-2 border-[#019ee3] border-t-transparent animate-spin" />
                                                Loading more products…
                                            </div>
                                        )}
                                        {!hasMore && products.length > PRODUCTS_PER_BATCH && (
                                            <p className="text-sm text-gray-400">
                                                You&apos;ve reached the end
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </>
    );
};

export default Products;
