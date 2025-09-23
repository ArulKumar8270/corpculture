import TextField from "@mui/material/TextField";
import { useState, useEffect } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuItem from "@mui/material/MenuItem";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ImageIcon from "@mui/icons-material/Image";
import Spinner from "../../components/Spinner";
import axios from "axios";
import FormData from "form-data";
import { useAuth } from "../../context/auth";
import ScrollToTopOnRouteChange from "./../../utils/ScrollToTopOnRouteChange";
import SeoData from "../../SEO/SeoData";

const CreateProduct = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();

    const [highlights, setHighlights] = useState([]);
    const [highlightInput, setHighlightInput] = useState("");
    const [specs, setSpecs] = useState([]);
    const [specsInput, setSpecsInput] = useState({
        title: "",
        description: "",
    });

    const [priceRange, setPriceRange] = useState([]);
    const [priceRangeInput, setPriceRangeInput] = useState({
        from: "",
        to: "",
        price: "",
        commission: "",
    });

    const [commission, setCommission] = useState([]);
    const [commissionInput, setCommissionInput] = useState({
        from: "",
        to: "",
        commission: "",
    });

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState();
    const [discountPrice, setDiscountPrice] = useState();
    const [category, setCategory] = useState("");
    const [stock, setStock] = useState();
    const [warranty, setWarranty] = useState();
    const [brand, setBrand] = useState("");
    const [images, setImages] = useState([]);
    const [imagesPreview, setImagesPreview] = useState([]);
    const [logo, setLogo] = useState("");
    const [logoPreview, setLogoPreview] = useState("");

    // New state variables for installation cost and delivery charge
    const [installationCost, setInstallationCost] = useState();
    const [deliveryCharge, setDeliveryCharge] = useState();
    const [categories, setCategories] = useState([]);

    //for submit state
    const [isSubmit, setIsSubmit] = useState(false);

    // max image size 500kb
    const MAX_IMAGE_SIZE = 500 * 1024;
    const MAX_IMAGES_COUNT = 4; // Maximum number of allowed images



    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/category/all`, // Assuming this is your endpoint
                    {
                        headers: {
                            Authorization: auth?.token,
                        },
                    }
                );

                if (res.status === 200) {
                    setCategories(res.data.categories);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching categories:", error);
                toast.error(
                    error.response?.data?.message ||
                    "Error fetching categories. Please try again."
                );
            }
        };

        if (auth?.token) {
            fetchCategories();
        }
    }, [auth?.token]);


    const handleSpecsChange = (e) => {
        setSpecsInput({ ...specsInput, [e.target.name]: e.target.value });
    };

    const addSpecs = () => {
        if (!specsInput.title.trim() && !specsInput.description.trim()) return;
        setSpecs([...specs, specsInput]);
        setSpecsInput({ title: "", description: "" });
    };

    const handleCommissionChange = (e) => {
        setCommissionInput({ ...commissionInput, [e.target.name]: e.target.value });
    };

    const addCommission = () => {
        if (!commissionInput.from.trim() && !commissionInput.to.trim() && !commissionInput.commission.trim()) return;
        setCommission([...commission, commissionInput]);
        setCommissionInput({ from: "", to: "", commission: "" });
    };

    const handlerpiceRange = (e) => {
        setPriceRangeInput({ ...priceRangeInput, [e.target.name]: e.target.value });
    };

    const addPriceRange = () => {
        if (!priceRangeInput.from.trim() && !priceRangeInput.to.trim() && !priceRangeInput.price.trim()) return;
        setPriceRange([...priceRange, priceRangeInput]);
        setPriceRangeInput({ from: "", to: "", price: "", commission: "" });
    };

    const addHighlight = () => {
        if (!highlightInput.trim()) return;
        setHighlights([...highlights, highlightInput]);
        setHighlightInput("");
    };

    const deleteHighlight = (index) => {
        setHighlights(highlights.filter((h, i) => i !== index));
    };

    const deleteSpec = (index) => {
        setSpecs(specs.filter((s, i) => i !== index));
    };
    const deleteCommission = (index) => {
        setCommission(commission.filter((s, i) => i !== index));
    };
    const deletePriceRange = (index) => {
        setPriceRange(priceRange.filter((s, i) => i !== index));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];

        if (file.size > MAX_IMAGE_SIZE) {
            toast.warning("Logo image size exceeds 500 KB!");
            return;
        }
        const reader = new FileReader();

        reader.onload = () => {
            if (reader.readyState === 2) {
                setLogoPreview(reader.result);
                setLogo(reader.result);
            }
        };

        reader.readAsDataURL(file);
    };

    const handleProductImageChange = (e) => {
        const files = Array.from(e.target.files);
        // if more than 4 images then show warning
        if (files.length > MAX_IMAGES_COUNT) {
            toast.warning("You can only upload up to 4 images");
            return;
        }

        files.forEach((file) => {
            // check for image size
            if (file.size > MAX_IMAGE_SIZE) {
                toast.warning("One of the product images exceeds 500 KB");
                // Skip the file if it exceeds the size limit
                return;
            }
            const reader = new FileReader();

            reader.onload = () => {
                if (reader.readyState === 2) {
                    setImagesPreview((oldImages) => [
                        ...oldImages,
                        reader.result,
                    ]);
                    setImages((oldImages) => [...oldImages, reader.result]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const newProductSubmitHandler = async (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
        setIsSubmit(true);
        try {
            // required field checks
            if (!logo) {
                toast.warning("Please Add Brand Logo");
                return;
            }
            // if (specs.length <= 1) {
            //     toast.warning("Please Add Minimum 2 Specifications");
            //     return;
            // }
            if (images.length <= 0) {
                toast.warning("Please Add Product Images");
                return;
            }

            const formData = new FormData();

            formData.append("name", name);
            formData.append("description", description);
            formData.append("price", price);
            formData.append("discountPrice", discountPrice);
            formData.append("category", category);
            formData.append("stock", stock);
            formData.append("warranty", warranty);
            formData.append("brandName", brand);
            formData.append("logo", logo);
            // Append new fields to formData
            formData.append("installationCost", installationCost);
            formData.append("deliveryCharge", deliveryCharge);

            images.forEach((image) => {
                formData.append("images", image);
            });

            highlights.forEach((h) => {
                formData.append("highlights", h);
            });

            specs.forEach((s) => {
                formData.append("specifications", JSON.stringify(s));
            });
            commission.forEach((s) => {
                formData.append("commission", JSON.stringify(s));
            });
            priceRange.forEach((s) => {
                formData.append("priceRange", JSON.stringify(s));
            });
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/product/new-product`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: auth?.token,
                    },
                }
            );
            // on success->
            response.status === 201 &&
                toast.success("Product Added Successfully!");
            navigate("/admin/dashboard/all-products");
        } catch (error) {
            console.error("Error:", error);
            setIsSubmit(false);
            //server error
            error.response.status === 500 &&
                toast.error("Something went wrong! Please try after sometime.");
        }
    };

    return (
        <>
            <SeoData title="New Product | Flipkart" />
            <ScrollToTopOnRouteChange />

            {isSubmit ? (
                <div className="relative h-full">
                    <Spinner />
                </div>
            ) : (
                <form
                    onSubmit={newProductSubmitHandler}
                    encType="multipart/form-data"
                    className="flex flex-col w-full sm:flex-row bg-white rounded-2xl shadow-2xl p-2 sm:p-8"
                    id="mainForm"
                >
                    <div className="flex flex-col mx-auto py-2 gap-3 m-2 w-[95%] ">
                        <TextField
                            label="Name"
                            variant="outlined"
                            size="small"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <TextField
                            label="Description"
                            multiline
                            rows={2}
                            required
                            variant="outlined"
                            size="small"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <div className="flex gap-2 justify-between">
                            <TextField
                                label="Price"
                                type="number"
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    inputProps: {
                                        min: 0,
                                    },
                                }}
                                required
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                            <TextField
                                label="deliveryCharge"
                                type="number"
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    inputProps: {
                                        min: 0,
                                    },
                                }}
                                value={deliveryCharge}
                                onChange={(e) => setDeliveryCharge(e.target.value)}
                            />
                            <TextField
                                label="installationCose"
                                type="number"
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    inputProps: {
                                        min: 0,
                                    },
                                }}
                                value={installationCost}
                                onChange={(e) => setInstallationCost(e.target.value)}
                            />
                            <TextField
                                label="Discount Price"
                                type="number"
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    inputProps: {
                                        min: 0,
                                    },
                                }}
                                value={discountPrice}
                                onChange={(e) =>
                                    setDiscountPrice(e.target.value)
                                }
                            />
                        </div>

                        <div className="flex justify-between gap-4">
                            <TextField
                                label="Category"
                                select
                                fullWidth
                                variant="outlined"
                                size="small"
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {categories.map((el, i) => (
                                    <MenuItem value={el.name} key={i}>
                                        {el.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Stock"
                                type="number"
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    inputProps: {
                                        min: 0,
                                    },
                                }}
                                required
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                            />
                            <TextField
                                label="Warranty"
                                type="number"
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    inputProps: {
                                        min: 0,
                                    },
                                }}
                                value={warranty}
                                onChange={(e) => setWarranty(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center border rounded-2xl overflow-hidden">
                                <input
                                    value={highlightInput}
                                    onChange={(e) =>
                                        setHighlightInput(e.target.value)
                                    }
                                    type="text"
                                    placeholder="Highlight"
                                    className="px-3 py-2 flex-1 outline-none border-none bg-[#f7fafd]"
                                />
                                <span
                                    onClick={() => addHighlight()}
                                    className="py-2 px-6 bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white rounded-r-2xl hover:shadow-lg cursor-pointer font-semibold transition"
                                >
                                    Add
                                </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {highlights.map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between rounded-xl items-center py-1 px-3 bg-[#e6fbff]"
                                    >
                                        <p className="text-[#019ee3] text-sm font-medium">
                                            {h}
                                        </p>
                                        <span
                                            onClick={() => deleteHighlight(i)}
                                            className="text-red-600 hover:bg-red-100 p-1 rounded-full cursor-pointer"
                                        >
                                            <DeleteIcon />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <h2 className="font-medium">Brand Details</h2>
                        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
                            <TextField
                                label="Brand"
                                type="text"
                                variant="outlined"
                                size="small"
                                required
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                            />
                            <div className="w-24 h-10 flex items-center justify-center border rounded-lg relative">
                                {!logoPreview ? (
                                    <ImageIcon />
                                ) : (
                                    <img
                                        draggable="false"
                                        src={logoPreview}
                                        alt="Brand Logo"
                                        className="w-full h-full object-contain"
                                    />
                                )}
                                <span className="text-red-500 absolute -top-1 -right-[90px]">
                                    *
                                    <span className=" text-[10px] text-gray-500">
                                        (max 500KB)
                                    </span>
                                </span>
                            </div>
                            <label className="rounded bg-primaryBlue text-center cursor-pointer text-white py-2 px-2.5 shadow hover:shadow-lg">
                                <input
                                    type="file"
                                    name="logo"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="hidden"
                                />
                                Choose Logo
                            </label>
                        </div>

                        <h2 className="font-medium">
                            Specifications{" "}
                            <span className="text-xs text-gray-500">
                                (at least 2 required)
                            </span>
                        </h2>

                        <div className="flex justify-between gap-2 items-center">
                            <TextField
                                value={specsInput.title}
                                onChange={handleSpecsChange}
                                name="title"
                                label="Name"
                                placeholder="Model No."
                                variant="outlined"
                                size="small"
                            />
                            <TextField
                                value={specsInput.description}
                                onChange={handleSpecsChange}
                                name="description"
                                label="Description"
                                placeholder="WJDK42DF5"
                                variant="outlined"
                                size="small"
                            />
                            <span
                                onClick={() => addSpecs()}
                                className="py-2 px-6 bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white rounded-2xl hover:shadow-lg cursor-pointer font-semibold transition"
                            >
                                Add
                            </span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {specs.map((spec, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between gap-2 sm:gap-5 items-center text-sm rounded-xl bg-[#e6fbff] py-1 px-3"
                                >
                                    <p className="text-[#019ee3] font-medium">
                                        {spec.title}
                                    </p>
                                    <p>{spec.description}</p>
                                    <span
                                        onClick={() => deleteSpec(i)}
                                        className="text-red-600 hover:bg-red-200 bg-red-100 p-1 rounded-full cursor-pointer"
                                    >
                                        <DeleteIcon />
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* <h2 className="font-medium">
                            Set Commission Range
                        </h2>
                        <div className="flex justify-between gap-2 items-center">
                            <TextField
                                value={commissionInput.from}
                                onChange={handleCommissionChange}
                                name="from"
                                label="from"
                                placeholder="from"
                                variant="outlined"
                                size="small"
                            />
                            <TextField
                                value={commissionInput.to}
                                onChange={handleCommissionChange}
                                name="to"
                                label="To"
                                placeholder="WJDK42DF5"
                                variant="outlined"
                                size="small"
                            />
                            <TextField
                                value={commissionInput.commission}
                                onChange={handleCommissionChange}
                                name="commission"
                                label="Commission"
                                placeholder="WJDK42DF5"
                                variant="outlined"
                                size="small"
                            />
                            <span
                                onClick={() => addCommission()}
                                className="py-2 px-6 bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white rounded-2xl hover:shadow-lg cursor-pointer font-semibold transition"
                            >
                                Add
                            </span>
                        </div> */}
                        {/* <div className="flex flex-col gap-2">
                            {commission?.map((commisson, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between gap-2 sm:gap-5 items-center text-sm rounded-xl bg-[#e6fbff] py-1 px-3"
                                >
                                    <p className="text-[#019ee3] font-medium">
                                        {commisson.from}
                                    </p>
                                    <p>{commisson.to}</p>
                                    <p>{commisson.commission}</p>
                                    <span
                                        onClick={() => deleteCommission(i)}
                                        className="text-red-600 hover:bg-red-200 bg-red-100 p-1 rounded-full cursor-pointer"
                                    >
                                        <DeleteIcon />
                                    </span>
                                </div>
                            ))}
                        </div> */}
                        <h2 className="font-medium">
                            Set Product Price Range
                        </h2>
                        <div className="flex justify-between gap-2 items-center">
                            <TextField
                                value={priceRangeInput.title}
                                onChange={handlerpiceRange}
                                name="from"
                                label="from"
                                placeholder="from"
                                variant="outlined"
                                size="small"
                            />
                            <TextField
                                value={priceRangeInput.to}
                                onChange={handlerpiceRange}
                                name="to"
                                label="To"
                                placeholder="WJDK42DF5"
                                variant="outlined"
                                size="small"
                            />
                            <TextField
                                value={priceRangeInput.price}
                                onChange={handlerpiceRange}
                                name="price"
                                label="Price"
                                placeholder="WJDK42DF5"
                                variant="outlined"
                                size="small"
                            />
                            <TextField
                                value={priceRangeInput.commission}
                                onChange={handlerpiceRange}
                                name="commission"
                                label="Commission"
                                placeholder="WJDK42DF5"
                                variant="outlined"
                                size="small"
                            />
                            <span
                                onClick={() => addPriceRange()}
                                className="py-2 px-6 bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white rounded-2xl hover:shadow-lg cursor-pointer font-semibold transition"
                            >
                                Add
                            </span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {priceRange.map((priceRange, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between gap-2 sm:gap-5 items-center text-sm rounded-xl bg-[#e6fbff] py-1 px-3"
                                >
                                    <p className="text-[#019ee3] font-medium">
                                        {priceRange.from}
                                    </p>
                                    <p>{priceRange.to}</p>
                                    <p>{priceRange.price}</p>
                                    <p>{priceRange.commission}</p>
                                    <span
                                        onClick={() => deletePriceRange(i)}
                                        className="text-red-600 hover:bg-red-200 bg-red-100 p-1 rounded-full cursor-pointer"
                                    >
                                        <DeleteIcon />
                                    </span>
                                </div>
                            ))}
                        </div>

                        <h2 className="font-medium">
                            Product Images{" "}
                            <span className="ml-2 text-xs text-gray-500">
                                (1-4 images, max 500KB each)
                            </span>
                        </h2>
                        <div className="flex gap-2 overflow-x-auto h-32 border rounded">
                            {imagesPreview.map((image, i) => (
                                <img
                                    draggable="false"
                                    src={image}
                                    alt="Product"
                                    key={i}
                                    className="w-full h-full object-contain"
                                />
                            ))}
                        </div>
                        <label className="rounded font-medium bg-primaryBlue text-center cursor-pointer text-white p-2 shadow hover:shadow-lg my-2">
                            <input
                                type="file"
                                name="images"
                                accept="image/*"
                                multiple
                                onChange={handleProductImageChange}
                                className="hidden"
                            />
                            Choose Files
                        </label>
                        <div className="flex justify-end">
                            <input
                                form="mainForm"
                                type="submit"
                                className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] uppercase w-full p-3 text-white font-semibold rounded-xl shadow hover:shadow-lg cursor-pointer transition"
                                value="Submit"
                            />
                        </div>
                    </div>
                </form>
            )}
        </>
    );
};
export default CreateProduct;
