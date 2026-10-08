import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'consumer' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.register(form);
      setSuccess(res.message);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">SCMS</div>
        <div className="tag">Create an account</div>

        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name / Business name</label>
            <input required value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={e => update('password', e.target.value)} />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={e => update('role', e.target.value)}>
              <option value="consumer">Consumer</option>
              <option value="vendor">Vendor</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="retailer">Retailer</option>
            </select>
          </div>
          {form.role !== 'consumer' && (
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: -6, marginBottom: 14 }}>
              {form.role.charAt(0).toUpperCase() + form.role.slice(1)} accounts require Admin approval before you can log in.
            </p>
          )}
          <button className="btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
