import { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/auth";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import Rating from "@mui/material/Rating";
import Actions from "./Actions";
import SeoData from "../../SEO/SeoData";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

const AllProducts = () => {
    const { auth, userPermissions } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL
                    }/api/v1/product/seller-product`,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
                // console.log(res.data.products);

                res.status === 201 && setProducts(res.data.products);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);

                //server error
                error.response?.status === 500 &&
                    toast.error(
                        "Something went wrong! Please try after sometime."
                    );
            }
        };
        //initial call to fetch data from server
        fetchData();
    }, [auth.token]);
    //update products details on client side after deletion
    const updateDeletedProduct = (id) => {
        setProducts((prevProducts) => {
            // Filter out the deleted product from the previous products
            return prevProducts.filter((product) => product._id !== id);
        });
    };

    const columns = [
        {
            field: "id",
            headerName: "Product ID",
            minWidth: 100,
            flex: 0.5,
        },
        {
            field: "name",
            headerName: "Name",
            minWidth: 200,
            flex: 1,
            renderCell: (params) => {
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full">
                            <img
                                draggable="false"
                                src={params.row.image}
                                alt={params.row.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        {params.row.name}
                    </div>
                );
            },
        },
        {
            field: "category",
            headerName: "Category",
            minWidth: 100,
            flex: 0.1,
        },
        {
            field: "stock",
            headerName: "Stock",
            type: "number",
            headerAlign: "left",
            align: "left",
            minWidth: 70,
            flex: 0.1,
            renderCell: (params) => {
                return (
                    <>
                        {params.row.stock < 10 ? (
                            <span className="font-[500] text-red-700 rounded-full bg-red-200 p-1 w-6 h-6 flex items-center justify-center">
                                {params.row.stock}
                            </span>
                        ) : (
                            <span className="">{params.row.stock}</span>
                        )}
                    </>
                );
            },
        },
        {
            field: "price",
            headerName: "Price",
            type: "number",
            minWidth: 100,
            headerAlign: "left",
            align: "left",
            flex: 0.2,
            renderCell: (params) => {
                return <span>₹{params.row.price?.toLocaleString()}</span>;
            },
        },
        {
            field: "discount_price",
            headerName: "Discount Price",
            type: "number",
            minWidth: 100,
            headerAlign: "left",
            align: "left",
            flex: 0.2,
            renderCell: (params) => {
                return (
                    <span>₹{params.row.discount_price?.toLocaleString()}</span>
                );
            },
        },
        {
            field: "rating",
            headerName: "Rating",
            type: "number",
            minWidth: 100,
            flex: 0.1,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => {
                return (
                    <Rating
                        readOnly
                        value={params.row.rating}
                        size="small"
                        precision={0.5}
                    />
                );
            },
        },
        ...(hasPermission("salesAllProducts") ? [{
            field: "actions",
            headerName: "Actions",
            minWidth: 100,
            flex: 0.3,
            type: "number",
            sortable: false,
            renderCell: (params) => {
                return (
                    <Actions
                        name={params.row.name}
                        updateDeletedProduct={updateDeletedProduct}
                        id={params.row.id}
                    />
                );
            },
        }] : [])
    ];

    const rows = [];

    products?.forEach((item) => {
        rows.unshift({
            id: item._id,
            name: item.name,
            image: item.images[0]?.url,
            category: item.category,
            stock: item.stock,
            price: item.price,
            discount_price: item.discountPrice,
            rating: item.ratings,
        });
    });
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: "", commission: "" });
    const [categoryErrors, setCategoryErrors] = useState({});
    const [categoryLoading, setCategoryLoading] = useState(false);

    const handleCategoryOpen = () => {
        setCategoryModalOpen(true);
        setCategoryForm({ name: "", commission: "" });
        setCategoryErrors({});
    };

    const handleCategoryClose = () => {
        setCategoryModalOpen(false);
    };

    const handleCategoryChange = (e) => {
        setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value });
        setCategoryErrors({ ...categoryErrors, [e.target.name]: undefined });
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        let errors = {};
        if (!categoryForm.name.trim()) errors.name = "Category name is required";
        if (!categoryForm.commission || isNaN(categoryForm.commission)) errors.commission = "Commission is required and must be a number";
        if (Object.keys(errors).length > 0) {
            setCategoryErrors(errors);
            return;
        }
        setCategoryLoading(true);
        try {
            // Replace with your actual API endpoint
            await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/category/create`, {
                name: categoryForm.name.trim(),
                commission: Number(categoryForm.commission),
            }, {
                headers: { Authorization: auth.token }
            });
            toast.success("Category added successfully!");
            setCategoryModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add category");
        }
        setCategoryLoading(false);
    };
    return (
        <div className="relative p-2 w-full min-h-screen bg-gradient-to-br from-[#e6fbff] to-[#f7fafd]">
            <SeoData title="All Products - Flipkart Seller" />

            {loading ? (
                <Spinner />
            ) : (
                <div className="h-full">
                    <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow mb-4">
                        <h1 className="text-lg font-bold uppercase text-[#019ee3] tracking-wide">
                            Products
                        </h1>
                       {hasPermission("salesAllProducts")  ?  <div className="flex gap-2">
                            <Link
                                to="/admin/dashboard/add-product"
                                className="py-2 px-5 rounded-xl shadow font-semibold text-white bg-gradient-to-r from-[#019ee3] to-[#afcb09] hover:from-[#afcb09] hover:to-[#019ee3] transition"
                            >
                                + New Product
                            </Link>
                            <button
                                onClick={handleCategoryOpen}
                                className="py-2 px-5 rounded-xl shadow font-semibold text-white bg-gradient-to-r from-[#afcb09] to-[#019ee3] hover:from-[#019ee3] hover:to-[#afcb09] transition"
                            >
                                + New Category
                            </button>
                        </div> : null}
                    </div>
                    {/* Category Modal */}
                    <Dialog open={categoryModalOpen} onClose={handleCategoryClose}>
                        <DialogTitle>Add New Category</DialogTitle>
                        <form onSubmit={handleCategorySubmit}>
                            <DialogContent className="flex flex-col gap-4 min-w-[320px]">
                                <TextField
                                    label="Category Name"
                                    name="name"
                                    value={categoryForm.name}
                                    onChange={handleCategoryChange}
                                    error={!!categoryErrors.name}
                                    helperText={categoryErrors.name}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label="Commission (%)"
                                    name="commission"
                                    value={categoryForm.commission}
                                    onChange={handleCategoryChange}
                                    error={!!categoryErrors.commission}
                                    helperText={categoryErrors.commission}
                                    fullWidth
                                    required
                                    type="number"
                                    inputProps={{ min: 0 }}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCategoryClose} disabled={categoryLoading}>Cancel</Button>
                                <Button type="submit" variant="contained" color="primary" disabled={categoryLoading}>
                                    {categoryLoading ? "Saving..." : "Add Category"}
                                </Button>
                            </DialogActions>
                        </form>
                    </Dialog>
                    <div className="w-full h-[80vh] bg-white rounded-2xl shadow-xl border border-[#e6fbff] p-2">
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        pageSize: 10,
                                    },
                                },
                            }}
                            pageSizeOptions={[10]}
                            disableRowSelectionOnClick
                            disableSelectIconOnClick
                            sx={{
                                borderRadius: 3,
                                border: 'none',
                                boxShadow: 0,
                                '& .MuiDataGrid-columnHeaders': {
                                    background: 'linear-gradient(90deg, #019ee3 0%, #afcb09 100%)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: 15,
                                },
                                '& .MuiDataGrid-row': {
                                    background: '#f7fafd',
                                },
                                '& .MuiDataGrid-cell': {
                                    borderBottom: '1px solid #e6fbff',
                                },
                                '& .MuiDataGrid-footerContainer': {
                                    background: '#e6fbff',
                                },
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllProducts;
