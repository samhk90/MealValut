import React from 'react';
import { ClockIcon, CurrencyDollarIcon, UserIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function Orders() {
  // Mock data for orders
  const orders = [
    { id: 1, tableNo: '01', items: 3, status: 'pending', time: '10:30 AM', total: 45.99 },
    { id: 2, tableNo: '04', items: 5, status: 'preparing', time: '10:45 AM', total: 89.99 },
    { id: 3, tableNo: '02', items: 2, status: 'ready', time: '11:00 AM', total: 29.99 },
    { id: 4, tableNo: '06', items: 4, status: 'delivered', time: '11:15 AM', total: 67.50 },
  ];

  const getStatusStyle = (status) => {
    const styles = {
      pending: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800',
        icon: 'text-yellow-500'
      },
      preparing: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        icon: 'text-blue-500'
      },
      ready: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-800',
        icon: 'text-green-500'
      },
      delivered: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-800',
        icon: 'text-gray-500'
      }
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Active Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track order status</p>
        </div>
        <div className="flex space-x-4">
          <button className="bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-lg border border-gray-200 flex items-center space-x-2 transition-colors duration-150">
            <ClockIcon className="h-5 w-5" />
            <span>History</span>
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-150 shadow-sm hover:shadow">
            <ShoppingBagIcon className="h-5 w-5" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => {
          const statusStyle = getStatusStyle(order.status);
          return (
            <div 
              key={order.id}
              className={`${statusStyle.bg} border ${statusStyle.border} rounded-xl overflow-hidden hover:shadow-md transition-all duration-200`}
            >
              <div className="p-6">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`${statusStyle.badge} text-sm font-medium px-3 py-1 rounded-full`}>
                      {order.status}
                    </span>
                    <h3 className="text-lg font-semibold mt-2">Table {order.tableNo}</h3>
                  </div>
                  <span className="text-2xl font-bold text-gray-800">${order.total}</span>
                </div>

                {/* Order Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600">
                    <ShoppingBagIcon className="h-5 w-5 mr-3" />
                    <span>{order.items} items</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-3" />
                    <span>{order.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <UserIcon className="h-5 w-5 mr-3" />
                    <span>Server: John Doe</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg border border-gray-200 transition-colors duration-150">
                    View Details
                  </button>
                  <button className={`flex-1 ${statusStyle.badge.replace('bg-', 'hover:bg-').replace('100', '200')} py-2 px-4 rounded-lg transition-colors duration-150`}>
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
