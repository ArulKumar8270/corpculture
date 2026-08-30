import mongoose from "mongoose";
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";
import { tryAutoAssignNewOrder } from "../../utils/tryAutoAssignNewOrder.js";
import {
  computeOrderAmountFromItems,
  getCartItemBaseUnit,
} from "../../utils/orderAmountUtil.js";
import {
  computeCompanyCreditSummary,
  userCanAccessCompany,
  recordCreditUsed,
} from "../../utils/companyCreditUtil.js";

// Create order without online payment (COD/manual)
const createOrderWithoutPayment = async (req, res) => {
  try {
    const { orderItems, shippingInfo, orderReferenceNo, paymentMethod, companyId } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).send({
        success: false,
        message: "No order items provided",
      });
    }

    const ref = String(orderReferenceNo || "").trim();
    if (!ref) {
      return res.status(400).send({
        success: false,
        message: "Order reference number is required",
      });
    }

    if (!shippingInfo || typeof shippingInfo !== "object") {
      return res.status(400).send({
        success: false,
        message: "Shipping info is required",
      });
    }

    const requiredShipping = [
      "address",
      "city",
      "country",
      "state",
      "pincode",
      "phoneNo",
    ];
    for (const k of requiredShipping) {
      if (shippingInfo[k] == null || String(shippingInfo[k]).trim() === "") {
        return res.status(400).send({
          success: false,
          message: `Shipping field '${k}' is required`,
        });
      }
    }

    // Map order items to schema format (same structure used in payment-success)
    const orderObject = orderItems.map((product) => ({
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
      seller: product.seller ? new mongoose.Types.ObjectId(product.seller) : undefined,
    }));

    const amount = computeOrderAmountFromItems(orderItems);
    const isCreditPayment = paymentMethod === "credit";
    const resolvedCompanyId =
      companyId && mongoose.Types.ObjectId.isValid(companyId)
        ? new mongoose.Types.ObjectId(companyId)
        : null;

    if (isCreditPayment) {
      if (!resolvedCompanyId) {
        return res.status(400).send({
          success: false,
          message: "Company is required to pay with credit",
        });
      }

      const canAccess = await userCanAccessCompany(req.user, resolvedCompanyId);
      if (!canAccess) {
        return res.status(403).send({
          success: false,
          message: "You do not have access to this company's credit",
        });
      }

      const { availableCredit } = await computeCompanyCreditSummary(resolvedCompanyId);
      if (amount > availableCredit) {
        return res.status(400).send({
          success: false,
          message: `Insufficient company credit. Available: ₹${availableCredit}, order total: ₹${amount}`,
          availableCredit,
          orderAmount: amount,
        });
      }
    }

    const combinedOrder = {
      paymentId: `manual_${Date.now()}`,
      products: orderObject,
      buyer: req.user._id,
      orderReferenceNo: ref,
      shippingInfo,
      amount,
      paymentMethod: isCreditPayment ? "credit" : "cash",
      paymentStatus: isCreditPayment ? "Paid" : "Unpaid",
      ...(resolvedCompanyId ? { companyId: resolvedCompanyId } : {}),
    };

    const order = new orderModel(combinedOrder);
    await order.save();

    if (isCreditPayment && resolvedCompanyId) {
      await recordCreditUsed({
        companyId: resolvedCompanyId,
        amount,
        createdBy: req.user._id,
        description: `Sales order ${ref} (${order._id})`,
      });
    }

    await tryAutoAssignNewOrder(order);

    // Reduce stock
    for (const item of orderItems) {
      const product = await productModel.findById(item?.productId);
      if (product) {
        product.stock -= item?.quantity;
        await product.save();
      } else {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
    }

    return res.status(201).send({
      success: true,
      message: "Order created (payment skipped)",
      order,
    });
  } catch (error) {
    console.error("Error creating order without payment:", error);
    return res.status(500).send({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

export default createOrderWithoutPayment;

