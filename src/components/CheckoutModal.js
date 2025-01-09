import React from 'react';
import { XMarkIcon, PrinterIcon, CreditCardIcon, BanknotesIcon } from '@heroicons/react/24/outline';

export default function CheckoutModal({ isOpen, onClose, orderItems, tableId }) {
  if (!isOpen) return null;

  const getTotalAmount = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Checkout - Table {tableId}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          <div className="space-y-4 mb-6">
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                </div>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>${getTotalAmount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (10%)</span>
              <span>${(getTotalAmount() * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${(getTotalAmount() * 1.1).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Options */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <CreditCardIcon className="h-6 w-6" />
                <span>Card Payment</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <BanknotesIcon className="h-6 w-6" />
                <span>Cash Payment</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <button className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors">
              Complete Payment
            </button>
            <button 
              className="w-full flex items-center justify-center space-x-2 border py-2 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => window.print()}
            >
              <PrinterIcon className="h-5 w-5" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
