import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) { }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.requestsService.create(body, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.requestsService.findAll(req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    // Onaylama yetkisi: Adminler ve Şube Müdürleri
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'BRANCH_MANAGER') {
      throw new UnauthorizedException('Bu işlemi yapma yetkiniz yok.');
    }
    return this.requestsService.update(id, body, req.user);
  }

  // YENİ: MAL KABUL İŞLEMİ
  @Post(':id/receive')
  receiveGoods(@Param('id') id: string, @Request() req) {
    // Sadece Yetkililer
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'BRANCH_MANAGER') {
      throw new UnauthorizedException('Mal kabul yetkiniz yok.');
    }
    return this.requestsService.receiveGoods(id, req.user);
  }
}