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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductDto } from './dto';
import { PaginationDto, DeleteIntDto } from '../common/dto';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { FileUrlInterceptor } from 'src/common/interceptors/file-url.interceptor';

@UseInterceptors(FileUrlInterceptor)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @HttpCode(HttpStatus.OK)
  @Post(':categoryId/getTable')
  @UseGuards(AuthGuard('jwt'))
  getTable(
    @Body() dto: PaginationDto,
    @Param('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number,
  ) {
    return this.productsService.findAll(dto, categoryId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post(':categoryId')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cover', maxCount: 1 },
        { name: 'images', maxCount: 5 },
      ],
      {
        // 設定儲存邏輯
        storage: diskStorage({
          destination: './public/uploads/products',
          filename: (req, file, callback) => {
            // 重新命名，防止重複 (例如: 1712345678-hash.jpg)
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            callback(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  async create(
    @UploadedFiles() files: { cover?: Express.Multer.File; images?: Express.Multer.File[] },
    @Body() dto: ProductDto,
  ) {
    return this.productsService.create(dto, files);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: ProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':categoryId')
  @UseGuards(AuthGuard('jwt'))
  remove(@Body() dto: DeleteIntDto) {
    return this.productsService.remove(dto.ids);
  }
}
