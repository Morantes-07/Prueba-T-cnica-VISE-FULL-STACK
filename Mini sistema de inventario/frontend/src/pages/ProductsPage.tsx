import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { getErrorMessage } from '../api/errors';
import type { Category, Paginated, Product } from '../api/types';

const LIMIT = 10;

type Mode = 'all' | 'low';

interface Loaded {
  key: string;
  data?: Paginated<Product>;
  error?: string;
}

export function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [mode, setMode] = useState<Mode>('all');
  const [threshold, setThreshold] = useState(10);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState('');
  const [categoryMsg, setCategoryMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const key = `${mode}|${categoryId}|${threshold}|${page}|${reload}`;
  const loading = loaded?.key !== key;

  useEffect(() => {
    let cancelled = false;
    api
      .get<Category[]>('/categories')
      .then((res) => {
        if (!cancelled) setCategories(res.data);
      })
      .catch(() => {
        /* el filtro quedará vacío; el listado muestra sus propios errores */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const request =
      mode === 'low'
        ? api.get<Paginated<Product>>('/products/low-stock', {
            params: { threshold, page, limit: LIMIT },
          })
        : api.get<Paginated<Product>>('/products', {
            params: { categoryId: categoryId || undefined, page, limit: LIMIT },
          });

    request
      .then((res) => {
        if (!cancelled) setLoaded({ key, data: res.data });
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoaded({ key, error: getErrorMessage(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [key, mode, threshold, categoryId, page]);

  const handleCreateCategory = async (event: FormEvent) => {
    event.preventDefault();
    setCategoryMsg(null);
    try {
      const { data } = await api.post<Category>('/categories', { name: newCategory });
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory('');
      setCategoryMsg({ ok: true, text: `Categoría "${data.name}" creada` });
    } catch (err) {
      setCategoryMsg({ ok: false, text: getErrorMessage(err) });
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return;
    setActionError(null);
    try {
      await api.delete(`/products/${product.id}`);
      if (loaded?.data?.data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setReload((r) => r + 1);
      }
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const data = loaded?.data;
  const error = !loading ? loaded?.error : undefined;

  return (
    <>
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>Productos</h1>
        <Link to="/products/new">
          <button type="button">Nuevo producto</button>
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <label style={{ minWidth: 200 }}>
            Categoría
            <select
              value={categoryId}
              disabled={mode === 'low'}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ flexDirection: 'row', alignItems: 'center' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={mode === 'low'}
              onChange={(e) => {
                setMode(e.target.checked ? 'low' : 'all');
                setPage(1);
              }}
            />
            Solo stock bajo
          </label>

          {mode === 'low' && (
            <label style={{ width: 140 }}>
              Menor a
              <input
                type="number"
                min={0}
                step={1}
                value={threshold}
                onChange={(e) => {
                  setThreshold(Math.max(0, Math.trunc(Number(e.target.value)) || 0));
                  setPage(1);
                }}
              />
            </label>
          )}
        </div>
      </div>

      <form className="card toolbar" onSubmit={handleCreateCategory} style={{ marginBottom: '1rem' }}>
        <label style={{ minWidth: 220 }}>
          Nueva categoría
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            maxLength={100}
            required
          />
        </label>
        <button type="submit">Crear categoría</button>
        {categoryMsg && (
          <span className={categoryMsg.ok ? 'success' : 'error'}>{categoryMsg.text}</span>
        )}
      </form>

      {actionError && <p className="error">{actionError}</p>}
      {error && <p className="error">{error}</p>}

      {!data && loading && <p>Cargando...</p>}

      {data && (
        <div style={{ opacity: loading ? 0.5 : 1 }}>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th className="num">Precio</th>
                <th className="num">Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={6}>No hay productos para mostrar.</td>
                </tr>
              )}
              {data.data.map((p) => (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category?.name ?? '-'}</td>
                  <td className="num">
                    {p.price.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`num ${mode === 'low' ? 'stock-low' : ''}`}>{p.stock}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <Link to={`/products/${p.id}/movement`}>
                        <button type="button">Movimiento</button>
                      </Link>
                      <Link to={`/products/${p.id}/kardex`}>
                        <button type="button" className="secondary">Kardex</button>
                      </Link>
                      <Link to={`/products/${p.id}/edit`}>
                        <button type="button" className="secondary">Editar</button>
                      </Link>
                      <button type="button" className="danger" onClick={() => handleDelete(p)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              type="button"
              className="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </button>
            <span>
              Página {data.meta.page} de {Math.max(data.meta.totalPages, 1)} ({data.meta.total}{' '}
              productos)
            </span>
            <button
              type="button"
              className="secondary"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </>
  );
}