import productModel from "../../models/productModel.js";
import cloudinary from "cloudinary";

const newProduct = async (req, res) => {
    // console.log(req.body);
    try {
        let images = [];
        if (typeof req.body.images === "string") {
            images.push(req.body.images);
        } else {
            images = req.body.images;
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
        req.body.logo
        const result = await cloudinary.v2.uploader.upload(req.body.logo, {
            folder: "brands",
        });
        const brandLogo = {
            public_id: result.public_id,
            url: result.secure_url,
        };

        req.body.brand = {
            name: req.body.brandName,
            logo: brandLogo,
        };
        req.body.images = imagesLink;
        req.body.seller = req.user._id;

        let specs = [];
        if (req.body.specifications) {
            if (typeof req.body.specifications === 'string') {
                try {
                    // If it's a single JSON string, parse it and wrap in an array
                    specs.push(JSON.parse(req.body.specifications));
                } catch (e) {
                    console.error("Error parsing single specification string:", e);
                }
            } else if (Array.isArray(req.body.specifications)) {
                // If it's an array, iterate and parse each element if they are strings
                req.body.specifications.forEach((s) => {
                    try {
                        specs.push(typeof s === 'string' ? JSON.parse(s) : s);
                    } catch (e) {
                        console.error("Error parsing specification in array:", e);
                    }
                });
            } else if (typeof req.body.specifications === 'object') {
                // If it's already a parsed object, and not an array, wrap it in an array.
                specs.push(req.body.specifications);
            }
        }
        req.body.specifications = specs;

        // let commission = [];
        // req.body.commission.forEach((s) => {
        //     commission.push(JSON.parse(s));
        // });
        // req.body.commission = commission;

        let priceRange = [];
        req.body.priceRange.forEach((s) => {
            priceRange.push(JSON.parse(s));
        });
        req.body.priceRange = priceRange;

        const product = await productModel.create(req.body);

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
