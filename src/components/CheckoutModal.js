import React, { useState } from 'react';
import { XMarkIcon, PrinterIcon, CreditCardIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { supabase } from './SupabaseClient';

export default function CheckoutModal({ 
    isOpen, 
    onClose, 
    orderItems, 
    table, 
    currentTableOrder,
    onUpdateStatus,
    orderDetails,
    onCheckoutComplete // Add this prop
}) {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        address: '',
        mobile: ''
    });
    const [loading, setLoading] = useState(false);

    const totalAmount = orderDetails.total_amount + orderDetails.tax;
    const changeDue = amountPaid ? (parseFloat(amountPaid) - totalAmount).toFixed(2) : '0.00';

    const handleCheckout = async () => {
        try {
            setLoading(true);
            
            // Update order status and customer details
            const { error: orderError } = await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    customer_name: customerDetails.name,
                    customer_address: customerDetails.address,
                    customer_mno: customerDetails.mobile,
                })
                .eq('id', currentTableOrder.orderid);
            const {data:ordertable, error: ordererror } = await supabase
                .from('order_tables')
                .select('*')
                .eq('orderid', currentTableOrder.orderid);
            const { error: tableOrderError } = await supabase
            .from('table')
            .update({
                is_occupied: false,
            }).eq('id', ordertable[0].tableid);
            if (orderError) throw orderError;

            // Create payment record
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    orderid: currentTableOrder.orderid,
                    payment_method: paymentMethod,
                    amount_paid: parseFloat(amountPaid),
                    paid_at: new Date().toISOString(),
                    change_due: parseFloat(changeDue)
                });

            if (paymentError) throw paymentError;

            // Update table status
            await onUpdateStatus(table.id, false);

            alert('Payment processed successfully!');
            // Call the new callback
            onCheckoutComplete?.();
            onClose();

        } catch (error) {
            console.error('Error processing checkout:', error);
            alert('Failed to process checkout: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Checkout</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Customer Details */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                        <input
                            type="text"
                            value={customerDetails.name}
                            onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                        <input
                            type="tel"
                            value={customerDetails.mobile}
                            onChange={(e) => setCustomerDetails(prev => ({ ...prev, mobile: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea
                            value={customerDetails.address}
                            onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="upi">UPI</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                        <input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-semibold">${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Change Due:</span>
                        <span className="font-semibold">${changeDue}</span>
                    </div>
                </div>

                <button
                    onClick={handleCheckout}
                    disabled={loading || !amountPaid || parseFloat(amountPaid) < totalAmount}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'Processing...' : 'Complete Checkout'}
                </button>
            </div>
        </div>
    );
}
