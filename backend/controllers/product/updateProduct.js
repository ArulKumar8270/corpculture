import productModel from "../../models/productModel.js";
import cloudinary from "cloudinary";
import { sanitizeProductBody } from "../../utils/sanitizeProductBody.js";

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(401).send({
                success: false,
                message: "No Product Found",
                errorType: "productNotFound",
            });
        }

        const body = sanitizeProductBody(req.body);

        // Handle removed images
        let publicIdToDelete = body.removedImages;
        if (typeof publicIdToDelete === "string") {
            await cloudinary.v2.uploader.destroy(publicIdToDelete);
        } else if (
            Array.isArray(publicIdToDelete) &&
            publicIdToDelete.length > 0
        ) {
            await Promise.all(
                publicIdToDelete.map((id) => cloudinary.v2.uploader.destroy(id))
            );
        }

        // Handle images upload
        let imagesLink = [];
        const images = Array.isArray(body.images)
            ? body.images
            : body.images
            ? [body.images]
            : []; // Default to an empty array if no images are provided

        if (images && images.length > 0) {
            for (const image of images) {
                const result = await cloudinary.v2.uploader.upload(image, { 
                    folder: "products",
                });
                imagesLink.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                });
            }
        }

        // Update brand logo
        let brandLogo = null;
        const oldLogo = body.oldLogo ? JSON.parse(body.oldLogo) : null;
        if (body.logo && body.logo !== "null") {
            const result = await cloudinary.v2.uploader.upload(body.logo, {
                folder: "brands",
            });
            brandLogo = {
                public_id: result.public_id,
                url: result.secure_url,
            };
        }

        // Update product fields
        product.brand = {
            name: body.brandName,
            logo: brandLogo || oldLogo,
        };

        const oldImages = body.oldImages
            ? JSON.parse(body.oldImages)
            : [];
        product.images = [...oldImages, ...imagesLink];

        product.name = body.name || product.name;
        if (body.warranty !== undefined) product.warranty = body.warranty;
        if (body.corpcultureWarranty !== undefined) product.corpcultureWarranty = body.corpcultureWarranty;
        if (body.orderReferenceNo !== undefined) product.orderReferenceNo = body.orderReferenceNo;
        product.stock = body.stock || product.stock;
        product.category = body.category || product.category;
        product.description = body.description || product.description;
        product.price = body.price || product.price;
        if (body.discountPrice !== undefined) product.discountPrice = body.discountPrice;
        if (body.installationCost !== undefined) product.installationCost = body.installationCost;
        if (body.deliveryCharge !== undefined) product.deliveryCharge = body.deliveryCharge;
        if (body.weight !== undefined) product.weight = body.weight;
        if (body.length !== undefined) product.length = body.length;
        if (body.width !== undefined) product.width = body.width;
        if (body.height !== undefined) product.height = body.height;
        product.ratings = body.ratings || product.ratings;
        product.highlights = body.highlights || product.highlights;

        if (Array.isArray(body.specifications)) {
            product.specifications = body.specifications;
        }

        if (Array.isArray(body.priceRange)) {
            product.priceRange = body.priceRange;
        }

        // Save the updated product
        const updatedProduct = await product.save();
        res.status(201).send({
            success: true,
            updatedProduct,
        });
    } catch (error) {
        console.error("Updating Product Error: ", error);
        res.status(500).send({
            success: false,
            message: "Error in Updating Product",
            error,
        });
    }
};

export default updateProduct;
