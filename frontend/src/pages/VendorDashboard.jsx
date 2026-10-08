import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatGrid from '../components/StatGrid';
import OrdersTable from '../components/OrdersTable';
import ProductFormModal from '../components/ProductFormModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const LINKS = [{ to: '/vendor', label: 'Overview', end: true }];

export default function VendorDashboard() {
  const { auth } = useAuth();
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  async function loadAll() {
    const [s, allProducts, c, o, ls] = await Promise.all([
      api.dashboardSummary(auth.token),
      api.getProducts(),
      api.getCategories(),
      api.incomingOrders(auth.token),
      api.lowStock(auth.token)
    ]);
    setSummary(s);
    setProducts(allProducts.filter(p => p.vendor_id === auth.user.user_id));
    setCategories(c);
    setOrders(o);
    setLowStock(ls);
  }

  useEffect(() => { loadAll(); }, []);

  async function handleSaveProduct(payload) {
    if (editingProduct) {
      await api.updateProduct(auth.token, editingProduct.product_id, payload);
    } else {
      await api.createProduct(auth.token, payload);
    }
    setModalOpen(false);
    setEditingProduct(null);
    loadAll();
  }

  async function handleDeleteProduct(id) {
    if (!confirm('Remove this product from the catalog?')) return;
    await api.deleteProduct(auth.token, id);
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

  if (!summary) return <Layout links={LINKS}><p>Loading…</p></Layout>;

  return (
    <Layout links={LINKS}>
      <div className="topline">
        <div>
          <h1>Vendor dashboard</h1>
          <p>Manage your product catalog and fulfill wholesaler orders.</p>
        </div>
        <button className="btn amber" onClick={() => { setEditingProduct(null); setModalOpen(true); }}>+ Add product</button>
      </div>

      <StatGrid stats={[
        { label: 'Products listed', value: summary.productCount },
        { label: 'Sales orders', value: summary.totalSalesOrders },
        { label: 'Revenue (Rs)', value: summary.totalSalesRevenue.toLocaleString() },
        { label: 'Low-stock items', value: lowStock.length }
      ]} />

      {lowStock.length > 0 && (
        <div className="section">
          <div className="card" style={{ borderLeft: '3px solid var(--danger)' }}>
            <strong style={{ color: 'var(--danger)' }}>Low-stock alert</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
              {lowStock.map(p => (
                <li key={p.product_id}>{p.name} — {p.quantity} left (threshold {p.threshold})</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-title">
          <h2>Your products</h2>
          <span className="count">{products.length}</span>
        </div>
        {products.length === 0 ? (
          <div className="empty-state">No products listed yet. Add your first product to start selling.</div>
        ) : (
          <table>
            <thead><tr><th>Product</th><th>Batch</th><th>Stock</th><th>Vendor price</th><th></th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.product_id}>
                  <td>{p.name}</td>
                  <td className="mono">{p.batch_no}</td>
                  <td>{p.stock_qty}</td>
                  <td className="mono">Rs {p.vendor_price}</td>
                  <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn secondary small" onClick={() => { setEditingProduct(p); setModalOpen(true); }}>Edit</button>
                    <button className="btn danger small" onClick={() => handleDeleteProduct(p.product_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="section">
        <div className="section-title">
          <h2>Incoming orders</h2>
          <span className="count">{orders.length}</span>
        </div>
        <OrdersTable orders={orders} mode="incoming" otherPartyLabel="Wholesaler" onAdvance={handleAdvance} onCancel={handleCancel} />
      </div>

      {modalOpen && (
        <ProductFormModal
          categories={categories}
          initial={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        />
      )}
    </Layout>
  );
}
