import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { getErrorMessage } from '../api/errors';
import type { Category, Product } from '../api/types';

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;

  const [categories, setCategories] = useState<Category[] | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Category[]>('/categories')
      .then((res) => {
        if (!cancelled) setCategories(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    api
      .get<Product>(`/products/${id}`)
      .then((res) => {
        if (!cancelled) setProduct(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  if (loadError) return <p className="error">{loadError}</p>;
  if (categories === null || (isEdit && product === null)) return <p>Cargando...</p>;

  return (
    <ProductForm
      key={product?.id ?? 'new'}
      initial={product ?? undefined}
      categories={categories}
    />
  );
}

function ProductForm({ initial, categories }: { initial?: Product; categories: Category[] }) {
  const navigate = useNavigate();
  const [name, setName] = useState(initial?.name ?? '');
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [categoryId, setCategoryId] = useState(initial ? String(initial.categoryId) : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (categories.length === 0) {
    return (
      <p>
        Primero debes crear una categoría. <Link to="/products">Ir al listado</Link>
      </p>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      name,
      sku,
      price: Number(price),
      categoryId: Number(categoryId),
    };
    try {
      if (initial) {
        await api.patch(`/products/${initial.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/products');
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form className="card form-grid" style={{ maxWidth: 520 }} onSubmit={handleSubmit}>
      <h1 style={{ margin: 0 }}>{initial ? 'Editar producto' : 'Nuevo producto'}</h1>

      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} required />
      </label>

      <label>
        SKU
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          maxLength={50}
          pattern="[A-Za-z0-9_\-]+"
          title="Solo letras, números, guiones y guion bajo"
          required
        />
      </label>

      <label>
        Precio
        <input
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </label>

      <label>
        Categoría
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
        {initial
          ? `Stock actual: ${initial.stock}. El stock solo cambia registrando movimientos.`
          : 'El producto se crea con stock 0. Registra una entrada desde "Movimiento".'}
      </p>

      {error && <p className="error">{error}</p>}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <Link to="/products">
          <button type="button" className="secondary">
            Cancelar
          </button>
        </Link>
      </div>
    </form>
  );
}