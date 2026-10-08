import { useState } from 'react';

export default function ProductFormModal({ categories, initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    name: '', batch_no: '', description: '', category_id: '',
    vendor_price: '', wholesale_price: '', retail_price: '',
    stock_qty: '', low_stock_threshold: 10
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        category_id: form.category_id || null,
        vendor_price: Number(form.vendor_price),
        wholesale_price: form.wholesale_price ? Number(form.wholesale_price) : null,
        retail_price: form.retail_price ? Number(form.retail_price) : null,
        stock_qty: Number(form.stock_qty) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 10
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{initial ? 'Edit product' : 'Add product'}</h3>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Product name</label>
            <input required value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Batch number</label>
            <input required value={form.batch_no} onChange={e => update('batch_no', e.target.value)} placeholder="e.g. RICE-2026-002" />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={form.category_id || ''} onChange={e => update('category_id', e.target.value)}>
              <option value="">— None —</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={2} value={form.description || ''} onChange={e => update('description', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>Vendor price</label>
              <input type="number" step="0.01" required value={form.vendor_price} onChange={e => update('vendor_price', e.target.value)} />
            </div>
            <div className="field">
              <label>Wholesale price</label>
              <input type="number" step="0.01" value={form.wholesale_price || ''} onChange={e => update('wholesale_price', e.target.value)} />
            </div>
            <div className="field">
              <label>Retail price</label>
              <input type="number" step="0.01" value={form.retail_price || ''} onChange={e => update('retail_price', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>Stock quantity</label>
              <input type="number" required={!initial} disabled={!!initial} value={form.stock_qty} onChange={e => update('stock_qty', e.target.value)} />
            </div>
            <div className="field">
              <label>Low-stock threshold</label>
              <input type="number" value={form.low_stock_threshold} onChange={e => update('low_stock_threshold', e.target.value)} />
            </div>
          </div>
          {initial && <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: -6 }}>Stock quantity changes only through orders, not editing.</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
