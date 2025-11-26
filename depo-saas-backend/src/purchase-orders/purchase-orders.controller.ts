import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) { }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.purchaseOrdersService.create(body, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.purchaseOrdersService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  // Mal Kabul Endpoint
  @Post(':id/receive')
  receiveGoods(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.purchaseOrdersService.receiveGoods(id, body, req.user);
  }
}