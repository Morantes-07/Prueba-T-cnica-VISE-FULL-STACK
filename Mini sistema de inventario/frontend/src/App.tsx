import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/products" element={<ProductsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}