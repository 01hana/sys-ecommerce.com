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
  // 使用攔截器，定義欄位名稱與最大數量
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cover', maxCount: 1 },
        { name: 'images', maxCount: 5 },
      ],
      {
        // 設定儲存邏輯
        storage: diskStorage({
          destination: './public/uploads/products', // 檔案儲存路徑
          filename: (req, file, callback) => {
            // 重新命名，防止重複 (例如: 1712345678-hash.jpg)
            // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            callback(null, file.filename + '-' + Date.now());
          },
        }),
      },
    ),
  )
  @UseGuards(AuthGuard('jwt'))
  async create(
    @UploadedFiles() files: { cover?: Express.Multer.File[]; images?: Express.Multer.File[] },
    @Body() dto: ProductDto,
  ) {
    const coverPath = files.cover?.[0]?.path || '';
    const imagesPaths = files.images?.map(file => file.path) || [];

    return this.productsService.create({
      ...dto,
      cover: coverPath,
      images: imagesPaths,
    });
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
