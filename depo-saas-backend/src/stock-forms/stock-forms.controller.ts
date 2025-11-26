import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, UnauthorizedException } from '@nestjs/common';
import { StockFormsService } from './stock-forms.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('stock-forms')
export class StockFormsController {
  constructor(private readonly stockFormsService: StockFormsService) { }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.stockFormsService.create(body, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.stockFormsService.findAll(req.user.tenantId);
  }

  // YENİ: Fiş Onaylama / Düzenleme
  @Patch(':id/process')
  processForm(@Param('id') id: string, @Body() body: { action: 'APPROVE' | 'REJECT', paymentData?: any }, @Request() req) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'BRANCH_MANAGER') {
      throw new UnauthorizedException('Bu işlemi yapma yetkiniz yok.');
    }
    return this.stockFormsService.processForm(id, body.action, body.paymentData, req.user);
  }
}