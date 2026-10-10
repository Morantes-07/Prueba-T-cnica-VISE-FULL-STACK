import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { MovementsService } from './movements.service';

@Controller()
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post('movements')
  create(@Body() dto: CreateMovementDto) {
    return this.movementsService.create(dto);
  }

  @Get('products/:productId/kardex')
  getKardex(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.movementsService.getKardex(productId, query);
  }
}