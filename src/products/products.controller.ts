import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductDto } from './dto';
import { PaginationDto, DeleteIntDto } from '../common/dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @HttpCode(HttpStatus.OK)
  @Post('getTable')
  @UseGuards(AuthGuard('jwt'))
  getTable(@Body() dto: PaginationDto) {
    return this.productsService.findAll(dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: ProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: ProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  remove(@Body() dto: DeleteIntDto) {
    return this.productsService.remove(dto.ids);
  }
}
