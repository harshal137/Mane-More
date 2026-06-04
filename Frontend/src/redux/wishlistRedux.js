import { createSlice } from "@reduxjs/toolkit";

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    products: [],
  },
  reducers: {
    addToWishlist: (state, action) => {
      const exists = state.products.find(
        (item) => item._id === action.payload._id
      );

      if (!exists) {
        state.products.push(action.payload);
      }
    },

    removeFromWishlist: (state, action) => {
      state.products = state.products.filter(
        (item) => item._id !== action.payload
      );
    },

    clearWishlist: (state) => {
      state.products = [];
    },
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist } =
  wishlistSlice.actions;

export default wishlistSlice.reducer;