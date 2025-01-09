import React, { useState } from 'react';
import { UserGroupIcon, ClipboardDocumentListIcon, CurrencyDollarIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import Table from './Table';
import Orders from './Orders';
import Sidebar from './Sidebar';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('tables');

  // Mock statistics data
  const stats = [
    { id: 1, name: 'Active Tables', value: '12/20', icon: ViewColumnsIcon, color: 'bg-blue-500' },
    { id: 2, name: 'Open Orders', value: '8', icon: ClipboardDocumentListIcon, color: 'bg-green-500' },
    { id: 3, name: 'Today\'s Revenue', value: '$1,429', icon: CurrencyDollarIcon, color: 'bg-purple-500' },
    { id: 4, name: 'Active Staff', value: '6', icon: UserGroupIcon, color: 'bg-orange-500' },
  ];

  return (
    <>
    <div className="space-y-6 p-4">
     
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Restaurant Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>

        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tables')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150
              ${activeTab === 'tables'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Tables Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150
              ${activeTab === 'orders'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            TakeOut Orders
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white shadow-sm rounded-xl">
        <div className="p-1">
          {activeTab === 'tables' && <Table />}
          {activeTab === 'orders' && <Orders />}
        </div>
      </div>
    </div>
    </>
    
  );
}
