import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PrinterIcon, CreditCardIcon, BanknotesIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { useReactToPrint } from 'react-to-print';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';

// Create a Receipt component for printing
const Receipt = React.forwardRef(({ orderItems, orderDetails, customerDetails, table }, ref) => (
    <div ref={ref} className="p-8 bg-white">
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">MealVault</h1>
            <p className="text-gray-600">Receipt</p>
            <p className="text-sm text-gray-500">Date: {new Date().toLocaleString()}</p>
        </div>

        <div className="mb-4">
            <p><strong>Table:</strong> {table?.table_no}</p>
            <p><strong>Customer:</strong> {customerDetails.name}</p>
            <p><strong>Mobile:</strong> {customerDetails.mobile}</p>
        </div>

        <div className="border-t border-b border-gray-200 py-4 mb-4">
            <table className="w-full">
                <thead>
                    <tr className="text-left">
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {orderItems.map(item => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>${item.price}</td>
                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${orderDetails.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>${orderDetails.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${orderDetails.total_amount.toFixed(2)}</span>
            </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p>Visit us again</p>
        </div>
    </div>
));

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
    const printRef = useRef();
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const navigate = useNavigate();

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        onAfterPrint: () => {
            navigate('/'); // Navigate to dashboard after printing
        }
    });

    const paymentMethods = [
        { id: 'cash', name: 'Cash', icon: BanknotesIcon },
        { id: 'card', name: 'Card', icon: CreditCardIcon },
        { id: 'upi', name: 'UPI', icon: QrCodeIcon },
    ];

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

    // Fix total amount calculation
    const totalAmount = parseFloat(orderDetails.total_amount);
    
    // Calculate change with proper type conversion and validation
    const calculateChange = () => {
        const paid = parseFloat(amountPaid) || 0;
        const change = paid - totalAmount;
        return change.toFixed(2);
    };

    const handleAmountPaidChange = (e) => {
        // Only allow valid numbers
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
            setAmountPaid(value);
        }
    };

    const handleCheckout = async () => {
        try {
            setLoading(true);
            
            // Validate amount paid
            const paidAmount = parseFloat(amountPaid);
            if (isNaN(paidAmount) || paidAmount < totalAmount) {
                alert('Please enter a valid amount equal to or greater than the total');
                return;
            }

            // Update order status and customer details
            const { error: orderError } = await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    customer_name: customerDetails.name || 'Guest',
                    customer_address: customerDetails.address || '',
                    customer_mno: customerDetails.mobile || '',
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

            // Create payment record with validated numbers
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    orderid: currentTableOrder.orderid,
                    payment_method: paymentMethod,
                    amount_paid: paidAmount,
                    paid_at: new Date().toISOString(),
                    change_due: parseFloat(calculateChange())
                });

            if (paymentError) throw paymentError;
            // Update table status

            alert('Payment processed successfully!');
            // Call the new callback
            setIsPrintModalOpen(true);
            await handlePrint();
            navigate('/');
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-xl">
                {/* Header */}
                <div className="bg-green-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Complete Order</h2>
                    <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-full transition-colors">
                        <XMarkIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-medium mb-3">Order Summary</h3>
                        <div className="space-y-2">
                            {orderItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                    <div>
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-sm text-gray-500 ml-2">x{item.quantity}</span>
                                    </div>
                                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-3">Payment Method</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id)}
                                    className={`p-4 rounded-lg flex flex-col items-center transition-all ${
                                        paymentMethod === method.id
                                            ? 'bg-green-50 border-2 border-green-500'
                                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                    }`}
                                >
                                    <method.icon className={`h-6 w-6 ${
                                        paymentMethod === method.id ? 'text-green-500' : 'text-gray-500'
                                    }`} />
                                    <span className="mt-2 font-medium">{method.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                            <input
                                type="text"
                                value={customerDetails.name}
                                onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                            <input
                                type="tel"
                                value={customerDetails.mobile}
                                onChange={(e) => setCustomerDetails(prev => ({ ...prev, mobile: e.target.value }))}
                                className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span>${orderDetails.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax (10%):</span>
                                <span>${orderDetails.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-semibold">
                                <span>Total:</span>
                                <span className="text-green-600">${orderDetails.total_amount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="number"
                                value={amountPaid}
                                onChange={handleAmountPaidChange}
                                min={totalAmount}
                                step="0.01"
                                placeholder="Amount Paid"
                                className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
                            />
                            {amountPaid && (
                                <div className="flex justify-between text-lg font-medium">
                                    <span>Change:</span>
                                    <span className={parseFloat(calculateChange()) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        ${calculateChange()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 px-6 py-4">
                    <button
                        onClick={handleCheckout}
                        disabled={loading || !amountPaid || parseFloat(amountPaid) < orderDetails.total_amount}
                        className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 
                            transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <span>Complete Payment</span>
                                <PrinterIcon className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Print Template */}
            <div className="hidden">
                <Receipt
                    ref={printRef}
                    orderItems={orderItems}
                    orderDetails={orderDetails}
                    customerDetails={customerDetails}
                    table={table}
                />
            </div>
        </div>
    );
}
