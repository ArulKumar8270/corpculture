/** Unit product price from cart/catalog item (price range or discount). */
export const getCartItemBaseUnit = (item: any) => {
  const quantity = Number(item?.quantity) || 0;
  const priceRange = item?.priceRange?.find(
    (range: any) =>
      quantity >= parseFloat(String(range.from)) &&
      quantity <= parseFloat(String(range.to))
  );
  return priceRange
    ? parseFloat(String(priceRange.price))
    : Number(item?.discountPrice) || 0;
};

/** Line total for a cart item: (base × qty) + delivery + installation. */
export const getCartItemLineTotal = (item: any) => {
  const qty = Number(item?.quantity) || 0;
  const base = getCartItemBaseUnit(item);
  const delivery = Number(item?.deliveryCharge) || 0;
  const install = item?.isInstalation ? Number(item?.installationCost) || 0 : 0;
  return base * qty + delivery + install;
};

/** Order total from cart items. */
export const computeOrderAmountFromItems = (orderItems: any[]) => {
  if (!Array.isArray(orderItems)) return 0;
  return Number(
    orderItems.reduce((sum, item) => sum + getCartItemLineTotal(item), 0)
  );
};

/**
 * Base unit on persisted order lines (excludes flat delivery/installation).
 * Legacy orders stored price as base + delivery + installation.
 */
export const getStoredOrderProductBaseUnit = (product: any) => {
  const price = Number(product?.price) || 0;
  const discount = Number(product?.discountPrice) || 0;
  const delivery = Number(product?.deliveryCharge) || 0;
  const install = product?.isInstalation ? Number(product?.installationCost) || 0 : 0;
  const flatFees = delivery + install;

  if (flatFees <= 0) {
    return price || discount;
  }

  if (discount > 0 && Math.abs(price - discount - flatFees) < 0.01) {
    return discount;
  }

  return price || discount;
};

/** Line total from a persisted order product line. */
export const getStoredOrderProductLineTotal = (product: any) => {
  const qty = Number(product?.quantity) || 1;
  const base = getStoredOrderProductBaseUnit(product);
  const delivery = Number(product?.deliveryCharge) || 0;
  const install = product?.isInstalation ? Number(product?.installationCost) || 0 : 0;
  return base * qty + delivery + install;
};

/** Sum of line totals for persisted order products. */
export const computeOrderAmountFromStoredProducts = (products: any[]) => {
  if (!Array.isArray(products)) return 0;
  return Number(
    products.reduce((sum, p) => sum + getStoredOrderProductLineTotal(p), 0)
  );
};
