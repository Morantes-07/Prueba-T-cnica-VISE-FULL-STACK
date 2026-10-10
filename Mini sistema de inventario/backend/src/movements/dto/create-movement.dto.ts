import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MovementType } from '../movement-type.enum';

export class CreateMovementDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsEnum(MovementType)
  type: MovementType;

  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity: number;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString()
  @MaxLength(500)
  note?: string;
}