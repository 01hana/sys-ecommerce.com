import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryDto } from './dto';
import { PaginationDto, DeleteIntDto } from '../common/dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @HttpCode(HttpStatus.OK)
  @Post('getTable')
  @UseGuards(AuthGuard('jwt'))
  getTable(@Body() dto: PaginationDto) {
    return this.categoriesService.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Body() dto: DeleteIntDto) {
    return this.categoriesService.remove(dto.ids);
  }
}
