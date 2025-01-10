import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';
import CheckoutModal from './CheckoutModal';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTableData, addTable, fetchTableDataByStore } from '../redux/actions/tableActions';
import {
  addItem,
  updateItemQuantity,
  setCurrentTable,
  selectOrderItems,
  selectTotalAmount,
  initializeOrderItems,
  clearOrderItems
} from '../redux/features/orderSlice';
import {
  fetchMenuItems,
  placeOrder,
  processCheckout,
  updateOrder
} from '../redux/actions/orderAction';
import {
  selectMenuItems,
  selectActiveOrder,
  selectOrderStatus
} from '../redux/features/orderSlice';
import { supabase } from '../components/SupabaseClient'; // Add this import

export default function TableModal({ table, isOpen, onClose, onUpdateStatus, isCreateMode = false }) {
  const dispatch = useDispatch();
  const orderItems = useSelector(selectOrderItems) || []; // Add default empty array
  const totalAmount = useSelector(selectTotalAmount) || 0; // Add default 0
  const menuItems = useSelector(selectMenuItems) || []; // Add default empty array
  const activeOrder = useSelector(selectActiveOrder);
  const orderStatus = useSelector(selectOrderStatus);
  const isLoading = useSelector(state => state.order.isLoading);
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
  const { userData, tables, store, error } = useSelector((state) => state.table);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchTableData(user.id));
    }
  }, [user?.id, dispatch]);

  const stores = [
    { id: 1, name: 'Store 1' },
    { id: 2, name: 'Store 2' },
    { id: 3, name: 'Store 3' },
  ];

  useEffect(() => {
    dispatch(fetchMenuItems());
  }, [dispatch]);

  // Replace addToOrder function
  const addToOrder = (item) => {
    dispatch(addItem(item));
  };

  // Replace updateQuantity function
  const updateQuantity = (itemId, newQuantity) => {
    dispatch(updateItemQuantity({ itemId, quantity: newQuantity }));
  };

  // Replace getTotalAmount function with totalAmount from Redux
  const getTotalAmount = () => totalAmount;

  const handlePlaceOrder = async () => {
    if (orderItems.length > 0) {
      try {
        // First update table status
        const { error: tableError } = await supabase
          .from('table')
          .update({ is_occupied: true })
          .eq('id', table.id); // Use table.id instead of tableId

        if (tableError) throw new Error('Failed to update table status');

        const result = await dispatch(placeOrder({
          tableId: table.id, // Use table.id consistently
          orderItems,
          totalAmount: getTotalAmount(),
          userId: user.id
        })).unwrap();
        
        if (result) {
          // Update local table status through parent component
          onUpdateStatus(table.id, true);
          onClose();
        }
      } catch (error) {
        console.error('Failed to place order:', error);
        alert(error.message || 'Failed to place order. Please try again.');
      }
    }
  };

  const handleCheckout = async () => {
    if (activeOrder) {
      try {
        // Update table status to not occupied
        const { error: tableError } = await supabase
          .from('table')
          .update({ is_occupied: false })
          .eq('id', table.id); // Use table.id instead of tableId

        if (tableError) throw new Error('Failed to update table status');

        const result = await dispatch(processCheckout({
          orderId: activeOrder.id,
          tableId: table.id, // Use table.id consistently
          paymentDetails: {
            amount: getTotalAmount(),
            method: 'card'
          }
        }));

        if (!result.error) {
          onUpdateStatus(table.id, false);
          setIsCheckoutOpen(false);
          onClose();
        }
      } catch (error) {
        console.error('Checkout failed:', error);
        alert(error.message || 'Checkout failed. Please try again.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Table data:', store);
    dispatch(addTable(tableData));

    onClose();
  };

  // Add error handling for store loading
  useEffect(() => {
    if (error) {
      alert('Error loading store data: ' + error);
    }
  }, [error]);

  const renderOrderDetails = (latestOrder) => {
    if (!latestOrder) return null;
    
    return (
        <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Current Order Details</h3>
                <div className="space-y-4">
                    {/* Order Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-600">Order Status:</p>
                            <p className="font-medium capitalize">{latestOrder.status}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Total Amount:</p>
                            <p className="font-medium">${latestOrder.total_amount}</p>
                        </div>
                    </div>
                    
                    {/* Order Items */}
                    <div className="mt-6">
                        <h4 className="text-lg font-medium mb-3">Order Items</h4>
                        <div className="space-y-2">
                            {latestOrder.order_items?.map((orderItem) => (
                                <div key={orderItem.id} className="flex justify-between border-b pb-2">
                                    <span>{orderItem.items.name}</span>
                                    <span>x {orderItem.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 space-x-4">
                        <button
                            onClick={() => setIsCheckoutOpen(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                            Process Checkout
                        </button>
                        <button
                            onClick={() => handleUpdateOrder(latestOrder)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                        >
                            Update Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const handleUpdateOrder = (currentOrder) => {
    if (currentOrder) {
        // Pre-populate the order items
        currentOrder.order_items?.forEach(orderItem => {
            dispatch(addItem({
                ...orderItem.items,
                quantity: orderItem.quantity
            }));
        });
        setActiveTab('menu');
    }
};

const handleUpdateExistingOrder = async () => {
    if (orderItems.length > 0 && table?.orders?.[0]) {
        try {
            const result = await dispatch(updateOrder({
                orderId: table.orders[0].id,
                tableId: table.id,  // Add table ID
                orderItems,
                totalAmount: getTotalAmount(),
                userId: user.id
            })).unwrap();
            
            if (result) {
                // Refresh the table data
                await dispatch(fetchTableDataByStore(table.storeid));
                // Update local table status
                onUpdateStatus(table.id, true);
                onClose();
            }
        } catch (error) {
            console.error('Failed to update order:', error);
            alert(error.message || 'Failed to update order. Please try again.');
        }
    }
};

const renderContent = () => {
    if (isCreateMode) {
        return (
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
        );
    }

    // Both occupied and unoccupied tables will show the order interface
    return (
        <div className="flex h-[calc(90vh-9rem)]">
            {/* Left Side - Menu */}
            <div className="flex-1 p-4 border-r overflow-y-auto">
                {table?.is_occupied && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800">
                            Existing Order Details
                        </h3>
                        <p className="text-sm text-blue-600">
                            Modifying existing order for Table {table.table_no}
                        </p>
                    </div>
                )}
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
                    <h3 className="text-lg font-semibold">
                        {table?.is_occupied ? 'Update Order' : 'New Order'}
                    </h3>
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
                        {table?.is_occupied ? (
                            <>
                                <button
                                    onClick={handleUpdateExistingOrder}
                                    disabled={orderItems.length === 0}
                                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                                >
                                    Update Order
                                </button>
                                <button
                                    onClick={() => setIsCheckoutOpen(true)}
                                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                                >
                                    Process Checkout
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handlePlaceOrder}
                                disabled={orderItems.length === 0}
                                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                            >
                                Place Order
                            </button>
                        )}
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
    );
};

// Clear order items when modal closes
useEffect(() => {
    if (!isOpen) {
        dispatch(clearOrderItems());
    }
}, [isOpen, dispatch]);

// Initialize order items when opening an occupied table
useEffect(() => {
    if (isOpen && table?.is_occupied && table.orders?.[0]) {
        const latestOrder = table.orders[0];
        const orderItemsToInitialize = latestOrder.order_items.map(orderItem => ({
            id: orderItem.itemid,  // Change this to itemid
            name: orderItem.items.name,
            price: orderItem.items.price,
            category: orderItem.items.category,
            quantity: orderItem.quantity
        }));
        dispatch(initializeOrderItems(orderItemsToInitialize));
        dispatch(setCurrentTable(table.id));
    }
}, [isOpen, table, dispatch]);

if (!isOpen) return null;
if (isLoading) return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded-lg">
      <p>Loading...</p>
    </div>
  </div>
);

return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
      {/* Modal Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {isCreateMode ? 'Create New Table' : `Table ${table?.table_no} - Order Management`}
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Modal Content */}
      {renderContent()}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          orderItems={orderItems}
          tableId={table?.id}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  </div>
);
}
