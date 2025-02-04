import React, { use, useState,useEffect } from 'react';
import { Bars3Icon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import SelectedStore from './SelectedStore';

export default function Navbar({ onSidebarOpen }) {
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  useEffect(() => {
    const store = localStorage.getItem('selectedStore');
    if(!store){
      setIsStoreModalOpen(true);
    }else{
      
    }
    // Fetch stores here
  }, []);
  const handleStoreSelect = (store) => {
    // Handle store selection here

    console.log('Selected store:', store);
    // You might want to update this in your global state/context
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white border-b z-10">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onSidebarOpen()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <Bars3Icon className="h-6 w-6 text-gray-600" />
            </button>
            <span className="text-xl font-semibold text-gray-800">FoodNote</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsStoreModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-all duration-200"
            >
              <BuildingStorefrontIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Select Store</span>
            </button>
          </div>
        </div>
      </nav>

      <SelectedStore
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onSelect={handleStoreSelect}
      />
    </>
  );
}
