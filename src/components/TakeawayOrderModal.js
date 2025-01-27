import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';
import CheckoutModal from './CheckoutModal';
import { useSelector } from 'react-redux';
import { supabase } from './SupabaseClient';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

// Change the component props definition to include onUpdateStatus
export default function TakeawayOrderModal({ onClose, existingOrder = null, onComplete, onUpdateStatus }) {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [orderItems, setOrderItems] = useState([]);
    const [items, setItems] = useState([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const user = useSelector((state) => state.auth.user);



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
                
                const receipt_no = Date.now() + Math.floor(Math.random() * 1000);
                console.log(user);
                const { data: storeData, error: storeError } = await supabase
                    .from('user_store')
                    .select('storeid')
                    .eq('storeid', 'a74b064e-a46d-4e6d-84e6-00be4529a478')
                    .single();
                    console.log('storedata: ',storeData);
                // Create new takeaway order
                const { data: newOrder, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        order_type: 'take out', // Changed to takeaway
                        total_amount,
                        status: 'completed',
                        created_at: new Date().toLocaleDateString(),
                        completed_at: new Date().toISOString(),
                        storeid: storeData.storeid, // Use user's store ID for takeaway
                        userid: user.id,
                        tax,
                        receipt_no
                    })
                    .select()
                    .single();

                if (orderError) throw orderError;
                orderId = newOrder.id;

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

                navigate('/');

            } catch (error) {
                console.error('Error placing takeaway order:', error);
                alert('Failed to place takeaway order: ' + error.message);
            }
        }
    };

    const getOrderDetails = () => {
        const subtotal = getTotalAmount();
        const tax = +(subtotal * 0.1).toFixed(2);
        const total_amount = +(subtotal + tax).toFixed(2);

        return {
            order_type: 'takeaway',
            total_amount,
            tax,
            subtotal,
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

    useEffect(() => {
        const initializeOrder = async () => {
            await Promise.all([getItems(), getCategories()]);
            if (existingOrder) {
                setCurrentOrder(existingOrder);
                setOrderItems(existingOrder.items);
            }
        };

        initializeOrder();
    }, [existingOrder]);

    // Add cleanup effect
    useEffect(() => {
        return () => {
            handlePlaceOrder();
            setCurrentOrder(null);
            setOrderItems([]);
        };
    }, []);

    // Add filtered items function
    const filteredItems = items.filter(item => 
        selectedCategory === 'all' || item.category?.id === selectedCategory
    );

    return (
        <div className="fixed inset-0 bg-gray-100 z-50">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10 h-16">
                <div className="max-w-8xl mx-auto px-4 h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex items-center space-x-3">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Takeaway Order
                            </h2>
                            <span className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full">
                                Takeaway
                            </span>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="fixed top-16 bottom-0 left-0 right-0 flex">
                {/* Category Sidebar */}
                <div className="w-64 bg-white shadow-sm overflow-y-auto border-r">
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
                <div className="flex-1 overflow-y-auto px-6 py-4">
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

                {/* Order Summary Sidebar */}
                <div className="w-96 bg-white shadow-lg border-l flex flex-col">
                    <div className="p-4 border-b bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>
                    </div>
                    
                    {/* Order Items List */}
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

                    {/* Bottom Section */}
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
                                {currentOrder ? 'Update Order' : 'Place Order'}
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

            {/* Checkout Modal */}
            {isCheckoutOpen && (
                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    orderItems={orderItems}
                    currentOrder={currentOrder}
                    onUpdateStatus={onUpdateStatus}
                    orderDetails={getOrderDetails()}
                    onCheckoutComplete={() => {
                        handleCheckoutComplete();
                        onComplete?.();
                    }}
                />
            )}
        </div>
    );
}