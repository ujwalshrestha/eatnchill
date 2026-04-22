import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Menu from './Menu';
import OrderConfirmation from './OrderConfirmation';

export default function CustomerLayout() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    async function loadTable() {
      try {
        const res = await api.getTable(tableId);
        if (!res.data.is_active) {
          throw new Error('This table is currently inactive.');
        }
        setTable(res.data);
        const sessionRes = await api.startTableSession(tableId);
        setSession(sessionRes.data);
      } catch (err) {
        console.error('Failed to load table:', err);
        // If table doesn't exist or is inactive, we could redirect or show error
      } finally {
        setLoading(false);
      }
    }
    loadTable();
  }, [tableId]);

  // Periodically refresh the session to keep it alive
  useEffect(() => {
    if (!session?.id) return;

    const refreshInterval = setInterval(async () => {
      try {
        const sessionRes = await api.startTableSession(tableId);
        setSession(sessionRes.data);
      } catch (err) {
        console.error('Failed to refresh session:', err);
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [session?.id, tableId]);

  async function ensureSession() {
    const res = await api.startTableSession(tableId);
    setSession(res.data);
    return res.data;
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  if (!table) {
    return (
      <div className="customer-layout">
        <div className="order-success">
          <div className="order-success-icon" style={{ background: 'rgba(255, 82, 82, 0.1)', color: 'var(--accent-rose)' }}>⚠️</div>
          <h2>Invalid Table</h2>
          <p>The table you scanned is not valid or has been deactivated. Please contact staff.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin')}>Go to Admin Portal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <header className="customer-header">
        <div className="customer-header-inner">
          <div className="customer-brand">
            <div className="customer-brand-icon" style={{ background: 'var(--customer-accent-light)' }}>☕</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ fontSize: '20px', lineHeight: '1.2' }}>Eat N Chill</h1>
              <span style={{ fontSize: '10px', color: 'var(--customer-text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Organic & Wholefood</span>
            </div>
          </div>
          <div className="customer-table-badge">Table {table.table_number}</div>
        </div>
      </header>

      <div className="customer-content">
        {orderId ? (
          <OrderConfirmation orderId={orderId} onNewOrder={() => setOrderId(null)} />
        ) : (
          <Menu
            table={table}
            session={session}
            ensureSession={ensureSession}
            onOrderPlaced={(id) => setOrderId(id)}
          />
        )}
      </div>
    </div>
  );
}
