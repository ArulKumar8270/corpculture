/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useParams } from "react-router-dom";
import Slider from "react-slick";
import { NextBtn, PreviousBtn } from "../../pages/Home/Banner/Banner.jsx";
import ProductSlider from "../../pages/Home/ProductsListing/ProductSlider.jsx";
import Spinner from "../../components/Spinner";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import StarIcon from "@mui/icons-material/Star";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CachedIcon from "@mui/icons-material/Cached";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import FavoriteIcon from "@mui/icons-material/Favorite";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Rating from "@mui/material/Rating";
import TextField from "@mui/material/TextField";
import { getDeliveryDate, getDiscount } from "../../utils/functions";
import MinCategory from "../../components/MinCategory";
import axios from "axios";
import { useAuth } from "../../context/auth";
import { fashionProducts } from "../../utils/fashion";
import { electronicProducts } from "../../utils/electronics";
import ScrollToTopOnRouteChange from "../../utils/ScrollToTopOnRouteChange";
import { useCart } from "../../context/cart";
import SeoData from "../../SEO/SeoData";

const ProductDetails = () => {
    const navigate = useNavigate();
    const { auth, setAuth, LogOut, isAdmin, isContextLoading } = useAuth();
    const [cartItems, setCartItems, addItems] = useCart();
    // reviews toggle
    const [open, setOpen] = useState(false);
    const [viewAll, setViewAll] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState({});

    console.log(product, "product96876")

    const settings = {
        autoplay: true,
        autoplaySpeed: 3000,
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        prevArrow: <PreviousBtn />,
        nextArrow: <NextBtn />,
    };

    const { productId } = useParams();
    // console.log(productId);

    const reviewSubmitHandler = () => {
        if (rating === 0 || !comment.trim()) {
            toast.error("Empty Review", {
                style: {
                    top: "40px",
                },
            });
            return;
        }
        const formData = new FormData();
        formData.set("rating", rating);
        formData.set("comment", comment);
        formData.set("productId", productId);

        setOpen(false);
    };
    const addToCartHandler = () => {
        const item = {
            productId: product._id,
            name: product.name,
            stock: product.stock,
            image: product.images[0].url,
            brandName: product.brand.name,
            price: product.price,
            discountPrice: product.discountPrice,
            seller: product.seller,
            sendInvoice: product.sendInvoice,
            isInstalation: product.isInstalation,
            deliveryCharge: product.deliveryCharge,
            installationCost : product.installationCost,
            priceRange: product.priceRange,
            commissionRange: product.commission,
        };
        addItems(item, 1);
    };

    const handleDialogClose = () => {
        setOpen(!open);
    };

    const itemInCart = cartItems.some((item) => item.productId === productId);

    const goToCart = () => {
        navigate("/cart");
    };

    const buyNow = () => {
        addToCartHandler();
        navigate("/cart");
    };

    //fetch cart items
    useEffect(() => {
        //fetch wishlist items
        const fetchWishlistItems = async () => {
            try {
                // only id of wishlist products will get
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/user/wishlist`,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
                setWishlistItems(res.data.wishlistItems);
            } catch (error) {
                console.error("Error fetching wishlist items:", error);
            }
        };
        auth.token && !isAdmin && fetchWishlistItems();
    }, [isContextLoading, auth.token, auth, isAdmin]);

    //fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(
                    `${
                        import.meta.env.VITE_SERVER_URL
                    }/api/v1/product/${productId}`
                );
                // console.log(res.data.product);
                res.status === 201 && setProduct(res.data.product);
                setLoading(false);
            } catch (error) {
                console.error("Error:", error);
                setLoading(false);
                // product not found
                error.response?.status === 404 &&
                    toast.error("Product Not Found!", {
                        style: {
                            top: "40px",
                        },
                    });

                //server error
                error.response?.status === 500 &&
                    toast.error(
                        "Something went wrong! Please try after sometime.",
                        {
                            style: {
                                top: "40px",
                            },
                        }
                    );
            }
        };
        fetchProduct();
    }, [productId]);

    let itemInWishlist = wishlistItems?.find((id) => id === productId);
    // Optimistic UI update
    const updateWishlistUI = (add) => {
        setWishlistItems((prev) =>
            add
                ? [...prev, product._id]
                : prev.filter((item) => item !== product._id)
        );
    };

    const addToWishlistHandler = async () => {
        let type = itemInWishlist ? "remove" : "add";
        try {
            // Update the UI before the API call
            updateWishlistUI(type === "add");
            const res = await axios.post(
                `${
                    import.meta.env.VITE_SERVER_URL
                }/api/v1/user/update-wishlist`,
                {
                    productId: productId,
                    type,
                },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            // console.log(res);
            res.status === 201 &&
                toast.success(
                    type === "add"
                        ? "Product Added To Wishlist"
                        : "Product Removed From Wishlist",
                    {
                        style: {
                            top: "40px",
                        },
                    }
                );
        } catch (error) {
            console.log(error);
            // Revert UI update if there is an error
            updateWishlistUI(type !== "add");
            toast.error("Something went wrong!", {
                style: {
                    top: "40px",
                },
            });
        }
    };

    return (
        <>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    <SeoData title={product?.name} />
                    <ScrollToTopOnRouteChange />
                    {/* <MinCategory /> */}
                    <main className="mt-5 sm:mt-0 min-h-screen bg-gradient-to-br from-[#e6fbff] to-[#f7fafd]">
                        {/* <!-- product image & description container --> */}
                        <div className="w-full flex flex-col lg:flex-row bg-white sm:p-2 relative rounded-2xl shadow-xl border border-[#e6fbff]">
                            {/* <!-- image wrapper --> */}
                            <div className="w-full lg:w-2/5 lg:sticky top-16 lg:h-screen">
                                {/* <!-- imgBox --> */}
                                <div className="flex flex-col gap-3 m-3">
                                    <div className="w-full h-full pb-6 border rounded-2xl shadow relative">
                                        <Slider {...settings}>
                                            {product?.images.length > 1 ? (
                                                product?.images?.map(
                                                    (item, i) => (
                                                        <img
                                                            draggable="false"
                                                            className="w-full h-96 object-contain"
                                                            src={item.url}
                                                            alt={product.name}
                                                            key={i}
                                                        />
                                                    )
                                                )
                                            ) : (
                                                <img
                                                    draggable="false"
                                                    className="w-full h-96 object-contain"
                                                    src={
                                                        product?.images[0]?.url
                                                    }
                                                    alt={product?.name}
                                                />
                                            )}
                                        </Slider>
                                        <div
                                            className={`absolute top-4 right-4 shadow-lg bg-white w-11 h-11 border flex items-center justify-center rounded-full transition ${
                                                isAdmin ? "hidden" : ""
                                            }`}
                                        >
                                            <span
                                                onClick={addToWishlistHandler}
                                                className={`${
                                                    itemInWishlist
                                                        ? "text-red-500"
                                                        : "hover:text-red-500 text-gray-300"
                                                } cursor-pointer transition-colors duration-200`}
                                            >
                                                <FavoriteIcon
                                                    sx={{ fontSize: "24px" }}
                                                />
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full flex gap-3">
                                        {/* <!-- add to cart btn --> */}
                                        {product.stock > 0 && (
                                            <button
                                                onClick={
                                                    itemInCart
                                                        ? goToCart
                                                        : addToCartHandler
                                                }
                                                disabled={isAdmin}
                                                className="disabled:cursor-not-allowed p-3 sm:p-4 w-1/2 flex items-center justify-center gap-2 text-white rounded-xl shadow bg-gradient-to-r from-[#019ee3] to-[#afcb09] font-semibold hover:shadow-lg transition"
                                            >
                                                <ShoppingCartIcon />
                                                {itemInCart
                                                    ? "GO TO CART"
                                                    : "ADD TO CART"}
                                            </button>
                                        )}
                                        <button
                                            onClick={buyNow}
                                            disabled={
                                                isAdmin || product.stock < 1
                                            }
                                            className={`disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white rounded-xl shadow font-semibold hover:shadow-lg p-4 transition ${
                                                product.stock < 1
                                                    ? "w-full bg-red-600 cursor-not-allowed"
                                                    : "w-1/2 bg-gradient-to-r from-[#fb641b] to-[#ff9f00]"
                                            }`}
                                        >
                                            <FlashOnIcon />
                                            {product?.stock < 1
                                                ? "OUT OF STOCK"
                                                : "BUY NOW"}
                                        </button>
                                        {/* <!-- add to cart btn --> */}
                                    </div>
                                </div>
                                {/* <!-- img box --> */}
                            </div>
                            {/* <!-- image wrapper --> */}

                            {/* <!-- product desc wrapper --> */}
                            <div className="py-2 px-3 flex-1 flex flex-col lg:flex-row gap-8">
                                {/* <!-- left: product description --> */}
                                <div className="flex flex-col gap-5 mb-6 lg:w-3/5">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                                        {product?.name}
                                    </h2>
                                    {/* <!-- rating badge --> */}
                                    <span className="text-md text-gray-600 font-medium flex gap-3 items-center">
                                        <span className="text-xs px-2 py-1 bg-[#019ee3] rounded-full text-white flex items-center gap-1 font-semibold shadow">
                                            {product?.ratings?.toFixed(1)}
                                            <StarIcon sx={{ fontSize: "14px" }} />
                                        </span>
                                        <span className="text-sm">
                                            {product?.numOfReviews} Reviews
                                        </span>
                                        <span className="w-[80px] object-contain">
                                            <img
                                                src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png"
                                                alt="f-assured"
                                            />
                                        </span>
                                    </span>
                                    {/* <!-- rating badge --> */}

                                    {/* <!-- price desc --> */}
                                    <div className="flex flex-col text-2xl gap-1">
                                        <span className="text-[#afcb09] text-base font-semibold tracking-wide">
                                            Special Price
                                        </span>
                                        <div className="flex items-baseline gap-3 text-3xl font-bold">
                                            <span className="text-gray-900">
                                                ₹ {product?.price?.toLocaleString()} 
                                            </span>
                                            <span className="text-lg text-gray-400 line-through font-medium">
                                                ₹ {product?.discountPrice?.toLocaleString()}
                                            </span>
                                            {/* <span className="text-base text-[#019ee3] font-semibold">
                                                {getDiscount(
                                                    product?.price,
                                                    product?.discountPrice
                                                )}
                                                %&nbsp;off
                                            </span> */}
                                        </div>
                                    </div>
                                    {product?.stock <= 10 && product?.stock > 0 && (
                                        <span className="text-red-600 text-base font-semibold bg-red-50 px-3 py-1 rounded-lg w-fit shadow-sm">
                                            Hurry, Only {product.stock} left!
                                        </span>
                                    )}
                                    {/* <!-- price desc --> */}
                                    {/* <!-- warranty & brand --> */}
                                    <div className="flex gap-8 mt-4 items-center text-sm">
                                        <img
                                            draggable="false"
                                            className="w-20 h-8 p-0.5 border rounded-lg bg-gray-50 object-contain"
                                            src={product.brand?.logo.url}
                                            alt={product?.brand?.name}
                                        />
                                        <span className="font-medium text-gray-700">
                                            {product?.warranty === 0
                                                ? "No Warranty"
                                                : `${product?.warranty} Year Brand Warranty`}
                                        </span>
                                        {/* <Link
                                            className="font-semibold text-[#019ee3] hover:underline -ml-5"
                                            to="/"
                                        >
                                            Know More
                                        </Link> */}
                                    </div>
                                    {/* <!-- warranty & brand --> */}

                                    {/* <!-- delivery details --> */}
                                    <div className="flex gap-16 mt-4 items-center text-sm font-medium">
                                        <p className="text-gray-500">Delivery</p>
                                        <span>
                                            Delivery by {getDeliveryDate()} |  ₹{product?.deliveryCharge}
                                        </span>
                                    </div>
                                    {/* <!-- delivery details --> */}

                                    {/* <!-- seller details --> */}
                                    {/* <div className="flex gap-16 mt-4 items-center text-sm font-medium">
                                        <p className="text-gray-500">Seller</p>
                                        <Link
                                            className="font-semibold text-[#019ee3] ml-3 hover:underline"
                                            to="/"
                                        >
                                            {product?.brand?.name}
                                        </Link>
                                    </div> */}
                                    {/* <!-- seller details --> */}

                                    {/* <!-- description details --> */}
                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-14 mt-4 items-stretch text-sm">
                                        <p className="text-gray-500 font-medium">
                                            Description
                                        </p>
                                        <span className="text-gray-700">{product?.description}</span>
                                    </div>
                                    {/* <!-- description details --> */}

                                    {/* <!-- specifications border box --> */}
                                   {product?.specifications?.length > 0 ? <div className="w-full rounded-2xl border border-[#e6fbff] shadow-lg flex flex-col bg-white">
                                        <h1 className="px-6 py-4 border-b text-2xl font-bold text-gray-800">
                                            Specifications
                                        </h1>
                                        <h1 className="px-6 py-3 text-lg font-semibold text-gray-700">
                                            General
                                        </h1>

                                        {/* <!-- specs list --> */}
                                        {product?.specifications?.map(
                                            (spec, i) => (
                                                <div
                                                    className="px-6 py-2 flex items-center text-sm"
                                                    key={i}
                                                >
                                                    <p className="text-gray-500 w-3/12 font-medium">
                                                        {spec.title}
                                                    </p>
                                                    <p className="flex-1 text-gray-700">
                                                        {spec.description}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                        {/* <!-- specs list --> */}
                                    </div> : null}
                                    {/* <!-- specifications border box --> */}

                                    {/* <!-- reviews border box --> */}
                                    <div className="w-full rounded-2xl border border-[#e6fbff] shadow-lg flex flex-col bg-white">
                                        <div className="flex justify-between items-center border-b px-6 py-4">
                                            <h1 className="text-2xl font-bold text-gray-800">
                                                Ratings & Reviews
                                            </h1>
                                            <button
                                                onClick={handleDialogClose}
                                                className="shadow bg-gradient-to-r from-[#019ee3] to-[#afcb09] font-semibold px-5 py-2 rounded-xl hover:shadow-md border-none text-white transition"
                                            >
                                                Rate Product
                                            </button>
                                        </div>

                                        <Dialog
                                            aria-labelledby="review-dialog"
                                            open={open}
                                            onClose={handleDialogClose}
                                            PaperProps={{
                                                className: "rounded-2xl"
                                            }}
                                        >
                                            <DialogTitle className="border-b text-2xl font-bold text-gray-800 py-4">
                                                Submit Review
                                            </DialogTitle>
                                            <DialogContent className="flex flex-col m-2 gap-6">
                                                <Rating
                                                    onChange={(e) =>
                                                        setRating(
                                                            e.target.value
                                                        )
                                                    }
                                                    value={rating}
                                                    size="large"
                                                    precision={0.5}
                                                />
                                                <TextField
                                                    label="Write your review"
                                                    multiline
                                                    rows={3}
                                                    sx={{ width: 400 }}
                                                    size="small"
                                                    variant="outlined"
                                                    value={comment}
                                                    onChange={(e) =>
                                                        setComment(
                                                            e.target.value
                                                        )
                                                    }
                                                    InputProps={{
                                                        className: "rounded-lg"
                                                    }}
                                                />
                                            </DialogContent>
                                            <DialogActions className="px-6 pb-4">
                                                <button
                                                    onClick={handleDialogClose}
                                                    className="py-2 px-6 rounded-xl shadow bg-white border border-red-500 hover:bg-red-100 text-red-600 font-semibold uppercase transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={
                                                        reviewSubmitHandler
                                                    }
                                                    className="py-2 px-6 rounded-xl bg-gradient-to-r from-[#FB641B] to-[#ff9f00] hover:from-[#ff7f54] hover:to-[#ffe066] text-white shadow font-semibold uppercase transition"
                                                >
                                                    Submit
                                                </button>
                                            </DialogActions>
                                        </Dialog>

                                        <div className="flex items-center border-b">
                                            <h1 className="px-6 py-3 text-3xl font-semibold">
                                                {product?.ratings?.toFixed(1)}{" "}
                                                <StarIcon />
                                            </h1>
                                            <p className="text-lg text-gray-500">
                                                ({product?.numOfReviews})
                                                Reviews
                                            </p>
                                        </div>

                                        {viewAll
                                            ? product?.reviews
                                                  ?.map((rev, i) => (
                                                      <div
                                                          className="flex flex-col gap-2 py-4 px-6 border-b"
                                                          key={i}
                                                      >
                                                          <Rating
                                                              name="read-only"
                                                              value={rev.rating}
                                                              readOnly
                                                              size="small"
                                                              precision={0.5}
                                                          />
                                                          <p>{rev.comment}</p>
                                                          <span className="text-sm text-gray-500">
                                                              by {rev.name}
                                                          </span>
                                                      </div>
                                                  ))
                                                  .reverse()
                                            : product.reviews
                                                  ?.slice(-3)
                                                  .map((rev, i) => (
                                                      <div
                                                          className="flex flex-col gap-2 py-4 px-6 border-b"
                                                          key={i}
                                                      >
                                                          <Rating
                                                              name="read-only"
                                                              value={rev.rating}
                                                              readOnly
                                                              size="small"
                                                              precision={0.5}
                                                          />
                                                          <p>{rev.comment}</p>
                                                          <span className="text-sm text-gray-500">
                                                              by {rev.name}
                                                          </span>
                                                      </div>
                                                  ))
                                                  .reverse()}
                                        {product.reviews?.length > 3 && (
                                            <button
                                                onClick={() =>
                                                    setViewAll(!viewAll)
                                                }
                                                className="w-1/3 m-2 rounded-xl shadow hover:shadow-lg py-2 bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white"
                                            >
                                                {viewAll
                                                    ? "View Less"
                                                    : "View All"}
                                            </button>
                                        )}
                                    </div>
                                    {/* <!-- reviews border box --> */}
                                </div>
                            </div>
                            {/* <!-- product desc wrapper --> */}
                        </div>
                    </main>
                </>
            )}
        </>
    );
};

export default ProductDetails;
