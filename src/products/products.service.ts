import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductDto, SearchProductDto } from './dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: SearchProductDto) {
    const { page, sizePage, search, filters } = dto;
    const skip = (page - 1) * sizePage;

    // 1. 組建動態 where 條件
    const where: Prisma.ProductWhereInput = {};

    // 模糊搜尋：針對 name 或 description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 處理 filters 陣列 (範例：將其轉換為 Prisma 的 AND 條件)
    if (filters && filters.length > 0) {
      where.AND = filters.map(f => ({
        [f.field]: f.value,
      }));
    }

    // 2. 使用 $transaction 同時獲取資料與「過濾後」的總數
    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }), // 這裡一定要帶 where，total 才會正確
      this.prisma.product.findMany({
        where,
        skip,
        take: sizePage,
        orderBy: { createdAt: 'desc' },
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

  async create(dto: ProductDto) {
    return this.prisma.product.create({
      data: dto,
    });
  }

  async update(id: number, dto: any) {
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(ids: number[]) {
    // 確保查詢與刪除在同一個事務中執行
    return await this.prisma.$transaction(async tx => {
      // 先從資料庫找出這些 ID
      const existingProducts = await tx.product.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      // 如果找不到任何資料，或是數量不對
      if (existingProducts.length !== ids.length) {
        // 找出哪些 ID 是不存在的（選用，增加錯誤訊息細節）
        const foundIds = existingProducts.map(p => p.id);
        const missingIds = ids.filter(id => !foundIds.includes(id));

        throw new NotFoundException(`找不到以下商品 ID：${missingIds.join(', ')}`);
      }

      await tx.product.deleteMany({
        where: { id: { in: ids } },
      });

      return {
        message: '刪除成功',
        deletedIds: ids,
        count: ids.length,
      };
    });
  }
}
