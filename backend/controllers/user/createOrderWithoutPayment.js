import mongoose from "mongoose";
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";

const computeAmountFromItems = (orderItems) => {
  const getUnitBase = (item) => {
    const quantity = item.quantity || 0;
    const priceRange = item.priceRange?.find(
      (range) =>
        quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
    );
    return priceRange ? parseFloat(priceRange.price) : item.discountPrice || 0;
  };

  const subtotal = orderItems.reduce((sum, item) => {
    const unit = getUnitBase(item);
    return sum + unit * (item.quantity || 0);
  }, 0);

  const totalDeliveryCharges = orderItems.reduce(
    (sum, item) => sum + (item.deliveryCharge || 0),
    0
  );

  const totalInstallationCharges = orderItems.reduce(
    (sum, item) =>
      sum + (item.isInstalation ? item.installationCost || 0 : 0),
    0
  );

  return Number(subtotal + totalDeliveryCharges + totalInstallationCharges);
};

// Create order without online payment (COD/manual)
const createOrderWithoutPayment = async (req, res) => {
  try {
    const { orderItems, shippingInfo, orderReferenceNo } = req.body;

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
      price: (() => {
        const quantity = product.quantity || 0;
        const priceRange = product.priceRange?.find(
          (range) =>
            quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
        );
        const basePrice = priceRange
          ? parseFloat(priceRange.price)
          : product.discountPrice || 0;
        const deliveryCost = product.deliveryCharge || 0;
        const installationCost = product.isInstalation
          ? product.installationCost || 0
          : 0;
        return basePrice + deliveryCost + installationCost;
      })(),
      discountPrice: product.discountPrice,
      deliveryCharge: product.deliveryCharge,
      installationCost: product.installationCost,
      quantity: product.quantity,
      productId: product.productId,
      seller: product.seller ? new mongoose.Types.ObjectId(product.seller) : undefined,
    }));

    const amount = computeAmountFromItems(orderItems);

    const combinedOrder = {
      paymentId: `manual_${Date.now()}`,
      products: orderObject,
      buyer: req.user._id,
      orderReferenceNo: ref,
      shippingInfo,
      amount,
    };

    const order = new orderModel(combinedOrder);
    await order.save();

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

