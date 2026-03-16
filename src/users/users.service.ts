import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { PaginationDto, DeleteIntDto } from 'src/common/dto';
import * as argon from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const { page, sizePage, search, filters } = dto;
    const skip = (page - 1) * sizePage;

    const where: any = { deleted_at: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (filters && filters.length) {
      where.AND = filters.map(f => ({ [f.field]: f.value }));
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: sizePage,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          name: true,
          account: true,
          email: true,
          status: true,
          created_at: true,
          updated_at: true,
          groups: { select: { name: true } },
        },
      }),
    ]);

    // 將 groups 轉為 string[]（只回傳 group.name）
    const data = users.map(user => ({
      id: user.id,
      name: user.name,
      account: user.account,
      email: user.email,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      groups: user.groups?.map(group => group.name) ?? [],
    }));

    return { data, total, page };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deleted_at: null },
      select: {
        id: true,
        name: true,
        account: true,
        email: true,
        status: true,
        created_at: true,
        updated_at: true,
        groups: { select: { id: true } },
      },
    });

    if (!user) throw new NotFoundException('找不到該使用者');

    return user;
  }

  async create(dto: CreateUserDto) {
    // 允許在已軟刪除的帳號/Email 上重複建立：若存在 active 使用者則拒絕
    const conflicts = await this.prisma.user.findMany({
      where: {
        OR: [{ account: dto.account }, { email: dto.email }],
      },
      select: { id: true, deleted_at: true },
    });

    const active = conflicts.filter(conflict => !conflict.deleted_at);
    if (active.length > 0) {
      throw new ConflictException('帳號 或 Email 已存在');
    }

    const softDeletedIds = conflicts
      .filter(conflict => conflict.deleted_at)
      .map(conflict => conflict.id);

    const hash = await argon.hash(dto.password);

    const data: any = {
      name: dto.name,
      account: dto.account,
      email: dto.email,
      hash,
      status: dto.status ?? true,
    };

    if (dto.groups && dto.groups.length) {
      data.groups = { connect: dto.groups.map(id => ({ id })) };
    }

    const createSelect = {
      id: true,
      name: true,
      account: true,
      email: true,
      status: true,
      created_at: true,
      updated_at: true,
      groups: { select: { name: true } },
    } as const;

    if (softDeletedIds.length > 0) {
      // 在 transaction 中先移除軟刪除紀錄，再建立新使用者
      return await this.prisma.$transaction(async tx => {
        await tx.user.deleteMany({ where: { id: { in: softDeletedIds } } });

        const user = await tx.user.create({ data, select: createSelect });

        return user;
      });
    }

    return await this.prisma.user.create({ data, select: createSelect });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = {
      name: dto.name,
      account: dto.account,
      email: dto.email,
      status: dto.status ?? true,
    };

    if (dto.groups) {
      await this.prisma.user.update({ where: { id }, data: { groups: { set: [] } } });

      data.groups = { connect: dto.groups.map(id => ({ id })) };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        account: true,
        email: true,
        status: true,
        created_at: true,
        updated_at: true,
        groups: { select: { name: true } },
      },
    });

    return user;
  }

  async remove(ids: string[]) {
    // 批次刪除：先檢查所有 id 是否存在
    return await this.prisma.$transaction(async tx => {
      const existing = await tx.user.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      if (existing.length !== ids.length) {
        const foundIds = existing.map(user => user.id);
        const missingIds = ids.filter(id => !foundIds.includes(id));

        throw new NotFoundException(`找不到以下使用者 ID：${missingIds.join(', ')}`);
      }

      await tx.user.updateMany({
        where: { id: { in: ids } },
        data: { deleted_at: new Date() },
      });

      return {
        message: '刪除成功',
        deletedIds: ids,
      };
    });
  }
}
