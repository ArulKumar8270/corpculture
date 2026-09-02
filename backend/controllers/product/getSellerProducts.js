import productModel from "../../models/productModel.js";
import { getTrashListQuery, mapWithRecordStatus } from "../../utils/softDelete.js";

const getSellerProducts = async (req, res) => {
    try {
        const { filter, options } = getTrashListQuery(req);
        const products = await productModel.find(filter).setOptions(options);
        if (!products) {
            return res.status(401).send({
                success: false,
                message: "No Products Found!",
                errorType: "productNotFound",
            });
        }
        res.status(201).send({ success: true, products: mapWithRecordStatus(products) });
    } catch (error) {
        console.log("New Product Error: " + error);
        res.status(500).send({
            success: false,
            message: "Error in getting All Products",
            error,
        });
    }
};

export default getSellerProducts;
