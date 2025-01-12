import React, { useState, useEffect } from 'react';
import { PlusIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import OrderModal from './OrderModal';
import { supabase } from './SupabaseClient';
import { useSelector } from 'react-redux';
import TakeawayOrderCard from './TakeawayOrderCard';

const Takeaway = () => {
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [takeawayOrders, setTakeawayOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const user = useSelector((state) => state.auth.user);

    // Fetch takeaway orders
    const fetchTakeawayOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
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
                .eq('order_type', 'takeaway')
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log('Fetched takeaway orders:', data); // Debug log
            setTakeawayOrders(data || []);
        } catch (error) {
            console.error('Error fetching takeaway orders:', error);
        }
    };

    useEffect(() => {
        fetchTakeawayOrders();
        // Set up real-time subscription
        const subscription = supabase
            .channel('takeaway_orders')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'orders' },
                () => fetchTakeawayOrders()
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || colors.pending;
    };

    const handleOrderClick = (order) => {
        console.log('Clicked order:', order);
        
        // Transform order items to match the format expected by OrderModal
        const transformedItems = order.order_items.map(item => ({
            id: item.items.id,
            name: item.items.name,
            price: parseFloat(item.items.price || 0),
            quantity: parseInt(item.quantity || 0),
            category: item.items.category,
            storeid: item.items.storeid,
            total_price: parseFloat(item.total_price || 0)
        }));

        setSelectedOrder({
            orderid: order.id,
            orders: {
                ...order,
                total_amount: parseFloat(order.total_amount || 0),
                tax: parseFloat(order.tax || 0)
            },
            items: transformedItems
        });
        setIsOrderModalOpen(true);
    };

    const refreshOrders = () => {
        fetchTakeawayOrders();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Takeaway Orders</h1>
                    <p className="text-gray-600 mt-2">Manage your takeaway orders</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedOrder(null);
                        setIsOrderModalOpen(true);
                    }}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Takeaway Order
                </button>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {takeawayOrders.map((order) => (
                    <TakeawayOrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                    />
                ))}
            </div>

            {/* Order Modal */}
            {isOrderModalOpen && (
                <OrderModal
                    isOpen={isOrderModalOpen}
                    onClose={() => {
                        setIsOrderModalOpen(false);
                        setSelectedOrder(null);
                        refreshOrders();
                    }}
                    table={null}
                    onUpdateStatus={() => {
                        refreshOrders();
                    }}
                    isTakeaway={true}
                    existingOrder={selectedOrder}
                />
            )}
        </div>
    );
};

export default Takeaway;
