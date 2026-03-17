import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CustomerDto } from './dto';
import { PaginationDto } from 'src/common/dto';
import * as argon from 'argon2';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const { page, sizePage, searches, filters } = dto;
    const skip = (page - 1) * sizePage;

    const where: any = {};

    const keyword: string | undefined =
      searches && typeof searches.keyword === 'string' ? searches.keyword : undefined;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (searches) {
      const extras = Object.entries(searches).filter(([k]) => k !== 'keyword');
      const extraConditions: any[] = [];

      for (const [field, value] of extras) {
        if (value === null || value === undefined) continue;
        if (typeof value === 'string' && value.trim() === '') continue;

        if (typeof value === 'string' && /^\d+$/.test(value)) {
          extraConditions.push({ [field]: Number(value) });
        } else if (value === 'true' || value === 'false') {
          extraConditions.push({ [field]: value === 'true' });
        } else {
          extraConditions.push({ [field]: { contains: String(value), mode: 'insensitive' } });
        }
      }

      if (extraConditions.length) {
        const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
        where.AND = [...existingAnd, ...extraConditions];
      }
    }

    if (filters && filters.length) {
      const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
      where.AND = [...existingAnd, ...filters.map(f => ({ [f.field]: f.value }))];
    }

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: sizePage,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          address: true,
          created_at: true,
          updated_at: true,
        },
      }),
    ]);

    return { data: customers, total, page };
  }

  async getFilters(): Promise<Record<string, { label: string; value: any }[]>> {
    const statusOptions = [
      { label: '啟用', value: true },
      { label: '停用', value: false },
    ];

    return {
      status: statusOptions,
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        address: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!customer) throw new NotFoundException('找不到該客戶');

    return customer;
  }

  async create(dto: CustomerDto) {
    // 檢查 email 是否存在
    const exists = await this.prisma.customer.findUnique({ where: { email: dto.email } });

    if (exists) throw new ConflictException('Email 已被使用');

    const data: any = {
      name: dto.name,
      email: dto.email,
      mobile: dto.mobile,
      address: dto.address,
    };

    if (dto.password) {
      data.hash = await argon.hash(dto.password);
    }

    return await this.prisma.customer.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        address: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async update(id: string, dto: CustomerDto) {
    await this.findOne(id);

    const data: any = {
      name: dto.name,
      email: dto.email,
      mobile: dto.mobile,
      address: dto.address,
    };

    if (dto.password) data.hash = await argon.hash(dto.password);

    return await this.prisma.customer.update({ where: { id }, data });
  }

  async remove(ids: string[]) {
    const existing = await this.prisma.customer.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      const found = existing.map(c => c.id);
      const missing = ids.filter(id => !found.includes(id));

      throw new NotFoundException(`找不到以下客戶 ID：${missing.join(', ')}`);
    }

    await this.prisma.customer.deleteMany({ where: { id: { in: ids } } });

    return { message: '刪除成功', deletedIds: ids };
  }
}
