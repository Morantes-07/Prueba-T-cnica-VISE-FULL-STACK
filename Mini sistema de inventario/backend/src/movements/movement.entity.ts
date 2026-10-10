import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';
import { MovementType } from './movement-type.enum';

@Entity({ name: 'movements' })
@Check('CHK_movements_quantity_positive', '"quantity" > 0')
@Index('IDX_movements_product_created', ['productId', 'createdAt'])
export class Movement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @ManyToOne(() => Product, (product) => product.movements, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'enum', enum: MovementType, enumName: 'movement_type' })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}