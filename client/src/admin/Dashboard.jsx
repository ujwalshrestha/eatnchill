import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);
  const refreshInFlightRef = useRef(false);
  const refreshQueuedRef = useRef(false);
  const metaLoadedRef = useRef(false);

  useEffect(() => {
    scheduleRefresh({ immediate: true });
    // SSE for real-time orders
    const eventSource = new EventSource('/api/orders/stream');
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'new_order' || data.type === 'status_update') {
        scheduleRefresh();
      }
    };
    return () => {
      eventSource.close();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  function scheduleRefresh({ immediate = false } = {}) {
    // Most-accurate strategy: always re-fetch from the server, but debounce
    // to avoid duplicate refreshes (button click + SSE + multiple SSE events).
    refreshQueuedRef.current = true;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      void loadDataDebounced();
    }, immediate ? 0 : 700);
  }

  async function loadDataDebounced() {
    if (refreshInFlightRef.current) return;
    if (!refreshQueuedRef.current) return;
    refreshQueuedRef.current = false;

    refreshInFlightRef.current = true;
    try {
      await loadData();
    } finally {
      refreshInFlightRef.current = false;
      // If another refresh was queued while we were fetching, run again once.
      if (refreshQueuedRef.current) {
        scheduleRefresh({ immediate: true });
      }
    }
  }

  async function loadData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [txRes, ordersRes] = await Promise.all([
        api.getDailyTransactionsSummary(today),
        api.getOrders(`date=${today}&limit=10`),
      ]);

      // These numbers don’t change on every order status update; load them once.
      if (!metaLoadedRef.current) {
        const [tablesRes, categoriesRes] = await Promise.all([api.getTables(), api.getCategories()]);
        metaLoadedRef.current = true;
        setStats(prev => ({
          ...(prev || {}),
          totalTables: tablesRes.data.length,
          activeTables: tablesRes.data.filter(t => t.current_session_status === 'active').length,
          totalCategories: categoriesRes.data.length,
          totalItems: categoriesRes.data.reduce((sum, c) => sum + (c.item_count || 0), 0),
        }));
      }

      setStats(prev => ({
        ...(prev || {}),
        ...txRes.data.summary,
      }));
      setRecentOrders(ordersRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId, status) {
    try {
      await api.updateOrderStatus(orderId, status);
      scheduleRefresh({ immediate: true });
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const statusColors = {
    pending: 'var(--accent-amber)',
    preparing: 'var(--accent-blue)',
    ready: 'var(--accent-emerald)',
    completed: 'var(--primary-light)',
    cancelled: 'var(--accent-rose)',
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--primary)' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(124,77,255,0.1)' }}>📦</div>
          <div className="stat-card-value">{stats?.total_orders || 0}</div>
          <div className="stat-card-label">Today's Orders</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--accent-emerald)' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(0,230,118,0.1)' }}>💵</div>
          <div className="stat-card-value">${(stats?.total_revenue || 0).toFixed(2)}</div>
          <div className="stat-card-label">Today's Revenue</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--accent-amber)' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(255,171,64,0.1)' }}>🪑</div>
          <div className="stat-card-value">{stats?.activeTables || 0}/{stats?.totalTables || 0}</div>
          <div className="stat-card-label">Active Tables</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--accent-cyan)' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(24,255,255,0.1)' }}>🍽️</div>
          <div className="stat-card-value">{stats?.totalItems || 0}</div>
          <div className="stat-card-label">Menu Items</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Recent Orders</h3>
          <span className="badge badge-pending" style={{ fontSize: 12 }}>
            {stats?.pending_orders || 0} pending
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No orders yet today</h3>
            <p>Orders will appear here in real-time</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700 }}>#{order.id}</td>
                  <td>{order.table_number}</td>
                  <td>{order.customer_name || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{item.quantity}x {item.name}</span>
                        {item.options?.length > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--accent-emerald)', paddingLeft: 8 }}>
                            {item.options.map(o => `+ ${o.name}`).join(', ')}
                          </div>
                        )}
                        {item.special_instructions && (
                          <div style={{ fontSize: 11, color: 'var(--accent-amber)', fontStyle: 'italic', paddingLeft: 8 }}>
                            Note: {item.special_instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>
                  <td style={{ fontWeight: 600 }}>${order.total_amount?.toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${order.status}`}>{order.status}</span>
                  </td>
                  <td>
                    {order.status === 'pending' && (
                      <button className="btn btn-sm btn-secondary" onClick={() => handleStatusChange(order.id, 'preparing')}>
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button className="btn btn-sm btn-secondary" style={{ borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)' }}
                        onClick={() => handleStatusChange(order.id, 'ready')}>
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(order.id, 'completed')}>
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
