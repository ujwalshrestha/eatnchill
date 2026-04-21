import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(15);
  const [savingTimeout, setSavingTimeout] = useState(false);
  const [resettingTableId, setResettingTableId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ table_number: '', seats: 4, is_active: 1 });
  const [deleteId, setDeleteId] = useState(null);
  const [qrData, setQrData] = useState(null);
  const toast = useToast();

  useEffect(() => { loadTables(); }, []);

  async function loadTables() {
    try {
      const [tablesRes, settingsRes] = await Promise.all([
        api.getTables(),
        api.getSessionTimeoutSettings(),
      ]);
      setTables(tablesRes.data);
      setSessionTimeout(settingsRes.data.session_timeout_minutes);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  async function saveSessionTimeout() {
    try {
      setSavingTimeout(true);
      const minutes = parseInt(sessionTimeout, 10);
      const res = await api.updateSessionTimeoutSettings(minutes);
      setSessionTimeout(res.data.session_timeout_minutes);
      toast('Session timeout updated!');
      loadTables();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingTimeout(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm({ table_number: '', seats: 4, is_active: 1 });
    setShowModal(true);
  }

  function openEdit(table) {
    setEditing(table);
    setForm({ table_number: table.table_number, seats: table.seats, is_active: table.is_active });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = { ...form, seats: parseInt(form.seats) };
      if (editing) {
        await api.updateTable(editing.id, data);
        toast('Table updated!');
      } else {
        await api.createTable(data);
        toast('Table created!');
      }
      setShowModal(false);
      loadTables();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function handleDelete() {
    try {
      await api.deleteTable(deleteId);
      toast('Table deleted!');
      setDeleteId(null);
      loadTables();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function showQR(table) {
    try {
      const res = await api.getTableQR(table.id);
      setQrData(res.data);
    } catch (err) { toast(err.message, 'error'); }
  }

  async function resetSession(table) {
    try {
      setResettingTableId(table.id);
      const res = await api.resetTableSession(table.id);
      toast(res.message || `Session reset for ${table.table_number}`);
      loadTables();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setResettingTableId(null);
    }
  }

  function downloadQR() {
    if (!qrData) return;
    const a = document.createElement('a');
    a.href = qrData.qr_code;
    a.download = `QR-Table-${qrData.table_number}.png`;
    a.click();
  }

  function formatSessionExpiry(value) {
    if (!value) return 'No active session';
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2>Tables ({tables.length})</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Table</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Table Session Timeout</h3>
            <p style={{ color: 'var(--admin-text-secondary)', fontSize: 14 }}>
              When a table stays inactive for this many minutes, the next scan can start a fresh session on the same QR.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              className="form-input"
              type="number"
              min="1"
              max="240"
              value={sessionTimeout}
              onChange={e => setSessionTimeout(e.target.value)}
              style={{ width: 110 }}
            />
            <span style={{ color: 'var(--admin-text-secondary)', fontSize: 14 }}>minutes</span>
            <button className="btn btn-primary" onClick={saveSessionTimeout} disabled={savingTimeout}>
              {savingTimeout ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🪑</div>
            <h3>No tables configured</h3>
            <p>Add tables to generate QR codes for ordering</p>
          </div>
        </div>
      ) : (
        <div className="grid-4">
          {tables.map(table => (
            <div key={table.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{table.table_number}</div>
                  <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>{table.seats} seats</div>
                </div>
                <span className={`badge badge-${table.is_active ? 'active' : 'inactive'}`}>
                  {table.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {table.active_orders > 0 && (
                <div style={{
                  padding: '8px 12px', background: 'rgba(255,171,64,0.1)', borderRadius: 'var(--radius-sm)',
                  marginBottom: 12, fontSize: 13, color: 'var(--accent-amber)', fontWeight: 600
                }}>
                  🔔 {table.active_orders} active order{table.active_orders > 1 ? 's' : ''}
                </div>
              )}

              {table.current_session_id ? (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(0,230,118,0.08)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 12,
                  fontSize: 13,
                  color: 'var(--accent-emerald)',
                  fontWeight: 600
                }}>
                  Session active until {formatSessionExpiry(table.current_session_expires_at)}
                </div>
              ) : (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 12,
                  fontSize: 13,
                  color: 'var(--admin-text-secondary)',
                  fontWeight: 600
                }}>
                  No active session
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => showQR(table)}>📱 QR Code</button>
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(table)}>✏️ Edit</button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => resetSession(table)}
                  disabled={!table.current_session_id || resettingTableId === table.id}
                >
                  {resettingTableId === table.id ? 'Resetting...' : '♻️ Reset Session'}
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(table.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Table' : 'Add Table'} onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
            </>
          }>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Table Number *</label>
              <input className="form-input" value={form.table_number}
                onChange={e => setForm({ ...form, table_number: e.target.value })}
                placeholder="e.g., T1, Table-A" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Number of Seats</label>
              <input className="form-input" type="number" min="1" max="20" value={form.seats}
                onChange={e => setForm({ ...form, seats: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.is_active}
                onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Table" onClose={() => setDeleteId(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          }>
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon">⚠️</div>
            <h4>Delete this table?</h4>
            <p>This will remove the table and its QR code will stop working.</p>
          </div>
        </Modal>
      )}

      {qrData && (
        <Modal title={`QR Code — Table ${qrData.table_number}`} onClose={() => setQrData(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setQrData(null)}>Close</button>
              <button className="btn btn-primary" onClick={downloadQR}>⬇️ Download QR</button>
            </>
          }>
          <div className="qr-display">
            <img src={qrData.qr_code} alt={`QR Code for Table ${qrData.table_number}`} />
            <p style={{ marginTop: 12, wordBreak: 'break-all' }}>{qrData.url}</p>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--admin-text-muted)' }}>
              Print this QR code and place it on Table {qrData.table_number}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
