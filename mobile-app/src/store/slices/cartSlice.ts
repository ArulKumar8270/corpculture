import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  images?: Array<{ url: string }>;
  discountPrice?: number;
  priceRange?: Array<{ from: string; to: string; price: string }>;
  deliveryCharge?: number;
  isInstalation?: boolean;
  installationCost?: number;
  sendInvoice?: boolean;
  brandName?: string;
  stock?: number;
}

interface CartState {
  items: CartItem[];
  saveLaterItems: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  saveLaterItems: [],
  total: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      // Recalculate total using priceRange logic including delivery and installation charges
      state.total = state.items.reduce((sum, item) => {
        const quantity = item.quantity || 0;
        const priceRange = item.priceRange?.find(
          (range: any) =>
            quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
        );
        const itemPrice = priceRange
          ? parseFloat(priceRange.price)
          : item.discountPrice || item.price || 0;
        const itemSubtotal = itemPrice * quantity;
        const deliveryCharge = item.deliveryCharge || 0;
        const installationCharge = item.isInstalation ? (item.installationCost || 0) : 0;
        return sum + itemSubtotal + deliveryCharge + installationCharge;
      }, 0);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
      // Recalculate total using priceRange logic including delivery and installation charges
      state.total = state.items.reduce((sum, item) => {
        const quantity = item.quantity || 0;
        const priceRange = item.priceRange?.find(
          (range: any) =>
            quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
        );
        const itemPrice = priceRange
          ? parseFloat(priceRange.price)
          : item.discountPrice || item.price || 0;
        const itemSubtotal = itemPrice * quantity;
        const deliveryCharge = item.deliveryCharge || 0;
        const installationCharge = item.isInstalation ? (item.installationCost || 0) : 0;
        return sum + itemSubtotal + deliveryCharge + installationCharge;
      }, 0);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      if (item) {
        item.quantity = action.payload.quantity;
      }
      // Recalculate total using priceRange logic including delivery and installation charges
      state.total = state.items.reduce((sum, item) => {
        const quantity = item.quantity || 0;
        const priceRange = item.priceRange?.find(
          (range: any) =>
            quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
        );
        const itemPrice = priceRange
          ? parseFloat(priceRange.price)
          : item.discountPrice || item.price || 0;
        const itemSubtotal = itemPrice * quantity;
        const deliveryCharge = item.deliveryCharge || 0;
        const installationCharge = item.isInstalation ? (item.installationCost || 0) : 0;
        return sum + itemSubtotal + deliveryCharge + installationCharge;
      }, 0);
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
    addToSaveLater: (state, action: PayloadAction<CartItem>) => {
      // Remove from cart if exists
      state.items = state.items.filter(
        (item) => item.productId !== action.payload.productId
      );
      // Add to save later if not already there
      const existingItem = state.saveLaterItems.find(
        (item) => item.productId === action.payload.productId
      );
      if (!existingItem) {
        state.saveLaterItems.push(action.payload);
      }
      // Recalculate total using priceRange logic including delivery and installation charges
      state.total = state.items.reduce((sum, item) => {
        const quantity = item.quantity || 0;
        const priceRange = item.priceRange?.find(
          (range: any) =>
            quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
        );
        const itemPrice = priceRange
          ? parseFloat(priceRange.price)
          : item.discountPrice || item.price || 0;
        const itemSubtotal = itemPrice * quantity;
        const deliveryCharge = item.deliveryCharge || 0;
        const installationCharge = item.isInstalation ? (item.installationCost || 0) : 0;
        return sum + itemSubtotal + deliveryCharge + installationCharge;
      }, 0);
    },
    removeFromSaveLater: (state, action: PayloadAction<string>) => {
      state.saveLaterItems = state.saveLaterItems.filter(
        (item) => item.productId !== action.payload
      );
    },
    moveToCart: (state, action: PayloadAction<CartItem>) => {
      // Remove from save later
      state.saveLaterItems = state.saveLaterItems.filter(
        (item) => item.productId !== action.payload.productId
      );
      // Add to cart
      const existingItem = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      // Recalculate total using priceRange logic including delivery and installation charges
      state.total = state.items.reduce((sum, item) => {
        const quantity = item.quantity || 0;
        const priceRange = item.priceRange?.find(
          (range: any) =>
            quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
        );
        const itemPrice = priceRange
          ? parseFloat(priceRange.price)
          : item.discountPrice || item.price || 0;
        const itemSubtotal = itemPrice * quantity;
        const deliveryCharge = item.deliveryCharge || 0;
        const installationCharge = item.isInstalation ? (item.installationCost || 0) : 0;
        return sum + itemSubtotal + deliveryCharge + installationCharge;
      }, 0);
    },
    updateCartItem: (
      state,
      action: PayloadAction<{
        productId: string;
        updates: Partial<CartItem>;
      }>
    ) => {
      const item = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      if (item) {
        Object.assign(item, action.payload.updates);
        // Recalculate total including delivery and installation charges
        state.total = state.items.reduce((sum, item) => {
          const quantity = item.quantity || 0;
          const priceRange = item.priceRange?.find(
            (range: any) =>
              quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
          );
          const itemPrice = priceRange
            ? parseFloat(priceRange.price)
            : item.discountPrice || item.price || 0;
          const itemSubtotal = itemPrice * quantity;
          const deliveryCharge = item.deliveryCharge || 0;
          const installationCharge = item.isInstalation ? (item.installationCost || 0) : 0;
          return sum + itemSubtotal + deliveryCharge + installationCharge;
        }, 0);
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  addToSaveLater,
  removeFromSaveLater,
  moveToCart,
  updateCartItem,
} = cartSlice.actions;
export default cartSlice.reducer;

