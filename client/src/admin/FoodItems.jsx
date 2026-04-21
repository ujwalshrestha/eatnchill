import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

const foodEmojis = ['🍕', '🍔', '🌮', '🍣', '🥘', '🍝', '🥗', '🍰', '🍩', '☕', '🧃', '🍗', '🥩', '🍤', '🥐', '🧁'];

function getEmoji(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return foodEmojis[Math.abs(hash) % foodEmojis.length];
}

export default function FoodItems() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category_id: '', is_available: 1
  });
  const toast = useToast();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        api.getFoodItems(),
        api.getCategories()
      ]);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', description: '', price: '', category_id: categories[0]?.id || '', is_available: 1, options: [] });
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id,
      is_available: item.is_available,
      options: item.options || []
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = { ...form, price: parseFloat(form.price), category_id: parseInt(form.category_id) };
      if (editing) {
        await api.updateFoodItem(editing.id, data);
        toast('Item updated!');
      } else {
        await api.createFoodItem(data);
        toast('Item created!');
      }
      setShowModal(false);
      loadData();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function handleDelete() {
    try {
      await api.deleteFoodItem(deleteId);
      toast('Item deleted!');
      setDeleteId(null);
      loadData();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function toggleAvailability(item) {
    try {
      await api.updateFoodItem(item.id, { is_available: item.is_available ? 0 : 1 });
      toast(item.is_available ? 'Item marked unavailable' : 'Item marked available');
      loadData();
    } catch (err) { toast(err.message, 'error'); }
  }

  const filteredItems = filterCategory
    ? items.filter(i => i.category_id === parseInt(filterCategory))
    : items;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2>Food Items ({filteredItems.length})</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="form-select" style={{ width: 180 }} value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Item</button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🍽️</div>
            <h3>No food items yet</h3>
            <p>Add your first menu item to get started</p>
          </div>
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.map(item => (
            <div key={item.id} className="item-card" style={{ opacity: item.is_available ? 1 : 0.5 }}>
              <div className="item-card-image">{getEmoji(item.name)}</div>
              <div className="item-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
                  <div className="item-card-title">{item.name}</div>
                  <span className={`badge badge-${item.is_available ? 'active' : 'inactive'}`} style={{ fontSize: 10, cursor: 'pointer' }}
                    onClick={() => toggleAvailability(item)}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="item-card-desc">{item.description || 'No description'}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 8 }}>{item.category_name}</div>
                <div className="item-card-footer">
                  <div className="item-card-price">${item.price?.toFixed(2)}</div>
                  <div className="item-card-actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>✏️</button>
                    <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(item.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Food Item' : 'Add Food Item'} onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
            </>
          }>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Grilled Salmon" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price ($) *</label>
              <input className="form-input" type="number" step="0.01" min="0" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this item" />
            </div>
            <div className="form-group">
              <label className="form-label">Availability</label>
              <select className="form-select" value={form.is_available}
                onChange={e => setForm({ ...form, is_available: parseInt(e.target.value) })}>
                <option value={1}>Available</option>
                <option value={0}>Unavailable</option>
              </select>
            </div>

            <div style={{ marginTop: 24, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #dee2e6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Item Options (Add-ons)</label>
                <button type="button" className="btn btn-sm btn-secondary" 
                  onClick={() => setForm({ ...form, options: [...(form.options || []), { name: '', price: 0 }] })}>
                  + Add Option
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(form.options || []).map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className="form-input" placeholder="Option name" style={{ flex: 2 }} value={opt.name}
                      onChange={e => {
                        const newOpts = [...form.options];
                        newOpts[i].name = e.target.value;
                        setForm({ ...form, options: newOpts });
                      }} />
                    <input className="form-input" type="number" step="0.01" placeholder="Price" style={{ flex: 1 }} value={opt.price}
                      onChange={e => {
                        const newOpts = [...form.options];
                        newOpts[i].price = parseFloat(e.target.value) || 0;
                        setForm({ ...form, options: newOpts });
                      }} />
                    <button type="button" className="btn btn-sm btn-danger" style={{ padding: '8px 12px' }}
                      onClick={() => {
                        const newOpts = form.options.filter((_, idx) => idx !== i);
                        setForm({ ...form, options: newOpts });
                      }}>🗑️</button>
                  </div>
                ))}
                {(form.options || []).length === 0 && (
                  <div style={{ textAlign: 'center', fontSize: 13, color: '#6c757d', padding: 12 }}>
                    No options added for this item
                  </div>
                )}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Item" onClose={() => setDeleteId(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          }>
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon">⚠️</div>
            <h4>Delete this item?</h4>
            <p>This action cannot be undone.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
