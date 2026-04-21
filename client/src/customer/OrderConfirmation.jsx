import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function OrderConfirmation({ orderId, onNewOrder }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await api.getOrder(orderId);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();

    // Set up SSE for status updates
    const eventSource = new EventSource('/api/orders/stream');
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'status_update' && data.order.id === orderId) {
        setOrder(prev => ({ ...prev, status: data.order.status }));
      }
    };

    return () => eventSource.close();
  }, [orderId]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const steps = [
    { label: 'Sent', status: ['pending', 'preparing', 'ready', 'completed'] },
    { label: 'Kitchen', status: ['preparing', 'ready', 'completed'] },
    { label: 'Ready', status: ['ready', 'completed'] },
    { label: 'Served', status: ['completed'] }
  ];

  const getStepClass = (step) => {
    if (step.status.includes(order.status)) {
      if (step.status[0] === order.status) return 'active';
      return 'done';
    }
    return '';
  };

  return (
    <div className="order-success">
      <div className="order-success-icon">✅</div>
      <h2>Order Received!</h2>
      <p>Thank you for your order. We're working on it!</p>
      
      <div className="order-number">Order #{orderId}</div>

      <div className="order-tracker">
        {steps.map((step, i) => (
          <div key={i} className={`order-step ${getStepClass(step)}`}>
            <div className="order-step-dot">{getStepClass(step) === 'done' ? '✓' : i + 1}</div>
            <span className="order-step-label">{step.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <button className="btn btn-secondary" onClick={onNewOrder}>
          Order More Items
        </button>
      </div>

      <div style={{ marginTop: 24, textAlign: 'left', padding: '20px', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--customer-border)' }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Order Summary</h3>
        {order.items?.map((item, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
              <span>{item.quantity}x {item.name}</span>
              <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
            {item.options?.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--customer-accent)', marginLeft: 20 }}>
                {item.options.map(o => `+ ${o.name}`).join(', ')}
              </div>
            )}
            {item.special_instructions && (
              <div style={{ fontSize: 12, color: 'var(--customer-text-secondary)', fontStyle: 'italic', marginLeft: 20 }}>
                Note: {item.special_instructions}
              </div>
            )}
          </div>
        ))}
        <div style={{ borderTop: '1px solid #eee', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Total</span>
          <span>${order.total_amount?.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
