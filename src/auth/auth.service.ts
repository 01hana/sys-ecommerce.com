import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { SigninDto, SetProfileDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signin(dto: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        account: dto.account,
      },
    });

    if (!user) {
      throw new UnauthorizedException('帳號或密碼不正確');
    }

    const pwMatches = await argon.verify(user.hash, dto.password);

    if (!pwMatches) {
      throw new UnauthorizedException('帳號或密碼不正確');
    }

    return this.signToken(user);
  }

  async signToken(user: any): Promise<{
    admin_access_token: string;
    user: {
      id: string;
      name: string;
      account: string;
      email: string;
      permissions?: Array<{ subject: string; action: string }>;
    };
  }> {
    const payload = {
      id: user.id,
      name: user.name,
      account: user.account,
      email: user.email,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
      secret: this.config.get('JWT_SECRET'),
    });

    const { permissions } = await this.getUserPermissions(user);

    return {
      admin_access_token: token,
      user: {
        id: payload.id,
        name: payload.name,
        account: payload.account,
        email: payload.email,
        permissions,
      },
    };
  }

  async getProfile(user: any) {
    const { targetUser, permissions } = await this.getUserPermissions(user);

    return {
      id: targetUser.id,
      name: targetUser.name,
      account: targetUser.account,
      email: targetUser.email,
      permissions,
    };
  }

  async setProfile(user: any, dto: SetProfileDto) {
    // 只允許更新自己的資訊（name, email, password）並重新簽發 token
    const data: any = {};

    if (dto.name) data.name = dto.name;
    if (dto.email) data.email = dto.email;
    if (dto.password) data.hash = await argon.hash(dto.password);

    try {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data,
      });

      return this.signToken(updated);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email 或帳號已被使用');
      }

      throw error;
    }
  }

  async getUserPermissions(user: any) {
    // 查詢使用者所屬 groups 與 groups 的 permissions
    const targetUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        account: true,
        email: true,
        groups: {
          select: {
            permissions: {
              select: { subject: true, action: true },
            },
          },
        },
      },
    });

    if (!targetUser) throw new NotFoundException('找不到該使用者');

    // 彙整並去重 permissions
    const seen = new Set<string>();
    const permissions: Array<{ subject: string; action: string }> = [];

    for (const group of targetUser.groups ?? []) {
      for (const permission of group.permissions ?? []) {
        const key = `${permission.subject}::${permission.action}`;

        if (!seen.has(key)) {
          seen.add(key);
          permissions.push({ subject: permission.subject, action: permission.action });
        }
      }
    }

    return { targetUser, permissions };
  }
}
