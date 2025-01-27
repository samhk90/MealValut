import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { supabase } from './SupabaseClient';
import { useSelector } from 'react-redux';
import TakeawayOrderModal from './TakeawayOrderModal';

const Takeaway = () => {
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const user = useSelector((state) => state.auth.user);

    const handleUpdateStatus = () => {
        // Refresh takeaway orders or handle status updates
        // You can add your logic here if needed
    };

    if (showOrderModal) {
        return (
            <TakeawayOrderModal
                onClose={() => setShowOrderModal(false)}
                existingOrder={selectedOrder}
                onComplete={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
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
                    <p className="text-gray-600 mt-2">Create new takeaway order</p>
                </div>
                <button
                    onClick={() => setShowOrderModal(true)}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Takeaway Order
                </button>
            </div>
        </div>
    );
};

export default Takeaway;
