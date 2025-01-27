import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function Navbar({ onSidebarOpen }) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b z-10">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onSidebarOpen()} // Always trigger sidebar open
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
          <span className="text-xl font-semibold text-gray-800">MealVault</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Add any additional navbar items here */}
        </div>
      </div>
    </nav>
  );
}
