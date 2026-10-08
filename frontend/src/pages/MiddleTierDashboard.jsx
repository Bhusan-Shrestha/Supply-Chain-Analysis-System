import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatGrid from '../components/StatGrid';
import OrdersTable from '../components/OrdersTable';
import PlaceOrderModal from '../components/PlaceOrderModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

// role: 'wholesaler' | 'retailer'
// buysFromRole: role tier this user purchases from
// priceField: which price field on Product this tier pays
// buyerLabel: who appears as "buyer" in this tier's incoming orders
export default function MiddleTierDashboard({ role, buysFromRole, priceField, buyerLabel }) {
  const { auth } = useAuth();
  const [summary, setSummary] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [myInventory, setMyInventory] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [orderProduct, setOrderProduct] = useState(null);

  const links = [{ to: `/${role}`, label: 'Overview', end: true }];

  async function loadAll() {
    const catalogPromise = buysFromRole === 'vendor' ? api.getProducts() : api.sellableBy(buysFromRole);
    const [s, upstream, inv, inc, mine, ls] = await Promise.all([
      api.dashboardSummary(auth.token),
      catalogPromise,
      api.myInventory(auth.token),
      api.incomingOrders(auth.token),
      api.myOrders(auth.token),
      api.lowStock(auth.token)
    ]);
    setSummary(s);
    setCatalog(upstream);
    setMyInventory(inv);
    setIncoming(inc);
    setMyPurchases(mine);
    setLowStock(ls);
  }

  useEffect(() => { loadAll(); }, []);

  async function handlePlaceOrder(product, quantity) {
    await api.placeOrder(auth.token, {
      seller_id: product.vendor_id,
      items: [{ product_id: product.product_id, quantity }]
    });
    loadAll();
  }

  async function handleAdvance(orderId, status) {
    await api.updateOrderStatus(auth.token, orderId, status);
    loadAll();
  }
  async function handleCancel(orderId) {
    await api.updateOrderStatus(auth.token, orderId, 'Cancelled');
    loadAll();
  }

  if (!summary) return <Layout links={links}><p>Loading…</p></Layout>;

  const buyable = catalog;

  return (
    <Layout links={links}>
      <div className="topline">
        <div>
          <h1>{role.charAt(0).toUpperCase() + role.slice(1)} dashboard</h1>
          <p>Order from {buysFromRole}s, manage stock, and fulfill {buyerLabel.toLowerCase()} orders.</p>
        </div>
      </div>

      <StatGrid stats={[
        { label: 'Sales orders', value: summary.totalSalesOrders },
        { label: 'Revenue (Rs)', value: summary.totalSalesRevenue.toLocaleString() },
        { label: 'Purchase orders', value: summary.totalPurchaseOrders },
        { label: 'Low-stock items', value: lowStock.length }
      ]} />

      {lowStock.length > 0 && (
        <div className="section">
          <div className="card" style={{ borderLeft: '3px solid var(--danger)' }}>
            <strong style={{ color: 'var(--danger)' }}>Low-stock alert</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
              {lowStock.map(p => <li key={p.product_id}>{p.name} — {p.quantity} left (threshold {p.threshold})</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-title">
          <h2>My inventory</h2>
          <span className="count">{myInventory.length}</span>
        </div>
        {myInventory.length === 0 ? (
          <div className="empty-state">No stock yet — order from a {buysFromRole} below to build up inventory.</div>
        ) : (
          <table>
            <thead><tr><th>Product</th><th>Batch</th><th>Quantity on hand</th><th>Threshold</th></tr></thead>
            <tbody>
              {myInventory.map(inv => (
                <tr key={inv.inventory_id}>
                  <td>{inv.Product?.name}</td>
                  <td className="mono">{inv.Product?.batch_no}</td>
                  <td>{inv.quantity}</td>
                  <td>{inv.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="section">
        <div className="section-title">
          <h2>Order from {buysFromRole}s</h2>
          <span className="count">{buyable.length}</span>
        </div>
        <div className="product-grid">
          {buyable.map(p => (
            <div className="product-card" key={p.product_id}>
              <div>
                <strong>{p.name}</strong>
                <div className="batch">Batch {p.batch_no} · {p.vendor?.name}</div>
              </div>
              <div className="price">Rs {p[priceField] || p.vendor_price}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{p.stock_qty} units available</div>
              <button className="btn amber small" onClick={() => setOrderProduct(p)} disabled={p.stock_qty <= 0}>
                {p.stock_qty <= 0 ? 'Out of stock' : 'Order'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          <h2>My purchase orders</h2>
          <span className="count">{myPurchases.length}</span>
        </div>
        <OrdersTable orders={myPurchases} mode="mine" otherPartyLabel="Seller" onAdvance={() => {}} onCancel={() => {}} />
      </div>

      <div className="section">
        <div className="section-title">
          <h2>Incoming orders from {buyerLabel.toLowerCase()}s</h2>
          <span className="count">{incoming.length}</span>
        </div>
        <OrdersTable orders={incoming} mode="incoming" otherPartyLabel={buyerLabel} onAdvance={handleAdvance} onCancel={handleCancel} />
      </div>

      {orderProduct && (
        <PlaceOrderModal
          product={orderProduct}
          priceField={priceField}
          onPlace={handlePlaceOrder}
          onClose={() => setOrderProduct(null)}
        />
      )}
    </Layout>
  );
}
