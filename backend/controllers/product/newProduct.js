import productModel from "../../models/productModel.js";
import cloudinary from "cloudinary";
import { sanitizeProductBody } from "../../utils/sanitizeProductBody.js";

const newProduct = async (req, res) => {
    try {
        const body = sanitizeProductBody(req.body);

        let images = [];
        if (typeof body.images === "string") {
            images.push(body.images);
        } else {
            images = body.images;
        }

        const imagesLink = [];

        for (let i = 0; i < images?.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLink.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        }

        let brandLogo = undefined;
        if (body.logo && body.logo !== "undefined" && body.logo !== "null") {
            const result = await cloudinary.v2.uploader.upload(body.logo, {
                folder: "brands",
            });
            brandLogo = {
                public_id: result.public_id,
                url: result.secure_url,
            };
        }

        body.brand = {
            name: body.brandName,
            ...(brandLogo ? { logo: brandLogo } : {}),
        };
        body.images = imagesLink;
        body.seller = req.user._id;

        const product = await productModel.create(body);

        res.status(201).send({
            success: true,
            product,
        });
    } catch (error) {
        console.log("New Product Error: " + error);
        res.status(500).send({
            success: false,
            message: "Error in adding New Product",
            error,
        });
    }
};

export default newProduct;
