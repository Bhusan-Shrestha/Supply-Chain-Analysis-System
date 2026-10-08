import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PlaceOrderModal from '../components/PlaceOrderModal';
import ManifestStrip from '../components/ManifestStrip';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const LINKS = [{ to: '/shop', label: 'Shop', end: true }];

export default function ConsumerShop() {
  const { auth } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderProduct, setOrderProduct] = useState(null);
  const [trace, setTrace] = useState(null);
  const [tracking, setTracking] = useState({}); // order_id -> history[]
  const [view, setView] = useState('shop');

  async function loadAll() {
    const [c, o] = await Promise.all([
      api.sellableBy('retailer'),
      api.myOrders(auth.token)
    ]);
    setCatalog(c);
    setOrders(o);
  }

  useEffect(() => { loadAll(); }, []);

  async function handlePlaceOrder(product, quantity) {
    await api.placeOrder(auth.token, {
      seller_id: product.vendor_id,
      items: [{ product_id: product.product_id, quantity }]
    });
    loadAll();
  }

  async function handleTraceability(productId) {
    const t = await api.getTraceability(productId);
    setTrace(t);
  }

  async function toggleTracking(orderId) {
    if (tracking[orderId]) {
      setTracking(t => { const n = { ...t }; delete n[orderId]; return n; });
      return;
    }
    const history = await api.orderTracking(auth.token, orderId);
    setTracking(t => ({ ...t, [orderId]: history }));
  }

  return (
    <Layout links={LINKS}>
      <div className="topline">
        <div>
          <h1>Consumer portal</h1>
          <p>Browse products, place orders, and trace items back to their origin.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`btn ${view === 'shop' ? '' : 'secondary'} small`} onClick={() => setView('shop')}>Shop</button>
        <button className={`btn ${view === 'orders' ? '' : 'secondary'} small`} onClick={() => setView('orders')}>My orders ({orders.length})</button>
      </div>

      {view === 'shop' && (
        <div className="section">
          {catalog.length === 0 ? (
            <div className="empty-state">No products currently available from retailers.</div>
          ) : (
            <div className="product-grid">
              {catalog.map(p => (
                <div className="product-card" key={p.product_id}>
                  <div>
                    <strong>{p.name}</strong>
                    <div className="batch">Batch {p.batch_no} · Sold by {p.vendor?.name}</div>
                  </div>
                  <div className="price">Rs {p.retail_price}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{p.stock_qty} in stock</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn amber small" style={{ flex: 1 }} onClick={() => setOrderProduct(p)}>Order</button>
                    <button className="btn secondary small" onClick={() => handleTraceability(p.product_id)}>Trace</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'orders' && (
        <div className="section">
          {orders.length === 0 ? (
            <div className="empty-state">You haven't placed any orders yet.</div>
          ) : (
            orders.map(o => (
              <div className="card" key={o.order_id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <strong className="mono">Order #{String(o.order_id).padStart(4, '0')}</strong>
                    <span style={{ marginLeft: 10 }} className={`badge ${o.status}`}>{o.status}</span>
                  </div>
                  <div className="mono">Rs {o.total_amount.toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>
                  From {o.seller?.name} · {o.OrderItems?.reduce((s, i) => s + i.quantity, 0)} units
                </div>
                <button className="btn secondary small" onClick={() => toggleTracking(o.order_id)}>
                  {tracking[o.order_id] ? 'Hide tracking' : 'Track order'}
                </button>
                {tracking[o.order_id] && (
                  <div style={{ marginTop: 14 }}>
                    <ManifestStrip status={o.status} history={tracking[o.order_id]} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {orderProduct && (
        <PlaceOrderModal
          product={orderProduct}
          priceField="retail_price"
          onPlace={handlePlaceOrder}
          onClose={() => setOrderProduct(null)}
        />
      )}

      {trace && (
        <div className="modal-backdrop" onClick={() => setTrace(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Product traceability</h3>
            <table>
              <tbody>
                <tr><td>Product</td><td>{trace.name}</td></tr>
                <tr><td>Batch no.</td><td className="mono">{trace.batch_no}</td></tr>
                <tr><td>Category</td><td>{trace.category || '—'}</td></tr>
                <tr><td>Originating vendor</td><td>{trace.originating_vendor}</td></tr>
                <tr><td>Current available stock</td><td>{trace.current_available_stock}</td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="btn secondary small" onClick={() => setTrace(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
