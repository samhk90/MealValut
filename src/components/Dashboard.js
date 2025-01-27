import React, { useState, useEffect } from 'react';
import {
  Squares2X2Icon,
  ShoppingBagIcon,
  HomeIcon,
  TruckIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Table from './Table';
import Orders from './Orders';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { supabase } from './SupabaseClient';
import Takeaway from './Takeaway';

const serviceCards = [
  { 
    id: 'tables', 
    name: 'Table Service', 
    icon: Squares2X2Icon, 
    component: Table,
    description: 'Manage dine-in orders' 
  },
  { 
    id: 'takeaway', 
    name: 'Take Away', 
    icon: ShoppingBagIcon, 
    component: Takeaway,
    description: 'Handle takeaway orders' 
  },
  { 
    id: 'delivery', 
    name: 'Home Delivery', 
    icon: HomeIcon, 
    component: null,
    description: 'Manage home deliveries' 
  },
  { 
    id: 'partner', 
    name: 'Delivery Partner', 
    icon: TruckIcon, 
    component: null,
    description: 'Partner delivery services' 
  },
];

const statsCards = [
  { id: 'revenue', name: 'Today\'s Revenue', value: '$2,459', icon: CurrencyDollarIcon },
  { id: 'orders', name: 'Active Orders', value: '12', icon: ClockIcon },
  { id: 'customers', name: 'Total Customers', value: '48', icon: UsersIcon },
  { id: 'sales', name: 'Total Sales', value: '$12,789', icon: ChartBarIcon },
];

export default function Dashboard() {
  const [activeService, setActiveService] = useState('tables');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const ActiveComponent = serviceCards.find(card => card.id === activeService)?.component || (() => <div>Coming Soon</div>);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar onSidebarOpen={() => setIsSidebarOpen(true)} />
      
      {/* Sidebar with overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)} />
      )}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 mt-16 p-6">
        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat) => (
            <div key={stat.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-xl">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div> */}

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Service Type Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {serviceCards.map((service) => (
              <button
                key={service.id}
                onClick={() => setActiveService(service.id)}
                className={`p-6 rounded-xl transition-all duration-200 ${
                  activeService === service.id
                    ? 'bg-green-50 ring-2 ring-green-500 shadow-md'
                    : 'bg-white shadow-sm hover:shadow-md hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-4 rounded-xl mb-4 ${
                    activeService === service.id ? 'bg-green-500' : 'bg-gray-100'
                  }`}>
                    <service.icon className={`h-8 w-8 ${
                      activeService === service.id ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Active Component */}
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
