import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import {
  isPgError,
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
} from '../common/database-errors';
import { buildPaginated, Paginated } from '../common/interfaces/paginated';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { LowStockQueryDto } from './dto/low-stock-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    await this.categoriesService.findOneOrFail(dto.categoryId);
    try {
      const product = await this.productsRepository.save(
        this.productsRepository.create(dto),
      );
      return await this.findOne(product.id);
    } catch (error) {
      return this.handleDbError(error);
    }
  }

  async findAll(query: ListProductsQueryDto): Promise<Paginated<Product>> {
    const { page, limit, categoryId } = query;
    const [data, total] = await this.productsRepository.findAndCount({
      where: categoryId ? { categoryId } : {},
      relations: { category: true },
      order: { name: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return buildPaginated(data, total, page, limit);
  }

  async findLowStock(query: LowStockQueryDto): Promise<Paginated<Product>> {
    const { page, limit, threshold } = query;
    const [data, total] = await this.productsRepository.findAndCount({
      where: { stock: LessThan(threshold) },
      relations: { category: true },
      order: { stock: 'ASC', name: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return buildPaginated(data, total, page, limit);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    // Sin relations: si cargáramos "category" y cambiáramos categoryId,
    // TypeORM podría priorizar el objeto cargado y guardar la categoría vieja.
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) throw new NotFoundException('Producto no encontrado');

    if (dto.categoryId !== undefined) {
      await this.categoriesService.findOneOrFail(dto.categoryId);
    }

    Object.assign(product, dto);
    try {
      await this.productsRepository.save(product);
      return await this.findOne(id);
    } catch (error) {
      return this.handleDbError(error);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.productsRepository.delete(id);
      if (!result.affected) throw new NotFoundException('Producto no encontrado');
    } catch (error) {
      if (isPgError(error, PG_FOREIGN_KEY_VIOLATION)) {
        throw new ConflictException(
          'No se puede eliminar un producto que tiene movimientos registrados',
        );
      }
      throw error;
    }
  }

  private handleDbError(error: unknown): never {
    if (isPgError(error, PG_UNIQUE_VIOLATION)) {
      throw new ConflictException('Ya existe un producto con ese SKU');
    }
    if (isPgError(error, PG_FOREIGN_KEY_VIOLATION)) {
      throw new NotFoundException('Categoría no encontrada');
    }
    throw error;
  }
}