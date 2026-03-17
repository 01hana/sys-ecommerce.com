import {
  Controller,
  Get,
  Req,
  UseGuards,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateBatchUserDto } from './dto';
import { PaginationDto, DeleteStringDto } from 'src/common/dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @HttpCode(HttpStatus.OK)
  @Post('getTable')
  @UseGuards(AuthGuard('jwt'))
  getTable(@Body() dto: PaginationDto) {
    return this.usersService.findAll(dto);
  }

  @Get('getFilters')
  @UseGuards(AuthGuard('jwt'))
  getFilters() {
    return this.usersService.getFilters();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  get(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch('batch')
  @UseGuards(AuthGuard('jwt'))
  updateBatch(@Body() dto: UpdateBatchUserDto) {
    return this.usersService.updateBatch(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  remove(@Body() dto: DeleteStringDto) {
    return this.usersService.remove(dto.ids);
  }
}
