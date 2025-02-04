import { supabase } from '../../components/SupabaseClient';
import {
  setLoading,
  setError,
  setItems,
  setCategories,
  setCurrentTableOrder,
  setOrderItems,
  clearOrder
} from '../features/orderSlice';

export const fetchItems = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        store:storeid (id, name),
        category:category (id, name)
      `);

    if (error) throw error;

    const transformedItems = data?.map(item => ({
      ...item,
      storeName: item.store?.name || 'Unknown Store',
      categoryName: item.category?.name || 'Uncategorized'
    })) || [];

    dispatch(setItems(transformedItems));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchCategories = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const { data, error } = await supabase
      .from('category')
      .select('*')
      .order('name');

    if (error) throw error;
    dispatch(setCategories(data || []));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchTableOrder = (tableId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const { data: orderData, error: orderError } = await supabase
      .from('order_tables')
      .select(`
        tableid,
        orderid,
        orders:orderid (
          id,
          status,
          total_amount,
          receipt_no,
          tax,
          created_at,
          order_items (
            id,
            quantity,
            price,
            total_price,
            items (
              id,
              name,
              price,
              category,
              storeid
            )
          )
        )
      `)
      .eq('tableid', tableId)
      .eq('orders.status', 'pending')
      .order('created_at', { ascending: false });

    if (orderError) throw orderError;

    if (orderData?.[0]?.orders) {
      const orderInfo = orderData[0];
      dispatch(setCurrentTableOrder({
        orderid: orderInfo.orders.id,
        orders: {
          ...orderInfo.orders,
          total_amount: parseFloat(orderInfo.orders.total_amount || 0),
          tax: parseFloat(orderInfo.orders.tax || 0)
        }
      }));

      if (orderInfo.orders.order_items) {
        const existingItems = orderInfo.orders.order_items.map(orderItem => ({
          id: orderItem.items.id,
          name: orderItem.items.name,
          price: parseFloat(orderItem.items.price || 0),
          quantity: parseInt(orderItem.quantity || 0),
          category: orderItem.items.category,
          storeid: orderItem.items.storeid,
          total_price: parseFloat(orderItem.total_price || 0)
        }));
        dispatch(setOrderItems(existingItems));
      }
    }
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const placeOrder = (orderData, table, user) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const { orderItems, total_amount, tax } = orderData;
    const receipt_no = Date.now() + Math.floor(Math.random() * 1000);

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_type: 'dine in',
        total_amount,
        status: 'pending',
        completed_at: new Date().toISOString(),
        storeid: table.storeid,
        created_at: new Date().toLocaleDateString(),
        userid: user.id,
        tax,
        receipt_no
      })
      .select()
      .single();

    if (orderError) throw orderError;

    await supabase
      .from('order_tables')
      .insert({
        orderid: newOrder.id,
        tableid: table.id
      });

    await supabase
      .from('order_items')
      .insert(orderItems.map(item => ({
        orderid: newOrder.id,
        itemid: item.id,
        quantity: item.quantity,
        price: +item.price.toFixed(2),
        total_price: +(item.price * item.quantity).toFixed(2)
      })));

    await supabase
      .from('table')
      .update({ is_occupied: true })
      .eq('id', table.id);

    dispatch(clearOrder());
    return newOrder.id;
  } catch (error) {
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const addOrderItem = (item) => ({
    type: 'order/addOrderItem',
    payload: item
  });
  
  export const updateOrderItemQuantity = ({ itemId, quantity }) => ({
    type: 'order/updateOrderItemQuantity',
    payload: { itemId, quantity }
  });