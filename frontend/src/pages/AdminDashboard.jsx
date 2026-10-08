import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatGrid from '../components/StatGrid';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const LINKS = [{ to: '/admin', label: 'Overview', end: true }];

export default function AdminDashboard() {
  const { auth } = useAuth();
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  async function loadAll() {
    const [s, p, c] = await Promise.all([
      api.dashboardSummary(auth.token),
      api.pendingUsers(auth.token),
      api.getCategories()
    ]);
    setSummary(s);
    setPending(p);
    setCategories(c);
  }

  useEffect(() => { loadAll(); }, []);

  async function handleDecision(id, status) {
    await api.setUserStatus(auth.token, id, status);
    loadAll();
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createCategory(auth.token, newCategory);
      setNewCategory('');
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!summary) return <Layout links={LINKS}><p>Loading…</p></Layout>;

  return (
    <Layout links={LINKS}>
      <div className="topline">
        <div>
          <h1>Admin overview</h1>
          <p>System-wide reports, account approvals, and master categories.</p>
        </div>
      </div>

      <StatGrid stats={[
        { label: 'Total users', value: summary.totalUsers },
        { label: 'Pending approvals', value: summary.pendingUsers },
        { label: 'Total products', value: summary.totalProducts },
        { label: 'Total orders', value: summary.totalOrders }
      ]} />

      <div className="section">
        <div className="section-title">
          <h2>Pending account approvals</h2>
          <span className="count">{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <div className="empty-state">No accounts waiting for approval.</div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
            <tbody>
              {pending.map(u => (
                <tr key={u.user_id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td className="mono">{u.role}</td>
                  <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn amber small" onClick={() => handleDecision(u.user_id, 'approved')}>Approve</button>
                    <button className="btn danger small" onClick={() => handleDecision(u.user_id, 'rejected')}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="section">
        <div className="section-title">
          <h2>Master product categories</h2>
          <span className="count">{categories.length}</span>
        </div>
        <div className="card">
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input placeholder="e.g. Dairy" value={newCategory} onChange={e => setNewCategory(e.target.value)} required />
            <button className="btn small" type="submit">Add category</button>
          </form>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(c => (
              <span key={c.category_id} className="badge Confirmed">{c.name}</span>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
