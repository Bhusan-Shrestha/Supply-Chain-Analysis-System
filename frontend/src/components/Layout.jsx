import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children, links }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">SCMS</div>
        <div className="role-tag">{auth?.user?.role}</div>
        <nav>
          {links.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="logout">
          <div style={{ fontSize: 13, color: '#C9D4E0', marginBottom: 10 }}>
            {auth?.user?.name}
          </div>
          <button className="navlink" onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
