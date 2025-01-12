import React, { useState, useEffect } from 'react';
import { ClockIcon, UserIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import OrderModal from './OrderModal';
import { supabase } from '../components/SupabaseClient';
import { useSelector } from 'react-redux';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            total_price,
            items (
              id,
              name
            )
          ),
          order_tables (
            tableid,
            tables (
              table_no
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedOrders = data.map(order => ({
        id: order.id,
        tableNo: order.order_tables?.[0]?.tables?.table_no || 'Takeaway',
        items: order.order_items?.length || 0,
        status: order.status,
        time: new Date(order.created_at).toLocaleTimeString(),
        total: order.total_amount,
        itemDetails: order.order_items
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error:', error);
      alert('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  // ...existing getStatusStyle function...

  const handleCardClick = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  if (loading) {
    return <div className="p-6">Loading orders...</div>;
  }

  return (
    <div className="p-6">
      {/* ...existing header and grid JSX... */}

      {selectedOrder && (
        <OrderModal 
          order={selectedOrder} 
          onClose={closeModal}
        />
      )}
    </div>
  );
}