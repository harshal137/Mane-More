// In your cartRedux.js file
import { createSlice } from "@reduxjs/toolkit";

const recalculateCart = (state) => {
  // Badge count = unique products only
  state.quantity = state.products.length;

  // Total price = product price * product quantity
  state.total = state.products.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );
};

const isSameCartItem = (item, payload) =>
  item._id === payload._id &&
  (item.selectedSize || null) === (payload.selectedSize || null);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    products: [],
    quantity: 0,
    total: 0,
  },
  reducers: {
   addProduct: (state, action) => {
  const existingProduct = state.products.find(
    (item) => isSameCartItem(item, action.payload)
  );

  if (existingProduct) {
    // Same product and size: only increase item quantity.
    existingProduct.quantity += action.payload.quantity;
    existingProduct.price = action.payload.price;
    existingProduct.selectedSizePrice = action.payload.selectedSizePrice || null;
  } else {
    // New product: add to cart
    state.products.push(action.payload);
  }

  recalculateCart(state);
},

removeProduct: (state, action) => {
  state.products = state.products.filter(
    (item) => !isSameCartItem(item, action.payload)
  );

  recalculateCart(state);
},

updateQuantity: (state, action) => {
  const product = state.products.find(
    (item) => isSameCartItem(item, action.payload)
  );

  if (product) {
    product.quantity = action.payload.quantity;
  }

  recalculateCart(state);
},

clearCart: (state) => {
  state.products = [];
  state.quantity = 0;
  state.total = 0;
},
  },
});

export const { addProduct, removeProduct, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
