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
    const { page, sizePage, searches, filters } = dto;
    const skip = (page - 1) * sizePage;

    // 1. 建立一個有型別保護的動態查詢容器
    const where: Prisma.ProductWhereInput = {};

    const keyword: string | undefined =
      searches && typeof searches.keyword === 'string' ? searches.keyword : undefined;

    // 加入 categoryId 篩選
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 模糊搜尋：針對 name 或 description
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
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

    return await this.prisma.$transaction(async tx => {
      // 建立 file 紀錄
      let coverPath = dto.cover ?? '';
      let imagesPaths = dto.images ?? [];

      if (coverFile) {
        const created = await tx.file.create({
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
          imageFiles.map(f =>
            tx.file.create({ data: { filename: f.filename, path: f.path, mimetype: f.mimetype } }),
          ),
        );
        imagesPaths = createdImages.map(c => c.path);
      }

      // 產生流水號：YYYYMMDD{categoryId}{0001}
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const seq = await tx.product.count({
        where: {
          categoryId: dto.categoryId,
          created_at: { gte: start, lt: end },
        },
      });

      const serial = String(seq + 1).padStart(4, '0');
      const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate(),
      ).padStart(2, '0')}`;
      const generatedNumber = `${datePart}${dto.categoryId}${serial}`;

      // 建立 product（含自動產生的 number）
      const product = await tx.product.create({
        data: {
          ...dto,
          number: generatedNumber,
          cover: coverPath,
          images: imagesPaths,
        },
      });

      return product;
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
    for (const path of uniquePaths) {
      try {
        const abs = pathLib.isAbsolute(path) ? path : pathLib.resolve(process.cwd(), path);

        await fs.unlink(abs);

        fileDeletes.push({ path, deleted: true });
      } catch (err: any) {
        // 若檔案不存在或其他問題，記錄錯誤但不拋出
        fileDeletes.push({ path, deleted: false, error: err.message });
      }
    }

    return {
      message: '刪除成功',
      deletedIds: ids,
      count: ids.length,
    };
  }
}
