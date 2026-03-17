import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { DeleteIntDto, PaginationDto } from 'src/common/dto';
import { CountInterceptor } from 'src/common/interceptors/count.interceptor';

@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @UseInterceptors(CountInterceptor)
  @HttpCode(HttpStatus.OK)
  @Post('getTable')
  @UseGuards(AuthGuard('jwt'))
  getTable(@Body() dto: PaginationDto) {
    return this.groupsService.findAll(dto);
  }

  @Get('getOptions')
  @UseGuards(AuthGuard('jwt'))
  getOptions() {
    return this.groupsService.findAllSimple();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  get(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Body() dto: DeleteIntDto) {
    return this.groupsService.remove(dto.ids);
  }
}
