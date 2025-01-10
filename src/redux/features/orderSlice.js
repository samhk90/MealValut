import { createSlice } from '@reduxjs/toolkit';
import { fetchMenuItems, placeOrder, processCheckout, updateOrder } from '../actions/orderAction';

const initialState = {
  orderItems: [],
  totalAmount: 0,
  isLoading: false,
  error: null,
  currentTableId: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  menuItems: [],
  activeOrder: null,
  orderStatus: null // 'pending' | 'processing' | 'completed' | 'failed'
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const existingItem = state.orderItems.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.orderItems.push({ ...action.payload, quantity: 1 });
      }
      state.totalAmount = state.orderItems.reduce(
        (total, item) => total + (item.price * item.quantity),
        0
      );
    },
    updateItemQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      if (quantity === 0) {
        state.orderItems = state.orderItems.filter(item => item.id !== itemId);
      } else {
        const item = state.orderItems.find(item => item.id === itemId);
        if (item) {
          item.quantity = quantity;
        }
      }
      state.totalAmount = state.orderItems.reduce(
        (total, item) => total + (item.price * item.quantity),
        0
      );
    },
    setCurrentTable: (state, action) => {
      state.currentTableId = action.payload;
    },
    clearOrder: (state) => {
      state.orderItems = [];
      state.totalAmount = 0;
      state.currentTableId = null;
    },
    setOrderStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.status = 'failed';
    },
    initializeOrderItems: (state, action) => {
      state.orderItems = action.payload.map(orderItem => ({
        ...orderItem.items,
        quantity: orderItem.quantity
      }));
      state.totalAmount = state.orderItems.reduce(
        (total, item) => total + (item.price * item.quantity), 
        0
      );
    },
    clearOrderItems: (state) => {
      state.orderItems = [];
      state.totalAmount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Menu Items
      .addCase(fetchMenuItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menuItems = action.payload;
        state.error = null;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Place Order
      .addCase(placeOrder.pending, (state) => {
        state.isLoading = true;
        state.orderStatus = 'processing';
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeOrder = action.payload;
        state.orderStatus = 'pending';
        state.error = null;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.orderStatus = 'failed';
      })
      // Process Checkout
      .addCase(processCheckout.pending, (state) => {
        state.isLoading = true;
        state.orderStatus = 'processing';
      })
      .addCase(processCheckout.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeOrder = action.payload;
        state.orderStatus = 'completed';
        state.orderItems = [];
        state.totalAmount = 0;
        state.error = null;
      })
      .addCase(processCheckout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.orderStatus = 'failed';
      })
      // Update Order
      .addCase(updateOrder.pending, (state) => {
        state.isLoading = true;
        state.orderStatus = 'processing';
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeOrder = action.payload;
        state.orderStatus = 'updated';
        state.error = null;
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.orderStatus = 'failed';
      });
  }
});

export const {
  addItem,
  updateItemQuantity,
  setCurrentTable,
  clearOrder,
  setOrderStatus,
  setError,
  initializeOrderItems,
  clearOrderItems
} = orderSlice.actions;

// Selectors
export const selectOrderItems = state => state.order?.orderItems || [];
export const selectTotalAmount = state => state.order?.totalAmount || 0;
export const selectCurrentTableId = state => state.order?.currentTableId || null;
export const selectMenuItems = state => state.order?.menuItems || [];
export const selectActiveOrder = state => state.order?.activeOrder || null;
export const selectOrderStatus = state => state.order?.orderStatus || null;

export default orderSlice.reducer;
