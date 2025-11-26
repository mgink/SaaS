import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'BRANCH_MANAGER') {
      throw new UnauthorizedException('Bu işlemi yapma yetkiniz yok.');
    }
    return this.requestsService.update(id, body, req.user);
  }

  // --- YENİ: TOPLU GÜNCELLEME ---
  @Post('bulk-status')
  bulkUpdateStatus(@Body() body: { ids: string[], status: string }, @Request() req) {
    const { ids, status } = body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) throw new BadRequestException('Geçersiz liste.');

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'BRANCH_MANAGER') {
      throw new UnauthorizedException('Yetkiniz yok.');
    }

    return this.requestsService.bulkUpdateStatus(ids, status as any, req.user);
  }

  @Post(':id/receive')
  receiveGoods(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'BRANCH_MANAGER') {
      throw new UnauthorizedException('Mal kabul yetkiniz yok.');
    }
    return this.requestsService.receiveGoods(id, req.user);
  }
}