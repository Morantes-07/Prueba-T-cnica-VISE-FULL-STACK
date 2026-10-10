import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { getErrorMessage } from '../api/errors';
import type { MovementType, Product } from '../api/types';

export function MovementPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [id]);

  if (loadError) {
    return (
      <>
        <p className="error">{loadError}</p>
        <Link to="/products">Volver al listado</Link>
      </>
    );
  }
  if (!product) return <p>Cargando...</p>;

  return <MovementForm key={product.id} product={product} />;
}

function MovementForm({ product }: { product: Product }) {
  const [stock, setStock] = useState(product.stock);
  const [type, setType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setError('La cantidad debe ser un entero mayor o igual a 1');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post<{ id: number; stockAfter: number }>('/movements', {
        productId: product.id,
        type,
        quantity: qty,
        note: note.trim() || undefined,
      });
      setStock(data.stockAfter);
      setSuccess(
        `${type === 'IN' ? 'Entrada' : 'Salida'} registrada. Stock actual: ${data.stockAfter}`,
      );
      setQuantity('');
      setNote('');
    } catch (err) {
      // Aquí aparece, por ejemplo, "Stock insuficiente: disponible X, solicitado Y" (422).
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card form-grid" style={{ maxWidth: 520 }} onSubmit={handleSubmit}>
      <h1 style={{ margin: 0 }}>Registrar movimiento</h1>

      <div>
        <strong>{product.name}</strong> <span>({product.sku})</span>
        <div>
          Stock actual: <strong>{stock}</strong>
        </div>
      </div>

      <label>
        Tipo
        <select value={type} onChange={(e) => setType(e.target.value as MovementType)}>
          <option value="IN">Entrada</option>
          <option value="OUT">Salida</option>
        </select>
      </label>

      <label>
        Cantidad
        <input
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </label>

      <label>
        Nota (opcional)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} />
      </label>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" disabled={saving}>
          {saving ? 'Registrando...' : 'Registrar'}
        </button>
        <Link to={`/products/${product.id}/kardex`}>
          <button type="button" className="secondary">
            Ver kardex
          </button>
        </Link>
        <Link to="/products">
          <button type="button" className="secondary">
            Volver
          </button>
        </Link>
      </div>
    </form>
  );
}