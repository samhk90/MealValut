import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';
import CheckoutModal from './CheckoutModal';
import { useSelector } from 'react-redux';
import { supabase } from './SupabaseClient';

export default function OrderModal({ table, isOpen, onClose, onUpdateStatus, isTakeaway = false, existingOrder = null }) {
    const [orderItems, setOrderItems] = useState([]);
    const [items, setItems] = useState([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [currentTableOrder, setCurrentTableOrder] = useState(null);
    const user = useSelector((state) => state.auth.user);

    // Add debug logging
    console.log('OrderModal rendered:', { table, isOpen });

    // Fetch items from Supabase
    const getItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select(`
                    *,
                    store:storeid (
                        id,
                        name
                    ),
                    category:category (
                        id,
                        name
                    )
                `);

            if (error) throw error;

            const transformedItems = data?.map(item => ({
                ...item,
                storeName: item.store?.name || 'Unknown Store',
                categoryName: item.category?.name || 'Uncategorized'
            })) || [];

            setItems(transformedItems);
        } catch (error) {
            console.error('Error fetching items:', error.message);
            setItems([]);
        }
    };

    // Fetch orders associated with the current table
    const fetchTableOrders = async () => {
        if (!table?.id) return;

        try {
            // First fetch the most recent order_tables entry for this table
            const { data: tableOrderData, error: tableOrderError } = await supabase
                .from('order_tables')
                .select(`
                    tableid,
                    orderid,
                    orders:orderid (
                        created_at
                    )
                `)
                .eq('tableid', table.id)
                .order('orderid', { ascending: false }) // Fix the order clause
                .limit(1);

            console.log('Table order data:', tableOrderData);

            if (tableOrderError) throw tableOrderError;

            if (!tableOrderData?.[0]?.orderid) {
                console.log('No order found for table:', table.id);
                setCurrentTableOrder(null);
                setOrderItems([]);
                return;
            }

            // Then fetch the complete order details
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select(`
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
                `)
                .eq('id', tableOrderData[0].orderid)
                .eq('status', 'pending')
                .single();

            console.log('Order details:', orderData);

            if (orderError) {
                if (orderError.code === 'PGRST116') {
                    console.log('No pending order found');
                    setCurrentTableOrder(null);
                    setOrderItems([]);
                    return;
                }
                throw orderError;
            }

            if (orderData) {
                const formattedOrder = {
                    orderid: orderData.id,
                    orders: {
                        ...orderData,
                        total_amount: parseFloat(orderData.total_amount || 0),
                        tax: parseFloat(orderData.tax || 0)
                    }
                };

                setCurrentTableOrder(formattedOrder);

                // Transform order items
                const existingItems = orderData.order_items?.map(orderItem => ({
                    id: orderItem.items.id,
                    name: orderItem.items.name,
                    price: parseFloat(orderItem.items.price || 0),
                    quantity: parseInt(orderItem.quantity || 0),
                    category: orderItem.items.category,
                    storeid: orderItem.items.storeid,
                    total_price: parseFloat(orderItem.total_price || 0)
                })) || [];

                console.log('Setting order items:', existingItems);
                setOrderItems(existingItems);
            }
        } catch (error) {
            console.error('Error fetching table orders:', error);
            setCurrentTableOrder(null);
            setOrderItems([]);
        }
    };

    // Add items to the order
    const addToOrder = (item) => {
        const existingItem = orderItems.find(orderItem => orderItem.id === item.id);
        if (existingItem) {
            setOrderItems(orderItems.map(orderItem =>
                orderItem.id === item.id
                    ? { ...orderItem, quantity: orderItem.quantity + 1 }
                    : orderItem
            ));
        } else {
            setOrderItems([...orderItems, { ...item, quantity: 1 }]);
        }
    };

    // Update item quantities
    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity === 0) {
            setOrderItems(orderItems.filter(item => item.id !== itemId));
        } else {
            setOrderItems(orderItems.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            ));
        }
    };

    // Calculate total amount
    const getTotalAmount = () => {
        return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const handlePlaceOrder = async () => {
        if (orderItems.length > 0) {
            try {
                let orderId;
                let total_amount = getTotalAmount();
                const tax = +(total_amount * 0.1).toFixed(2);
                total_amount = +(total_amount + tax).toFixed(2);
                
                // Generate receipt number (timestamp + random number)
                const receipt_no = Date.now()+Math.floor(Math.random() * 1000);

                if (currentTableOrder) {
                    // Update existing order
                    const { data: updatedOrder, error: updateError } = await supabase
                        .from('orders')
                        .update({
                            total_amount: total_amount,
                            tax: tax,
                            receipt_no: receipt_no // Add receipt number to update
                        })
                        .eq('id', currentTableOrder.orderid)
                        .select()
                        .single();

                    if (updateError) throw updateError;
                    orderId = currentTableOrder.orderid;

                    // Delete existing items
                    await supabase
                        .from('order_items')
                        .delete()
                        .eq('orderid', orderId);

                    // Insert new items
                    const { error: itemsError } = await supabase
                        .from('order_items')
                        .insert(orderItems.map(item => ({
                            orderid: orderId,
                            itemid: item.id,
                            quantity: item.quantity,
                            price: +item.price.toFixed(2),
                            total_price: +(item.price * item.quantity).toFixed(2)
                        })));

                    if (itemsError) throw itemsError;

                    // Show success message and close modal
                    alert('Order updated successfully!');
                    onClose();
                    return;
                } else {
                    // Create new order
                    const { data: newOrder, error: orderError } = await supabase
                        .from('orders')
                        .insert({
                            order_type: 'dine-in',
                            total_amount,
                            status: 'pending',
                            completed_at: new Date().toISOString(),
                            storeid: table.storeid,
                            userid: user.id,
                            tax,
                            receipt_no: receipt_no // Add receipt number to new order
                        })
                        .select()
                        .single();

                    if (orderError) throw orderError;
                    orderId = newOrder.id;

                    // Create order_tables entry
                    const { error: tableOrderError } = await supabase
                        .from('order_tables')
                        .insert({
                            orderid: orderId,
                            tableid: table.id
                        });

                    if (tableOrderError) throw tableOrderError;
                }

                // Insert order items
                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItems.map(item => ({
                        orderid: orderId,
                        itemid: item.id,
                        quantity: item.quantity,
                        price: +item.price.toFixed(2),
                        total_price: +(item.price * item.quantity).toFixed(2)
                    })));

                if (itemsError) throw itemsError;

                // Update table status
                await onUpdateStatus(table.id, true);
                
                // Refresh orders
                await fetchTableOrders();
            } catch (error) {
                console.error('Error placing/updating order:', error);
                alert('Failed to place/update order: ' + error.message);
            }
        }
    };

    useEffect(() => {
        console.log('OrderModal useEffect:', { isOpen, table, isTakeaway, existingOrder });
        const initializeOrder = async () => {
            if (isOpen) {
                await getItems();
                if (existingOrder) {
                    console.log('Using existing order:', existingOrder);
                    setCurrentTableOrder({
                        orderid: existingOrder.orderid,
                        orders: existingOrder.orders
                    });
                    setOrderItems(existingOrder.items);
                } else if (table?.id && !isTakeaway) {
                    await fetchTableOrders();
                }
            }
        };

        initializeOrder();
    }, [isOpen, existingOrder, table, isTakeaway]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">
                        {isTakeaway ? 'Takeaway Order' : `Table ${table?.table_no}`} - Order Management
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex h-[calc(90vh-9rem)]">
                    {/* Left Side - Menu */}
                    <div className="flex-1 p-4 border-r overflow-y-auto">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2">Menu Items</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {items.map(item => (
                                    <div key={item.id} className="border rounded-lg p-3 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium">{item.name}</h4>
                                            <p className="text-sm text-gray-600">${item.price}</p>
                                            <div className="flex gap-2">
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {item.categoryName}
                                                </span>
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {item.storeName}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => addToOrder(item)}
                                            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                                        >
                                            <PlusIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Order Summary */}
                    <div className="w-96 border-l flex flex-col">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">Order Summary</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {orderItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between mb-4">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{item.name}</h4>
                                        <p className="text-sm text-gray-600">${item.price * item.quantity}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <MinusIcon className="h-4 w-4" />
                                        </button>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => updateQuantity(item.id, 0)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t">
                            <div className="flex justify-between mb-4">
                                <span className="font-semibold">Total Amount:</span>
                                <span className="font-semibold">
                                    ${(currentTableOrder?.orders?.total_amount || getTotalAmount()).toFixed(2)}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <button 
                                    disabled={orderItems.length === 0}
                                    onClick={handlePlaceOrder}
                                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                                >
                                    {currentTableOrder ? 'Update Order' : 'Place Order'}
                                </button>
                                <button 
                                    onClick={() => setIsCheckoutOpen(true)}
                                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                                >
                                    Proceed to Checkout
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    {/* Checkout Modal */}
                    {isCheckoutOpen && (
                        <CheckoutModal
                            isOpen={isCheckoutOpen}
                            onClose={() => setIsCheckoutOpen(false)}
                            orderItems={orderItems}
                            table={table}
                            currentTableOrder={currentTableOrder}
                            onUpdateStatus={onUpdateStatus}
                        />
                    )}
                </div>
            </div>
        );
    }