import { Injectable, NotFoundException } from '@nestjs/common';
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
    // 將 password 加密存到 hash
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

    const user = await this.prisma.user.create({
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

    // return {
    //   ...created,
    //   groups: created.groups?.map(g => g.name) ?? [],
    // };

    return user;
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

    // return { ...updated, groups: updated.groups?.map(g => g.name) ?? [] };

    return user;
  }

  async remove(dto: DeleteIntDto) {
    // 將 ids 轉成 string[] 因 user.id 為 string
    const ids = dto.ids.map(String);

    // 檢查是否所有 id 存在
    const existing = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      const foundIds = existing.map(u => u.id);
      const missing = ids.filter(i => !foundIds.includes(i));
      throw new NotFoundException(`找不到以下使用者 ID：${missing.join(', ')}`);
    }

    await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { deleted_at: new Date() },
    });

    return { message: '刪除成功', deletedIds: ids };
  }
}
