import React, { useState,useEffect } from 'react';
import { XMarkIcon, PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';
import CheckoutModal from './CheckoutModal';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTableData,addTable } from '../redux/actions/tableActions'; 
export default function TableModal({ tableId, isOpen, onClose, onUpdateStatus, isCreateMode = false }) {
  const [orderItems, setOrderItems] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [tableData, setTableData] = useState({
    number: '',
    seats: 2,
    status: 'available',
    space: '',  // Changed to text input
    store: '',  // Will be dropdown
    size: '',   // Changed to number input
    label: ''   // Add this field
  });
    const {userData,tables,store,error}=useSelector((state)=>state.table);
    const user=useSelector((state)=>state.auth.user);
    const dispatch=useDispatch();
    useEffect(()=>{
      if(user?.id){
        dispatch(fetchTableData(user.id));
      }
    },[user?.id,dispatch]);

  const stores = [
    { id: 1, name: 'Store 1' },
    { id: 2, name: 'Store 2' },
    { id: 3, name: 'Store 3' },
  ];

  // Mock menu data - replace with your actual menu data later
  const menuItems = [
    { id: 1, name: 'Margherita Pizza', price: 12.99, category: 'Main Course' },
    { id: 2, name: 'Caesar Salad', price: 8.99, category: 'Starters' },
    { id: 3, name: 'Chicken Burger', price: 14.99, category: 'Main Course' },
    { id: 4, name: 'French Fries', price: 4.99, category: 'Sides' },
    { id: 5, name: 'Chocolate Cake', price: 6.99, category: 'Desserts' },
  ];

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

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      setOrderItems(orderItems.filter(item => item.id !== itemId));
    } else {
      setOrderItems(orderItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getTotalAmount = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = () => {
    if (orderItems.length > 0) {
      onUpdateStatus(tableId, 'occupied');
      console.log('Order submitted:', orderItems);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Table data:', store);
    dispatch(addTable(tableData));

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isCreateMode ? 'Create New Table' : `Table ${tableId} - Order Management`}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        {isCreateMode ? (
          // Create Table Form
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Table Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  required
                  value={tableData.number}
                  onChange={(e) => setTableData({ ...tableData, number: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter table number"
                />
              </div>


              {/* Space/Area - Changed to text input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Space/Area
                </label>
                <input
                  type="text"
                  required
                  value={tableData.space}
                  onChange={(e) => setTableData({ ...tableData, space: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter space or area"
                />
              </div>

              {/* Store - Changed to dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store
                </label>
                <select
                  required
                  value={tableData.store}
                  onChange={(e) => setTableData({ ...tableData, store: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Store</option>
                  {store.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size - Changed to number input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Size /Number of Seats
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={tableData.size}
                  onChange={(e) => setTableData({ ...tableData, size: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter table size"
                />
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={tableData.label}
                  onChange={(e) => setTableData({ ...tableData, label: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter table label (optional)"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
            >
              Create Table
            </button>
          </form>
        ) : (
          // Order Management Content
          <div className="flex h-[calc(90vh-9rem)]">
            {/* Left Side - Menu */}
            <div className="flex-1 p-4 border-r overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Menu Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.map(item => (
                    <div key={item.id} className="border rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">${item.price}</p>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      </div>
                      <button
                        onClick={() => addToOrder(item)}
                        className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Order Summary */}
            <div className="w-96 border-l flex flex-col">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Order Summary</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {orderItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">${item.price * item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateQuantity(item.id, 0)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total and Actions */}
              <div className="p-4 border-t">
                <div className="flex justify-between mb-4">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-semibold">${getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={handlePlaceOrder}
                    disabled={orderItems.length === 0}
                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Place Order
                  </button>
                  <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        orderItems={orderItems}
        tableId={tableId}
      />
    </div>
  );
}
