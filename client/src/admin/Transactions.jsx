import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useToast } from '../components/Toast'

export default function Transactions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const toast = useToast();

  useEffect(() => { loadTransactions(); }, [selectedDate]);

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await api.getDailyTransactions(selectedDate);
      setData(res.data);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const s = data?.summary;

  return (
    <div>
      <div className="page-header">
        <h2>Daily Transactions</h2>
        <input type="date" className="date-input" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)} />
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--primary)' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(124,77,255,0.1)' }}>📦</div>
          <div className="stat-card-value">{s?.total_orders || 0}</div>
          <div className="stat-card-label">Total Orders</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--accent-emerald)' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(0,230,118,0.1)' }}>💵</div>
          <div className="stat-card-value">${(s?.total_revenue || 0).toFixed(2)}</div>
          <div className="stat-card-label">Total Revenue</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--accent-cyan)' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(24,255,255,0.1)' }}>📊</div>
          <div className="stat-card-value">${(s?.avg_order_value || 0).toFixed(2)}</div>
          <div className="stat-card-label">Avg Order Value</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--accent-amber)' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(255,171,64,0.1)' }}>✅</div>
          <div className="stat-card-value">{s?.completed_orders || 0}</div>
          <div className="stat-card-label">Completed</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Category Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📁 Sales by Category</h3>
          {data?.categoryBreakdown?.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>Category</th><th>Items Sold</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {data.categoryBreakdown.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{c.category_name}</td>
                    <td>{c.items_sold || 0}</td>
                    <td style={{ fontWeight: 600 }}>${(c.revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No data</div>
          )}
        </div>

        {/* Table Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🪑 Sales by Table</h3>
          {data?.tableBreakdown?.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>Table</th><th>Orders</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {data.tableBreakdown.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{t.table_number}</td>
                    <td>{t.order_count}</td>
                    <td style={{ fontWeight: 600 }}>${(t.revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No data</div>
          )}
        </div>
      </div>

      {/* Top Items */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏆 Top Selling Items</h3>
        {data?.topItems?.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Item</th><th>Price</th><th>Qty Sold</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {data.topItems.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: i < 3 ? 'var(--accent-amber)' : 'var(--admin-text-muted)' }}>
                    {i + 1}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{item.name}</td>
                  <td>${(item.price || 0).toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>{item.total_sold}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>${(item.total_revenue || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No sales data for this date</div>
        )}
      </div>

      {/* Orders List */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          📋 All Orders ({data?.orders?.length || 0})
        </h3>
        {data?.orders?.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr><th>Order #</th><th>Table</th><th>Customer</th><th>Amount</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              {data.orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700 }}>#{order.id}</td>
                  <td>{order.table_number}</td>
                  <td>{order.customer_name || '—'}</td>
                  <td style={{ fontWeight: 600 }}>${(order.total_amount || 0).toFixed(2)}</td>
                  <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                  <td style={{ fontSize: 12 }}>
                    {new Date(order.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No orders for this date</div>
        )}
      </div>
    </div>
  );
}
