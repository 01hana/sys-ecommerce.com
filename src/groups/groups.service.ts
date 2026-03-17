import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGroupDto } from './dto';
import { PaginationDto } from 'src/common/dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const { page, sizePage, searches, filters } = dto;
    const skip = (page - 1) * sizePage;

    // 1. 建立一個有型別保護的動態查詢容器
    const where: Prisma.GroupWhereInput = {};

    const keyword: string | undefined =
      searches && typeof searches.keyword === 'string' ? searches.keyword : undefined;

    // 模糊搜尋分類名稱
    if (keyword) {
      where.name = {
        contains: keyword,
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
    const [total, groups] = await this.prisma.$transaction([
      this.prisma.group.count({ where }),
      this.prisma.group.findMany({
        where,
        skip,
        take: sizePage,
        orderBy: { updated_at: 'desc' },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
    ]);

    return {
      data: groups,
      total,
      page,
    };
  }

  /**
   * 取得所有群組（不分頁）
   * 常用於前端下拉選單或全域快取
   */
  async findAllSimple() {
    return await this.prisma.group.findMany({
      orderBy: { sort: 'asc' },
      select: { id: true, name: true },
    });
  }

  async findOne(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!group) throw new NotFoundException('找不到該群組');

    return group;
  }

  async create(dto: CreateGroupDto) {
    const data: any = {
      name: dto.name,
      description: dto.description,
      sort: dto.sort ?? 0,
      status: dto.status ?? true,
    };

    if (dto.userIds && dto.userIds.length) {
      data.users = { connect: dto.userIds.map(id => ({ id })) };
    }

    // handle permissions: find or create permissions then connect
    if (dto.permissions && dto.permissions.length) {
      data.permissions = {
        connectOrCreate: dto.permissions.map(p => ({
          where: { subject_action: { subject: p.subject, action: p.action } },
          create: { subject: p.subject, action: p.action },
        })),
      };
    }

    return this.prisma.group.create({ data, include: { users: true, permissions: true } });
  }

  async update(id: number, dto: CreateGroupDto) {
    await this.findOne(id);

    const data: any = {
      name: dto.name,
      description: dto.description,
      sort: dto.sort ?? 0,
      status: dto.status ?? true,
    };

    if (dto.userIds) {
      // 先 disconnect 所有，再 connect 新的（簡單策略）
      await this.prisma.group.update({ where: { id }, data: { users: { set: [] } } });

      data.users = { connect: dto.userIds.map(id => ({ id })) };
    }

    if (dto.permissions) {
      // 先清空關聯，再 connectOrCreate 新的
      await this.prisma.group.update({ where: { id }, data: { permissions: { set: [] } } });

      data.permissions = {
        connectOrCreate: dto.permissions.map(p => ({
          where: { subject_action: { subject: p.subject, action: p.action } },
          create: { subject: p.subject, action: p.action },
        })),
      };
    }

    return this.prisma.group.update({
      where: { id },
      data,
      include: { users: true, permissions: true },
    });
  }

  async remove(ids: number[]) {
    // 批次刪除：先在事務中檢查所有 id 是否存在，並確認是否有 users
    return await this.prisma.$transaction(async tx => {
      const existing = await tx.group.findMany({
        where: { id: { in: ids } },
        select: { id: true, _count: { select: { users: true } } },
      });

      if (existing.length !== ids.length) {
        const foundIds = existing.map(group => group.id);
        const missingIds = ids.filter(id => !foundIds.includes(id));

        throw new NotFoundException(`找不到以下群組 ID：${missingIds.join(', ')}`);
      }

      // 若有群組底下仍有 users，則禁止刪除
      const groupsWithUsers = existing.filter(group => group._count && group._count.users > 0);

      if (groupsWithUsers.length > 0) {
        const blockedIds = groupsWithUsers.map(group => group.id);

        throw new ConflictException(`以下群組底下仍有使用者，無法刪除：${blockedIds.join(', ')}`);
      }

      await tx.group.deleteMany({ where: { id: { in: ids } } });

      return {
        message: '刪除成功',
        deletedIds: ids,
        count: ids.length,
      };
    });
  }
}
