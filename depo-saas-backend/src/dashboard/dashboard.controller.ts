import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get()
  getDashboardStats(
    @Request() req,
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const userBranch = (req.user.role === 'BRANCH_MANAGER' || req.user.role === 'STAFF') ? req.user.branchId : branchId;
    return this.dashboardService.getStats(req.user.tenantId, userBranch, startDate, endDate);
  }

  // YENİ: Düzeni Getir
  @Get('layout')
  getLayout(@Request() req) {
    return this.dashboardService.getUserLayout(req.user.userId);
  }

  // YENİ: Düzeni Kaydet
  @Post('layout')
  saveLayout(@Request() req, @Body() body: any) {
    return this.dashboardService.updateUserLayout(req.user.userId, body.layout);
  }
}