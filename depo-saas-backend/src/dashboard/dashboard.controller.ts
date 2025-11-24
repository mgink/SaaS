import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
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
    // EĞER KULLANICI PERSONEL VEYA ŞUBE MÜDÜRÜ İSE:
    // Zorunlu olarak sadece kendi şubesinin verisini görür.
    if (req.user.role === 'BRANCH_MANAGER' || req.user.role === 'STAFF') {
      return this.dashboardService.getStats(
        req.user.tenantId,
        req.user.branchId, // Zorunlu kendi şubesi
        startDate,
        endDate
      );
    }

    // EĞER ADMİN VEYA SÜPER ADMİN İSE:
    // Gönderdiği branchId filtresine göre (Tümü veya Seçili) veri görür.
    return this.dashboardService.getStats(
      req.user.tenantId,
      branchId,
      startDate,
      endDate
    );
  }
}