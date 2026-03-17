import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { DeleteStringDto, PaginationDto } from 'src/common/dto';

@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @HttpCode(HttpStatus.OK)
  @Post('getTable')
  @UseGuards(AuthGuard('jwt'))
  getTable(@Body() dto: PaginationDto) {
    return this.customersService.findAll(dto);
  }

  @Get('getFilters')
  @UseGuards(AuthGuard('jwt'))
  getFilters() {
    return this.customersService.getFilters();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  get(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, @Body() dto: CustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  remove(@Body() dto: DeleteStringDto) {
    return this.customersService.remove(dto.ids);
  }
}
