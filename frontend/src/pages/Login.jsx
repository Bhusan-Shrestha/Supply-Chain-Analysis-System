import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
  admin: '/admin',
  vendor: '/vendor',
  wholesaler: '/wholesaler',
  retailer: '/retailer',
  consumer: '/shop'
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login({ email, password });
      login(token, user);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role) {
    setEmail(`${role}@scms.com`);
    setPassword('password123');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">SCMS</div>
        <div className="tag">Supply Chain Management System</div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-switch">
          No account? <Link to="/register">Register here</Link>
        </div>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Quick demo login (password: password123)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['admin', 'vendor', 'wholesaler', 'retailer', 'consumer'].map(r => (
              <button key={r} type="button" className="btn secondary small" onClick={() => fillDemo(r)}>{r}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
