import React, { useState, useEffect } from 'react';
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
    onCheckoutComplete
}) {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        address: '',
        mobile: ''
    });
    const [loading, setLoading] = useState(false);
    const [previousOrderItems, setPreviousOrderItems] = useState([]);

    useEffect(() => {
        const fetchPreviousOrder = async () => {
            if (currentTableOrder?.orderid) {
                try {
                    const { data, error } = await supabase
                        .from('orders')
                        .select(`
                            id,
                            status,
                            total_amount,
                            receipt_no,
                            tax,
                            created_at,
                            order_items (
                                id,
                                quantity,
                                price,
                                total_price,
                                items (
                                    id,
                                    name,
                                    price,
                                    category,
                                    storeid
                                )
                            )
                        `)
                        .eq('id', currentTableOrder.orderid)
                        .eq('status', 'pending')
                        .single();

                    if (error) throw error;
                    if (data) {
                        setPreviousOrderItems(data.order_items || []);
                        // You might want to update other state values here based on the fetched data
                    }
                } catch (error) {
                    console.error('Error fetching previous order:', error);
                }
            }
        };

        if (isOpen) {
            fetchPreviousOrder();
        }
    }, [isOpen, currentTableOrder?.orderid]);

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

            // Only update table status for dine-in orders
            if (orderDetails.order_type === 'dine-in') {
                const {data:ordertable, error: ordererror } = await supabase
                    .from('order_tables')
                    .select('*')
                    .eq('orderid', currentTableOrder.orderid);
                const { error: tableOrderError } = await supabase
                    .from('table')
                    .update({
                        is_occupied: false,
                    }).eq('id', ordertable[0].tableid);
                    const { error: tableUpdateError } = await supabase
                    .from('table')
                    .update({
                        is_occupied: false,
                    }).eq('id', ordertable[0].tableid);
                if (tableUpdateError) throw tableUpdateError;
            }
            
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

                {/* Previous Order Items */}
                {previousOrderItems.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Previous Order Items</h3>
                        <div className="space-y-2">
                            {previousOrderItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <span>{item.items.name}</span>
                                    <span>x{item.quantity}</span>
                                    <span>${item.total_price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
