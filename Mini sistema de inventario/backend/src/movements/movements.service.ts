import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { buildPaginated } from '../common/interfaces/paginated';
import { Product } from '../products/product.entity';
import { ProductsService } from '../products/products.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { MovementType } from './movement-type.enum';
import { Movement } from './movement.entity';

// Máximo valor de una columna integer de Postgres.
const MAX_STOCK = 2_147_483_647;

export interface KardexRow {
  id: number;
  type: MovementType;
  quantity: number;
  note: string | null;
  createdAt: Date;
  balance: number;
}

@Injectable()
export class MovementsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly productsService: ProductsService,
  ) {}

  async create(dto: CreateMovementDto) {
    const { productId, type, quantity, note } = dto;

    return this.dataSource.transaction(async (manager) => {
      // SELECT ... FOR UPDATE: nadie más puede modificar este producto
      // hasta que esta transacción termine.
      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) throw new NotFoundException('Producto no encontrado');

      const delta = type === MovementType.IN ? quantity : -quantity;
      const newStock = product.stock + delta;

      if (newStock < 0) {
        throw new UnprocessableEntityException(
          `Stock insuficiente: disponible ${product.stock}, solicitado ${quantity}`,
        );
      }
      if (newStock > MAX_STOCK) {
        throw new UnprocessableEntityException(
          'La entrada supera el stock máximo permitido',
        );
      }

      await manager.update(Product, productId, { stock: newStock });

      const movement = await manager.save(
        manager.create(Movement, {
          productId,
          type,
          quantity,
          note: note ?? null,
        }),
      );

      return { ...movement, stockAfter: newStock };
    });
  }

  async getKardex(productId: number, { page, limit }: PaginationQueryDto) {
    const product = await this.productsService.findOne(productId); // 404 si no existe

    // La función de ventana se calcula sobre TODOS los movimientos del
    // producto antes de aplicar LIMIT/OFFSET, así que el saldo de cada
    // página es el acumulado real desde el primer movimiento.
    const rows: KardexRow[] = await this.dataSource.query(
      `SELECT id, type, quantity, note, created_at AS "createdAt",
              SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END)
                OVER (ORDER BY id)::int AS balance
       FROM movements
       WHERE product_id = $1
       ORDER BY id
       LIMIT $2 OFFSET $3`,
      [productId, limit, (page - 1) * limit],
    );

    const [{ total }] = await this.dataSource.query<{ total: number }[]>(
      `SELECT COUNT(*)::int AS total FROM movements WHERE product_id = $1`,
      [productId],
    );

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
      },
      ...buildPaginated(rows, total, page, limit),
    };
  }
}