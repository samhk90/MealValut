import React from 'react';
import { ClockIcon, UserIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

const TakeawayOrderCard = ({ order, onClick }) => {
    const getStatusStyle = (status) => {
        const styles = {
            pending: {
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                badge: 'bg-yellow-100 text-yellow-800',
                icon: 'text-yellow-500'
            },
            processing: {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                badge: 'bg-blue-100 text-blue-800',
                icon: 'text-blue-500'
            },
            completed: {
                bg: 'bg-green-50',
                border: 'border-green-200',
                badge: 'bg-green-100 text-green-800',
                icon: 'text-green-500'
            },
            cancelled: {
                bg: 'bg-red-50',
                border: 'border-red-200',
                badge: 'bg-red-100 text-red-800',
                icon: 'text-red-500'
            }
        };
        return styles[status] || styles.pending;
    };

    const statusStyle = getStatusStyle(order.status);
    const itemCount = order.order_items?.length || 0;

    return (
        <div 
            className={`${statusStyle.bg} border ${statusStyle.border} rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer`}
            onClick={onClick}
        >
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className={`${statusStyle.badge} text-sm font-medium px-3 py-1 rounded-full`}>
                            {order.status}
                        </span>
                        <h3 className="text-lg font-semibold mt-2">Order #{order.receipt_no}</h3>
                    </div>
                    <span className="text-2xl font-bold text-gray-800">
                        ${parseFloat(order.total_amount).toFixed(2)}
                    </span>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-600">
                        <ShoppingBagIcon className="h-5 w-5 mr-3" />
                        <span>{itemCount} items</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <ClockIcon className="h-5 w-5 mr-3" />
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <UserIcon className="h-5 w-5 mr-3" />
                        <span>Takeaway Order</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        {order.order_items?.map((item, index) => (
                            <div key={item.id} className="flex justify-between mb-1">
                                <span>{item.items.name} × {item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TakeawayOrderCard;
