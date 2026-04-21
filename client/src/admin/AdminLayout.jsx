import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/admin', icon: '📊', label: 'Dashboard', exact: true },
  { path: '/admin/categories', icon: '📁', label: 'Categories' },
  { path: '/admin/food-items', icon: '🍽️', label: 'Food Items' },
  { path: '/admin/tables', icon: '🪑', label: 'Tables & QR' },
  { path: '/admin/transactions', icon: '💰', label: 'Transactions' },
];

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/categories': 'Categories',
  '/admin/food-items': 'Food Items',
  '/admin/tables': 'Tables & QR Codes',
  '/admin/transactions': 'Transactions',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [alertTable, setAlertTable] = useState('');
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, startTime, duration) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.2);
      playTone(659.25, now + 0.15, 0.4);
    } catch (e) {
      console.log("Audio notification failed:", e);
    }
  };

  useEffect(() => {
    const eventSource = new EventSource('/api/orders/stream');
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'new_order') {
        playNotificationSound();
        setAlertTable(data.order?.table_number || 'Unknown');
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 5000);
      }
    };
    return () => eventSource.close();
  }, []);

  return (
    <div className="admin-layout">
      {newOrderAlert && (
        <div className="global-alert slide-down">
          🔔 New Order Received from Table {alertTable}!
        </div>
      )}

      {sidebarOpen && (
        <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🍽️</div>
          <div>
            <h1>RestroQR</h1>
            <span>Admin Portal</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Menu</div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <h2>{title}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
