import productModel from "../../models/productModel.js";
import { restoreById, withRecordStatus, RESTORE_SUCCESS_MESSAGE } from "../../utils/softDelete.js";

const restoreProduct = async (req, res) => {
    try {
        const { productId } = req.body;

        const restored = await restoreById(productModel, productId);

        if (!restored) {
            return res.status(404).send({
                success: false,
                errorType: "productNotFound",
                message: "Product not found in trash.",
            });
        }

        res.status(200).send({
            success: true,
            message: RESTORE_SUCCESS_MESSAGE,
            product: withRecordStatus(restored),
        });
    } catch (error) {
        console.log("Restore Product Error: " + error);
        res.status(500).send({
            success: false,
            message: "Error in restoring product",
            error,
        });
    }
};

export default restoreProduct;
