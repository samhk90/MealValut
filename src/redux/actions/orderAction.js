import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../components/SupabaseClient';

// Data abstraction for order creation
const createOrderData = ({
  tableId,
  orderItems,
  totalAmount,
  userId,
  storeId,
  customerInfo = {},
  tax = 0,
  discount = 0
}) => {
  const orderData = {
    order_type: 'dine-in',
    total_amount: totalAmount,
    status: 'pending',
    completed_at: new Date().toISOString(),
    customer_name: customerInfo.name || 'N/A',
    customer_address: customerInfo.address || 'N/A',
    customer_mno: customerInfo.phone || 0,
    order_notes: customerInfo.notes || 'N/A',
    storeid: storeId,
    userid: userId,
    tax,
    discount,
    receipt_no: Date.now() // This should be handled by your backend sequence
  };

  const orderItemsData = orderItems.map(item => ({
    itemid: item.id,
    quantity: item.quantity,
    price: item.price,
    total_price: item.price * item.quantity
  }));

  return { orderData, orderItemsData };
};

// Fetch menu items
export const fetchMenuItems = createAsyncThunk(
  'order/fetchMenuItems',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Updated store fetching logic using user_store table
const fetchUserStore = async (userId) => {
  try {
    // Fetch store through user_store junction table
    const { data: userStore, error: userStoreError } = await supabase
      .from('user_store')
      .select(`
        storeid,
        store (
          id,
          name,
          companyid,
          address,
          isactive
        )
      `)
      .eq('userid', userId)
      .single();

    if (userStoreError) throw new Error('Failed to fetch user store: ' + userStoreError.message);
    if (!userStore) throw new Error('No store assigned to this user');
    if (!userStore.store.isactive) throw new Error('Store is not active');

    return {
      store: userStore.store,
      storeId: userStore.storeid
    };
  } catch (error) {
    throw error;
  }
};

// Place order with updated store fetching
export const placeOrder = createAsyncThunk(
  'order/placeOrder',
  async ({ tableId, orderItems, totalAmount, userId }, { rejectWithValue }) => {
    try {
      // Fetch user's store
      const { store } = await fetchUserStore(userId);
      
      // Calculate receipt number using timestamp and random number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const receiptNo = parseInt(`${timestamp}${random}`.slice(-8));

      // Create order with store ID
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_type: 'dine-in',
          total_amount: totalAmount,
          status: 'pending',
          completed_at: new Date().toISOString(),
          customer_name: 'N/A',
          customer_address: 'N/A',
          customer_mno: 0,
          order_notes: 'Dine-in order',
          storeid: store.id, // Use the fetched store ID
          userid: userId,
          tax: +(totalAmount * 0.1).toFixed(2),
          discount: 0,
          receipt_no: receiptNo,// Add company reference if needed
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(orderError.message);
      }

      // Then create order items
      const orderItemsData = orderItems.map(item => ({
        orderid: order.id,
        itemid: item.id,
        quantity: item.quantity,
        price: +item.price.toFixed(2),
        total_price: +(item.price * item.quantity).toFixed(2)
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(itemsError.message);
      }

      // Fetch complete order
      const { data: completeOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          store (id, name),
          order_items (
            id,
            itemid,
            quantity,
            price,
            total_price
          )
        `)
        .eq('id', order.id)
        .single();

      if (fetchError) {
        console.error('Fetch complete order error:', fetchError);
        throw new Error(fetchError.message);
      }

      return completeOrder;
    } catch (error) {
      console.error('Place order error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Add new action for updating order
export const updateOrder = createAsyncThunk(
  'order/updateOrder',
  async ({ orderId, orderItems, totalAmount, userId, tableId }, { rejectWithValue }) => {
    try {
      // Update the existing order
      const { data: updatedOrder, error: orderError } = await supabase
        .from('orders')
        .update({
          total_amount: totalAmount,
          updated_at: new Date().toISOString(),
          tableid: tableId // Add tableid to update
        })
        .eq('id', orderId)
        .select()
        .single();

      if (orderError) throw orderError;

      // Delete existing order items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('orderid', orderId);

      if (deleteError) throw deleteError;

      // Insert new order items
      const orderItemsData = orderItems.map(item => ({
        orderid: orderId,
        itemid: item.id,
        quantity: item.quantity,
        price: +item.price.toFixed(2),
        total_price: +(item.price * item.quantity).toFixed(2)
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Fetch updated order with items
      const { data: completeOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            itemid,
            quantity,
            price,
            total_price,
            items (
              id,
              name,
              price,
              category
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      return completeOrder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Process checkout
export const processCheckout = createAsyncThunk(
  'order/processCheckout',
  async ({ orderId, paymentDetails }, { rejectWithValue }) => {
    try {
      const { data: updatedOrder, error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_amount: paymentDetails.amount,
          order_notes: `Completed payment via ${paymentDetails.method}`
        })
        .eq('id', orderId)
        .select()
        .single();

      if (orderError) throw orderError;

      return updatedOrder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Optional: Fetch order by ID
export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            itemid,
            quantity,
            price,
            total_price,
            items (*)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
