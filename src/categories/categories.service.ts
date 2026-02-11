import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto } from './dto';
import { PaginationDto } from '../common/dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const { page, sizePage, search, filters } = dto;
    const skip = (page - 1) * sizePage;

    // 1. 建立一個有型別保護的動態查詢容器
    const where: Prisma.CategoryWhereInput = {};

    // 模糊搜尋分類名稱
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive', // 不分大小寫
      };
    }

    // 處理其他篩選條件 (例如 status)
    if (filters && filters.length > 0) {
      where.AND = filters.map(filter => ({
        [filter.field]: filter.value,
      }));
    }

    // 2. 執行事務查詢
    const [total, categories] = await this.prisma.$transaction([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        skip,
        take: sizePage,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { products: true }, // 計算產品數量
          },
        },
      }),
    ]);

    return {
      data: categories,
      total,
      page,
      sizePage,
    };
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      // 如果想在查分類時順便看到有哪些產品，可以取消下面註解
      include: { products: true },
    });

    if (!category) {
      throw new NotFoundException(`找不到 ID 為 ${id} 的分類`);
    }
    return category;
  }

  async create(dto: CategoryDto) {
    try {
      return await this.prisma.category.create({
        data: dto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('分類名稱已存在');
      }
      throw error;
    }
  }

  async update(id: number, dto: CategoryDto) {
    // 先確認是否存在
    await this.findOne(id);

    return await this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(ids: number[]) {
    return await this.prisma.$transaction(async tx => {
      // 1. 檢查這些 ID 是否都存在於資料庫中
      const existingCategories = await tx.category.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      if (existingCategories.length !== ids.length) {
        const foundIds = existingCategories.map(c => c.id);
        const missingIds = ids.filter(id => !foundIds.includes(id));

        throw new NotFoundException(`找不到以下分類 ID：${missingIds.join(', ')}`);
      }

      // 2. 執行批量刪除
      // 注意：如果 Prisma Schema 沒有設定 onDelete: Cascade，
      // 且分類下仍有產品，這裡會拋出 P2003 錯誤
      try {
        await tx.category.deleteMany({
          where: { id: { in: ids } },
        });

        return {
          message: '刪除成功',
          deletedIds: ids,
          count: ids.length,
        };
      } catch (error) {
        // 處理外鍵約束錯誤
        if (error.code === 'P2003') {
          throw new ConflictException('部分分類下仍有商品，請先移除相關商品後再進行刪除');
        }
        throw error;
      }
    });
  }
}
