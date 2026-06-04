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
    (item) => item._id === action.payload._id
  );

  if (existingProduct) {
    // Same product: only increase item quantity
    existingProduct.quantity += action.payload.quantity;
    existingProduct.price = action.payload.price;
  } else {
    // New product: add to cart
    state.products.push(action.payload);
  }

  recalculateCart(state);
},

removeProduct: (state, action) => {
  state.products = state.products.filter(
    (item) => item._id !== action.payload._id
  );

  recalculateCart(state);
},

updateQuantity: (state, action) => {
  const product = state.products.find(
    (item) => item._id === action.payload._id
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