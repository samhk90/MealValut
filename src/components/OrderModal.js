import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';
import CheckoutModal from './CheckoutModal';
import { useSelector } from 'react-redux';
import { supabase } from './SupabaseClient';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function OrderPage({ onUpdateStatus, isTakeaway = false, existingOrder = null }) {
    const { tableId } = useParams();
    const navigate = useNavigate();
    // Add new state for categories
    const [categories, setCategories] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [orderItems, setOrderItems] = useState([]);
    const [items, setItems] = useState([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [currentTableOrder, setCurrentTableOrder] = useState(null);
    const user = useSelector((state) => state.auth.user);
    const [table, setTable] = useState(null);

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

    // Add function to fetch categories
    const getCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('category')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        }
    };

    // Fetch orders associated with the current table
    const fetchTableOrders = async () => {
        if (!table?.id) return;

        try {
            // Fixed query with correct order syntax
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
                .eq('tableid', table.id)
                .eq('orders.status', 'pending')
                .order('created_at', { ascending: false }) 
                    console.log('Order data sami:', orderData);
            if (orderError) {
                console.error('Order fetch error:', orderError);
                setCurrentTableOrder(null);
                setOrderItems([]);
                return;
            }

            if (!orderData || orderData.length === 0 || !orderData[0].orders) {
                console.log('No pending order found for table:', table.id);
                console.log('Order data:', orderData.id);
                setCurrentTableOrder(null);
                setOrderItems([]);
                return;
            }

            const orderInfo = orderData[0];
            
            const formattedOrder = {
                orderid: orderInfo.orders.id,
                orders: {
                    ...orderInfo.orders,
                    total_amount: parseFloat(orderInfo.orders.total_amount || 0),
                    tax: parseFloat(orderInfo.orders.tax || 0)
                }
            };

            setCurrentTableOrder(formattedOrder);

            // Transform order items
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
                    navigate('/');
                    return;
                } else {
                    // Create new order
                    const { data: newOrder, error: orderError } = await supabase
                        .from('orders')
                        .insert({
                            order_type: "dine in",
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

                const {error: updateTableError} = await supabase
                    .from('table')
                    .update({
                        is_occupied: true
                    })
                    .eq('id', table.id);
                    navigate('/');
                
                // Refresh orders
                await fetchTableOrders();
            } catch (error) {
                console.error('Error placing/updating order:', error);
                alert('Failed to place/update order: ' + error.message);
            }
        }
    };

    const getOrderDetails = () => {
        const subtotal = getTotalAmount();
        const tax = +(subtotal * 0.1).toFixed(2);
        const total_amount = +(subtotal + tax).toFixed(2);

        return {
            order_type: isTakeaway ? 'takeaway' : 'dine-in',
            total_amount: total_amount,
            tax: tax,
            subtotal: subtotal,
            items: orderItems
        };
    };

    const handleCheckoutComplete = () => {
        setIsCheckoutOpen(false);
        navigate('/');
    };
    
    const handleClose = () => {
        navigate('/'); // Go back to previous page
    };

    const fetchTable = async () => {
        try {
            const { data, error } = await supabase
                .from('table')
                .select('*')
                .eq('id', tableId)
                .single();

            if (error) throw error;
            setTable(data);
        } catch (error) {
            console.error('Error fetching table:', error);
            navigate('/');
        }
    };

    useEffect(() => {
        fetchTable();
    }, [tableId]);

    useEffect(() => {
        console.log('OrderPage useEffect:', { table, isTakeaway, existingOrder });
        const initializeOrder = async () => {
            if (table) {
                await Promise.all([getItems(), getCategories()]);
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
    }, [existingOrder, table, isTakeaway]);

    // Add cleanup effect
    useEffect(() => {
        return () => {
            handlePlaceOrder();
            setCurrentTableOrder(null);
            setOrderItems([]);
        };
    }, []);

    // Add filtered items function
    const filteredItems = items.filter(item => 
        selectedCategory === 'all' || item.category?.id === selectedCategory
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <Navbar onSidebarOpen={() => setIsSidebarOpen(true)}  />
            {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)} />
      )}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Modern Fixed Header - Updated styling */}
            <div className="fixed top-16 left-0 right-0 bg-green-50 shadow-sm z-10">
                <div className="max-w-8xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {isTakeaway ? 'Takeaway Order' : `Table ${table?.table_no}`}
                            </h2>
                            <span className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full">
                                {isTakeaway ? 'Takeaway' : 'Dine-in'}
                            </span>
                        </div>
                        <button 
                            onClick={handleClose} 
                            className="p-2 hover:bg-green-100 rounded-full transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-32 h-[calc(100vh-4rem)] flex">
                {/* Category Sidebar - Fixed height with scroll */}
                <div className="w-64 bg-white shadow-sm fixed left-0 top-32 bottom-0 overflow-y-auto">
                    <div className="p-4 space-y-2">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`w-full px-4 py-3 rounded-lg text-left transition-all
                                ${selectedCategory === 'all'
                                    ? 'bg-green-500 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            All Categories
                        </button>
                        {categories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`w-full px-4 py-3 rounded-lg text-left transition-all
                                    ${selectedCategory === category.id
                                        ? 'bg-green-500 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu Items Grid */}
                <div className="flex-1 pl-64 pr-96">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredItems.map(item => (
                                <div key={item.id} 
                                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all border border-gray-100"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                                            <p className="text-lg font-semibold text-green-600 mb-2">
                                                ${item.price}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                                    {item.categoryName}
                                                </span>
                                                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                                                    {item.storeName}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => addToOrder(item)}
                                            className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                        >
                                            <PlusIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Fixed Order Summary Sidebar - Improved visibility */}
                <div className="w-96 bg-white fixed right-0 top-32 bottom-0 shadow-lg border-l">
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>
                        </div>
                        
                        {/* Order Items List - Scrollable */}
                        <div className="flex-1 overflow-y-auto">
                            {orderItems.map(item => (
                                <div key={item.id} 
                                    className="p-4 border-b hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                                            <p className="text-sm text-green-600 font-medium">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => updateQuantity(item.id, 0)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                        >
                                            <MinusIcon className="h-4 w-4" />
                                        </button>
                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Fixed Bottom Section */}
                        <div className="border-t bg-white p-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">${getTotalAmount().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">Tax (10%):</span>
                                <span className="font-medium">${(getTotalAmount() * 0.1).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-6">
                                <span className="font-semibold text-gray-800">Total:</span>
                                <span className="font-bold text-green-600 text-xl">
                                    ${(getTotalAmount() * 1.1).toFixed(2)}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <button 
                                    disabled={orderItems.length === 0}
                                    onClick={handlePlaceOrder}
                                    className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 
                                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {currentTableOrder ? 'Update Order' : 'Place Order'}
                                </button>
                                <button 
                                    onClick={() => setIsCheckoutOpen(true)}
                                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 
                                        transition-colors"
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
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
                    orderDetails={getOrderDetails()}
                    onCheckoutComplete={handleCheckoutComplete}
                />
            )}
        </div>
    );
}