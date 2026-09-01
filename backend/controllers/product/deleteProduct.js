import productModel from "../../models/productModel.js";
import userModel from "../../models/userModel.js";
import { softDeleteById, TRASH_SUCCESS_MESSAGE } from "../../utils/softDelete.js";

const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.body;

        const response = await softDeleteById(productModel, productId, req.user?._id);

        if (!response) {
            return res.status(401).send({
                success: false,
                errorType: "productNotFound",
                message: "Product Not Found",
            });
        }

        // Remove the product from all users' wishlists (no longer available)
        await userModel.updateMany(
            { wishlist: productId },
            { $pull: { wishlist: productId } }
        );

        res.status(201).send({
            success: true,
            message: TRASH_SUCCESS_MESSAGE,
        });
    } catch (error) {
        console.log("New Product Error: " + error);
        res.status(500).send({
            success: false,
            message: "Error in moving product to trash",
            error,
        });
    }
};

export default deleteProduct;
