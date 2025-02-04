import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { supabase } from './SupabaseClient';
import { useSelector } from 'react-redux';
import TakeawayOrderModal from './TakeawayOrderModal';
import TakeawayOrderCard from './TakeawayOrderCard';

const Takeaway = () => {
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector((state) => state.auth.user);

    const fetchOrders = async () => {
        try {
            // Get today's date at midnight
            const today = new Date();
            today.setHours(0, 0, 0, 0);

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
                            category
                        )
                    )
                `)
                .eq('order_type', 'take out')
                .gte('created_at', today.toISOString())
                .lt('created_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const handleUpdateStatus = () => {
        fetchOrders(); // Refresh orders after status update
    };

    if (showOrderModal) {
        return (
            <TakeawayOrderModal
                onClose={() => setShowOrderModal(false)}
                existingOrder={selectedOrder}
                onComplete={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                    fetchOrders(); // Refresh orders after completion
                }}
                onUpdateStatus={handleUpdateStatus}
            />
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Takeaway Orders</h1>
                    <p className="text-gray-600 mt-2">Manage takeaway orders</p>
                </div>
                <button
                    onClick={() => setShowOrderModal(true)}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Takeaway Order
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <TakeawayOrderCard
                            key={order.id}
                            order={order}
                           
                        />
                    ))}
                    {orders.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            No takeaway orders found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Takeaway;
