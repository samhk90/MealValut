import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  currentOrder: null,
  orderItems: [],
  orders: {}, // Structure: { tableId: { orderId, items: [], total: 0, status: 'pending' } },
  error: null
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    initializeOrder(state, action) {
      const { tableId, order } = action.payload;
      state.orders[tableId] = order;
    },
    addItemToOrder(state, action) {
      const { tableId, item } = action.payload;
      const order = state.orders[tableId];

      if (order) {
        const existingItem = order.items.find((i) => i.id === item.id);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          order.items.push({ ...item, quantity: 1 });
        }
        order.total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      }
    },
    updateItemQuantity(state, action) {
      const { tableId, itemId, quantity } = action.payload;
      const order = state.orders[tableId];

      if (order) {
        const item = order.items.find((i) => i.id === itemId);
        if (item) {
          if (quantity > 0) {
            item.quantity = quantity;
          } else {
            order.items = order.items.filter((i) => i.id !== itemId);
          }
          order.total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        }
      }
    },
    clearOrder(state, action) {
      const { tableId } = action.payload;
      state.orders[tableId] = { orderId: null, items: [], total: 0, status: 'pending' };
    },
  },
});

export const { initializeOrder, addItemToOrder, updateItemQuantity, clearOrder } = orderSlice.actions;

export default orderSlice.reducer;
