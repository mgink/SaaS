import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) { }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.suppliersService.create(body, req.user.tenantId);
  }

  @Get()
  findAll(@Request() req) {
    return this.suppliersService.findAll(req.user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.suppliersService.update(id, body, req.user.tenantId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    try {
      return await this.suppliersService.remove(id, req.user.tenantId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
} 