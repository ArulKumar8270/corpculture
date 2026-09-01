import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import {
    computeOrderAmountFromItems,
    getCartItemBaseUnit,
} from "./orderAmountUtil.js";

/** Build a trusted cart line from database product + client quantity. */
export const resolveServerCartItem = (dbProduct, clientItem) => {
    const quantity = Number(clientItem?.quantity) || 0;
    if (quantity <= 0) {
        throw new Error(`Invalid quantity for product "${dbProduct.name}"`);
    }
    if (quantity > dbProduct.stock) {
        throw new Error(`Insufficient stock for "${dbProduct.name}"`);
    }

    return {
        name: dbProduct.name,
        image: clientItem?.image || dbProduct.images?.[0]?.url,
        sendInvoice: Boolean(dbProduct.sendInvoice),
        isInstalation: Boolean(dbProduct.isInstalation),
        brandName: dbProduct.brand?.name || clientItem?.brandName,
        priceRange: dbProduct.priceRange,
        discountPrice: dbProduct.discountPrice,
        deliveryCharge: Number(dbProduct.deliveryCharge) || 0,
        installationCost: dbProduct.isInstalation
            ? Number(dbProduct.installationCost) || 0
            : 0,
        quantity,
        productId: dbProduct._id,
        seller: dbProduct.seller,
    };
};

/** Map validated items to order schema format. */
export const mapValidatedOrderItems = (validatedItems) =>
    validatedItems.map((product) => ({
        name: product.name,
        image: product.image,
        sendInvoice: product.sendInvoice,
        isInstalation: product.isInstalation,
        brandName: product.brandName,
        price: getCartItemBaseUnit(product),
        discountPrice: product.discountPrice,
        deliveryCharge: product.deliveryCharge,
        installationCost: product.installationCost,
        quantity: product.quantity,
        productId: product.productId,
        seller: product.seller
            ? new mongoose.Types.ObjectId(product.seller)
            : undefined,
    }));

/**
 * Recompute order totals from database product prices (never trust client prices).
 * Returns { items, amount } or { error }.
 */
export const validateAndPriceOrderItems = async (orderItems) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return { error: "No order items provided" };
    }

    const validated = [];
    for (const item of orderItems) {
        const productId = item?.productId;
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return { error: "Invalid product ID in order" };
        }

        const dbProduct = await productModel.findById(productId);
        if (!dbProduct) {
            return { error: `Product not found: ${productId}` };
        }

        try {
            validated.push(resolveServerCartItem(dbProduct, item));
        } catch (err) {
            return { error: err.message };
        }
    }

    const amount = computeOrderAmountFromItems(validated);
    if (!(amount > 0)) {
        return { error: "Order amount must be greater than 0" };
    }

    return { items: validated, amount };
};
