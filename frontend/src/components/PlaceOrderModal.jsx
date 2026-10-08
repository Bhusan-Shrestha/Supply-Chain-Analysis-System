import { useState } from 'react';

// Groups products by seller and lets the buyer build a multi-item order
// for a single seller, then submits it.
export default function PlaceOrderModal({ product, priceField, onPlace, onClose }) {
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const unitPrice = product[priceField] || product.vendor_price;

  async function handleSubmit(e) {
    e.preventDefault();
    setPlacing(true);
    setError('');
    try {
      await onPlace(product, Number(qty));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Order: {product.name}</h3>
        <p className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Batch {product.batch_no} · Seller {product.vendor?.name}</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Quantity</label>
            <input type="number" min={1} required value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '14px 0', fontFamily: 'var(--font-mono)' }}>
            <span>Unit price</span><span>Rs {unitPrice}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            <span>Total</span><span>Rs {(unitPrice * (Number(qty) || 0)).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn amber" disabled={placing}>{placing ? 'Placing…' : 'Place order'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
