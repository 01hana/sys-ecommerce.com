import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Prisma } from '../generated/prisma/client';
import { promises as fs } from 'fs';
import * as pathLib from 'path';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto, categoryId?: number) {
    const { page, sizePage, search, filters } = dto;
    const skip = (page - 1) * sizePage;

    // 1. 建立一個有型別保護的動態查詢容器
    const where: Prisma.ProductWhereInput = {};

    // 加入 categoryId 篩選
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 模糊搜尋：針對 name 或 description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 處理 filters 陣列 (範例：將其轉換為 Prisma 的 AND 條件)
    if (filters && filters.length > 0) {
      where.AND = filters.map(filter => ({
        [filter.field]: filter.value,
      }));
    }

    // 2. 使用 $transaction 同時獲取資料與「過濾後」的總數
    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }), // 這裡一定要帶 where，total 才會正確
      this.prisma.product.findMany({
        where,
        skip,
        take: sizePage,
        orderBy: { updated_at: 'desc' },
        omit: { categoryId: true },
      }),
    ]);

    return {
      data: products,
      total,
      page,
      sizePage,
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) throw new NotFoundException('找不到該商品');

    return product;
  }

  async create(
    dto: ProductDto,
    files?: { cover?: Express.Multer.File; images?: Express.Multer.File[] },
  ) {
    const coverFile = files?.cover?.[0];
    const imageFiles = files?.images ?? [];

    // Use provided dto paths as defaults
    let coverPath = dto.cover ?? '';
    let imagesPaths = dto.images ?? [];

    if (coverFile) {
      const created = await this.prisma.file.create({
        data: {
          filename: coverFile.filename,
          path: coverFile.path,
          mimetype: coverFile.mimetype,
        },
      });
      coverPath = created.path;
    }

    if (imageFiles.length > 0) {
      const createdImages = await Promise.all(
        imageFiles.map(file =>
          this.prisma.file.create({
            data: {
              filename: file.filename,
              path: file.path,
              mimetype: file.mimetype,
            },
          }),
        ),
      );
      imagesPaths = createdImages.map(c => c.path);
    }

    return this.prisma.product.create({
      data: {
        ...dto,
        cover: coverPath,
        images: imagesPaths,
      },
    });
  }

  async update(id: number, dto: ProductDto) {
    await this.findOne(id);

    return await this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(ids: number[]) {
    // 先取得要刪除的產品與其對應的檔案路徑
    const existingProducts = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, cover: true, images: true },
    });

    if (existingProducts.length !== ids.length) {
      const foundIds = existingProducts.map(p => p.id);
      const missingIds = ids.filter(id => !foundIds.includes(id));

      throw new NotFoundException(`找不到以下商品 ID：${missingIds.join(', ')}`);
    }

    // 收集所有要刪除的檔案路徑（cover + images），並去重
    const filePaths: string[] = [];
    for (const p of existingProducts) {
      if (p.cover) filePaths.push(p.cover);
      if (p.images && p.images.length) filePaths.push(...p.images);
    }
    const uniquePaths = Array.from(new Set(filePaths));

    // 在資料庫內刪除 product 與相對應的 file 紀錄
    await this.prisma.$transaction(async tx => {
      await tx.product.deleteMany({ where: { id: { in: ids } } });

      if (uniquePaths.length) {
        await tx.file.deleteMany({ where: { path: { in: uniquePaths } } });
      }
    });

    // 刪除檔案系統中的實體檔案
    const fileDeletes: Array<{ path: string; deleted: boolean; error?: string }> = [];
    for (const p of uniquePaths) {
      try {
        const abs = pathLib.isAbsolute(p) ? p : pathLib.resolve(process.cwd(), p);

        await fs.unlink(abs);

        fileDeletes.push({ path: p, deleted: true });
      } catch (err: any) {
        // 若檔案不存在或其他問題，記錄錯誤但不拋出
        fileDeletes.push({ path: p, deleted: false, error: err.message });
      }
    }

    return {
      message: '刪除成功',
      deletedIds: ids,
      count: ids.length,
    };
  }
}
