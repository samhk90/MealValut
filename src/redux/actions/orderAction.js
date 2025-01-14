import { supabase } from '../../components/SupabaseClient';
import {
    setLoading,
    setCurrentOrder,
    setOrderItems,
    setMenuItems,
    setCategories,
    setPreviousOrderItems,
    setError,
    clearError
} from '../features/orderSlice';

// Fetch menu items
export const fetchMenuItems = () => async (dispatch) => {
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

        dispatch(setMenuItems(transformedItems));
    } catch (error) {
        dispatch(setError(error.message));
    } finally {
        dispatch(setLoading(false));
    }
};

// Fetch categories
export const fetchCategories = () => async (dispatch) => {
    try {
        const { data, error } = await supabase
            .from('category')
            .select('*')
            .order('name');

        if (error) throw error;
        dispatch(setCategories(data || []));
    } catch (error) {
        dispatch(setError(error.message));
    }
};

// Place or update order
export const placeOrder = (orderData) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        const { currentOrder, orderItems, table, isTakeaway, user } = orderData;
        
        let orderId;
        const receipt_no = Date.now() + Math.floor(Math.random() * 1000);

        if (currentOrder) {
            // Update existing order
            const { data, error } = await supabase
                .from('orders')
                .update(orderData.updateData)
                .eq('id', currentOrder.orderid)
                .select();

            if (error) throw error;
            orderId = currentOrder.orderid;
        } else {
            // Create new order
            const { data, error } = await supabase
                .from('orders')
                .insert({
                    order_type: isTakeaway ? 'takeaway' : 'dine-in',
                    total_amount: orderData.total_amount,
                    status: 'pending',
                    storeid: table.storeid,
                    userid: user.id,
                    tax: orderData.tax,
                    receipt_no
                })
                .select()
                .single();

            if (error) throw error;
            orderId = data.id;

            if (!isTakeaway) {
                await supabase
                    .from('order_tables')
                    .insert({
                        orderid: orderId,
                        tableid: table.id
                    });
            }
        }

        // Handle order items
        if (currentOrder) {
            await supabase
                .from('order_items')
                .delete()
                .eq('orderid', orderId);
        }

        await supabase
            .from('order_items')
            .insert(orderItems.map(item => ({
                orderid: orderId,
                itemid: item.id,
                quantity: item.quantity,
                price: +item.price.toFixed(2),
                total_price: +(item.price * item.quantity).toFixed(2)
            })));

        dispatch(fetchTableOrder(table.id));
    } catch (error) {
        dispatch(setError(error.message));
    } finally {
        dispatch(setLoading(false));
    }
};

// Fetch previous order items
export const fetchPreviousOrder = (orderId) => async (dispatch) => {
    try {
        const { data, error } = await supabase
            .from('order_items')
            .select(`
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
            `)
            .eq('orderid', orderId);

        if (error) throw error;
        dispatch(setPreviousOrderItems(data || []));
    } catch (error) {
        console.error('Error fetching previous order:', error);
        dispatch(setPreviousOrderItems([]));
    }
};

export const fetchTableOrder = (tableId) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        dispatch(clearError());

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
            .order('orderid', { ascending: false })
            .limit(1)
            .single();

        if (orderError) throw orderError;

        if (orderData?.orders) {
            const formattedOrder = {
                orderid: orderData.orders.id,
                orders: {
                    ...orderData.orders,
                    total_amount: parseFloat(orderData.orders.total_amount || 0),
                    tax: parseFloat(orderData.orders.tax || 0)
                }
            };

            dispatch(setCurrentOrder(formattedOrder));

            if (orderData.orders.order_items) {
                const existingItems = orderData.orders.order_items.map(orderItem => ({
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
        console.log('fetchTableOrder error:', error.message);
        dispatch(setCurrentOrder(null));
        dispatch(setOrderItems([]));
    } finally {
        dispatch(setLoading(false));
    }
};
