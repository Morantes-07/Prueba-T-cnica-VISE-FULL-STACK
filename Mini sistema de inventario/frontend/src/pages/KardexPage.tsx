import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { getErrorMessage } from '../api/errors';
import type { KardexResponse } from '../api/types';

const LIMIT = 15;

interface Loaded {
  key: string;
  data?: KardexResponse;
  error?: string;
}

export function KardexPage() {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const key = `${id}|${page}`;
  const loading = loaded?.key !== key;

  useEffect(() => {
    let cancelled = false;
    api
      .get<KardexResponse>(`/products/${id}/kardex`, { params: { page, limit: LIMIT } })
      .then((res) => {
        if (!cancelled) setLoaded({ key, data: res.data });
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoaded({ key, error: getErrorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [key, id, page]);

  const data = loaded?.data;
  const error = !loading ? loaded?.error : undefined;

  return (
    <>
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>Kardex</h1>
        <Link to="/products">
          <button type="button" className="secondary">
            Volver al listado
          </button>
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {!data && loading && <p>Cargando...</p>}

      {data && (
        <div style={{ opacity: loading ? 0.5 : 1 }}>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <strong>{data.product.name}</strong> ({data.product.sku}) · Stock actual:{' '}
            <strong>{data.product.stock}</strong>{' '}
            <Link to={`/products/${data.product.id}/movement`}>
              <button type="button" style={{ marginLeft: '0.75rem' }}>
                Registrar movimiento
              </button>
            </Link>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th className="num">Cantidad</th>
                <th className="num">Saldo</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={6}>Este producto aún no tiene movimientos.</td>
                </tr>
              )}
              {data.data.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{new Date(row.createdAt).toLocaleString('es-CO')}</td>
                  <td className={row.type === 'IN' ? 'badge-in' : 'badge-out'}>
                    {row.type === 'IN' ? 'Entrada' : 'Salida'}
                  </td>
                  <td className="num">
                    {row.type === 'IN' ? '+' : '-'}
                    {row.quantity}
                  </td>
                  <td className="num">
                    <strong>{row.balance}</strong>
                  </td>
                  <td>{row.note ?? ''}</td>
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
              movimientos)
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