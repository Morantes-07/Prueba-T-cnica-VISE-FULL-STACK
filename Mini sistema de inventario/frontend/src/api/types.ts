export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  categoryId: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export type MovementType = 'IN' | 'OUT';

export interface KardexRow {
  id: number;
  type: MovementType;
  quantity: number;
  note: string | null;
  createdAt: string;
  balance: number;
}

export interface KardexResponse extends Paginated<KardexRow> {
  product: Pick<Product, 'id' | 'name' | 'sku' | 'stock'>;
}