import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', is_active: 1 });
  const [deleteId, setDeleteId] = useState(null);
  const toast = useToast();

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    try {
      const res = await api.getCategories();
      setCategories(res.data);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', description: '', is_active: 1 });
    setShowModal(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', is_active: cat.is_active });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateCategory(editing.id, form);
        toast('Category updated!');
      } else {
        await api.createCategory(form);
        toast('Category created!');
      }
      setShowModal(false);
      loadCategories();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function handleDelete() {
    try {
      await api.deleteCategory(deleteId);
      toast('Category deleted!');
      setDeleteId(null);
      loadCategories();
    } catch (err) { toast(err.message, 'error'); }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2>Categories ({categories.length})</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
      </div>

      {categories.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>No categories yet</h3>
            <p>Create your first category to start adding menu items</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{cat.name}</td>
                  <td>{cat.description || '—'}</td>
                  <td><span style={{ fontWeight: 600 }}>{cat.item_count || 0}</span></td>
                  <td>
                    <span className={`badge badge-${cat.is_active ? 'active' : 'inactive'}`}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(cat)}>✏️ Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(cat.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editing ? 'Update' : 'Create'}
              </button>
            </>
          }>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Appetizers" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of this category" />
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
        <Modal title="Delete Category" onClose={() => setDeleteId(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          }>
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon">⚠️</div>
            <h4>Are you sure?</h4>
            <p>This will also delete all food items in this category. This action cannot be undone.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
