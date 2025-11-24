import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('super-admin')
@UseGuards(AuthGuard('jwt'))
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) { }

  private checkRole(req: any) {
    if (req.user.role !== 'SUPER_ADMIN') throw new UnauthorizedException('Sadece Patronlar Girebilir!');
  }

  @Get('dashboard')
  getDashboard(@Request() req) { this.checkRole(req); return this.superAdminService.getDashboardStats(); }

  @Post('promote-me')
  promoteMe(@Body('email') email: string) { return this.superAdminService.promoteToSuperAdmin(email); }

  // --- PLAN ---
  @Get('plans')
  getPlans(@Request() req) { this.checkRole(req); return this.superAdminService.getAllPlans(); }

  @Post('plans')
  createPlan(@Body() body: any, @Request() req) { this.checkRole(req); return this.superAdminService.createPlan(body); }

  @Post('plans/reorder')
  reorderPlans(@Body() body: { id: string, order: number }[], @Request() req) { this.checkRole(req); return this.superAdminService.reorderPlans(body); }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() body: any, @Request() req) { this.checkRole(req); return this.superAdminService.updatePlan(id, body); }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string, @Request() req) {
    this.checkRole(req);
    try { return await this.superAdminService.deletePlan(id); } catch (error: any) { throw new BadRequestException(error.message); }
  }

  // --- TALEPLER (YENİ) ---
  @Get('requests')
  getRequests(@Request() req) { this.checkRole(req); return this.superAdminService.getEnterpriseRequests(); }

  @Patch('requests/:id')
  updateRequestStatus(@Param('id') id: string, @Body('status') status: any, @Request() req) {
    this.checkRole(req);
    return this.superAdminService.updateRequestStatus(id, status);
  }

  // --- TENANT ---
  @Patch('tenants/:id')
  updateTenant(@Param('id') id: string, @Body() body: any, @Request() req) { this.checkRole(req); return this.superAdminService.updateTenant(id, body); }

  @Delete('tenants/:id')
  deleteTenant(@Param('id') id: string, @Request() req) { this.checkRole(req); return this.superAdminService.deleteTenant(id); }
}