import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Movement } from '../movements/movement.entity';

@Entity({ name: 'products' })
@Check('CHK_products_stock_non_negative', '"stock" >= 0')
@Check('CHK_products_price_non_negative', '"price" >= 0')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  sku: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value?: number) => value,
      from: (value?: string | null) =>
        value === null || value === undefined ? value : parseFloat(value),
    },
  })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'category_id', type: 'int' })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Movement, (movement) => movement.product)
  movements: Movement[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}