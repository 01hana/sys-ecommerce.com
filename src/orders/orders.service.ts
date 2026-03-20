import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const { page, sizePage, searches, filters } = dto;
    const skip = (page - 1) * sizePage;
    const where: Prisma.OrderWhereInput = { deleted_at: null };

    const keyword: string | undefined =
      searches && typeof searches.keyword === 'string' ? searches.keyword : undefined;

    if (keyword) {
      where.OR = [{ order_number: { contains: keyword, mode: 'insensitive' } }];
    }

    if (filters && filters.length > 0) {
      where.AND = filters.map(filter => ({ [filter.field]: filter.value }));
    }

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: sizePage,
        orderBy: { updated_at: 'desc' },
      }),
    ]);

    return {
      data: orders,
      total,
      page,
      sizePage,
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id, deleted_at: null } });

    if (!order) throw new NotFoundException('找不到該訂單');

    return order;
  }

  async create(dto: CreateOrderDto) {
    // 產生訂單號碼：YYYYMMDD-流水號
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    // 當日訂單數
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const seq = await this.prisma.order.count({
      where: {
        created_at: { gte: start, lt: end },
      },
    });

    const serial = String(seq + 1).padStart(4, '0');
    const orderNumber = `${datePart}-${serial}`;

    const plainItems = dto.items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }));

    return await this.prisma.order.create({
      data: {
        ...dto,
        order_number: orderNumber,
        items: plainItems,
      },
    });
  }

  async update(id: string, dto: UpdateOrderDto) {
    await this.findOne(id);

    return await this.prisma.order.update({ where: { id }, data: dto });
  }

  async remove(ids: string[]) {
    const existingOrders = await this.prisma.order.findMany({
      where: { id: { in: ids }, deleted_at: null },
      select: { id: true },
    });

    if (existingOrders.length !== ids.length) {
      const foundIds = existingOrders.map(o => o.id);
      const missingIds = ids.filter(id => !foundIds.includes(id));

      throw new NotFoundException(`找不到以下訂單 ID：${missingIds.join(', ')}`);
    }

    await this.prisma.order.updateMany({
      where: { id: { in: ids } },
      data: { deleted_at: new Date() },
    });

    return {
      message: '刪除成功',
      deletedIds: ids,
      count: ids.length,
    };
  }
}
