import { Controller, Get, Post, Body, UseGuards, Request, Query, Patch, Param, UnauthorizedException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.transactionsService.create(body, req.user.tenantId, req.user.userId);
  }

  @Get()
  findAll(@Request() req, @Query() query: any) {
    // req.user'ı gönderiyoruz ki yetki kontrolü yapabilsin
    return this.transactionsService.findAll(req.user.tenantId, query, req.user);
  }

  @Get('finance')
  getFinance(@Request() req) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') throw new UnauthorizedException();
    return this.transactionsService.getFinancialStats(req.user.tenantId);
  }

  @Patch(':id/pay')
  markAsPaid(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') throw new UnauthorizedException();
    return this.transactionsService.markAsPaid(id, req.user.tenantId);
  }
}