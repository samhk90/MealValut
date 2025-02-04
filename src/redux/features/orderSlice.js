import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    items: [],
    categories: [],
    orderItems: [],
    currentTableOrder: null,
    loading: false,
    error: null
  },
  reducers: {
    addOrderItem: (state, action) => {
      const existingItem = state.orderItems.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.orderItems.push({ ...action.payload, quantity: 1 });
      }
    },
    updateOrderItemQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      if (quantity === 0) {
        state.orderItems = state.orderItems.filter(item => item.id !== itemId);
      } else {
        const item = state.orderItems.find(item => item.id === itemId);
        if (item) {
          item.quantity = quantity;
        }
      }
    }
  }
});

export const { addOrderItem, updateOrderItemQuantity } = orderSlice.actions;
export default orderSlice.reducer;