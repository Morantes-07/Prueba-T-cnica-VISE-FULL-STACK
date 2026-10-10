import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="app-header">
        <strong>Inventario</strong>
        <nav>
          <NavLink to="/products">Productos</NavLink>
        </nav>
        <button type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}