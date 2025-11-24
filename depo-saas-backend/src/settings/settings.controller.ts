import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(AuthGuard('jwt'))
@Controller('settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) { }

  // --- DEPOLAR ---
  @Get('warehouses')
  async getWarehouses(@Request() req) {
    let whereClause: any = { tenantId: req.user.tenantId };

    // Personel veya Şube Müdürü ise sadece kendi şubesini görür
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: req.user.userId } });
      if (user && user.branchId) whereClause.branchId = user.branchId;
    }
    return this.prisma.warehouse.findMany({
      where: whereClause,
      include: { branch: true, departments: true, _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Post('warehouses')
  async createWarehouse(@Body() data: { name: string, location?: string, branchId?: string, departments?: string[] }, @Request() req) {
    // 1. Yetki
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') throw new UnauthorizedException('Yetkiniz yok.');

    // 2. SAAS LİMİT KONTROLÜ
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      include: { plan: true, _count: { select: { warehouses: true } } }
    });

    if (!tenant || !tenant.plan) throw new BadRequestException("Plan bulunamadı.");

    if (tenant.plan.maxWarehouses > 0 && tenant._count.warehouses >= tenant.plan.maxWarehouses) {
      throw new BadRequestException(`Depo limitiniz (${tenant.plan.maxWarehouses}) doldu.`);
    }

    return this.prisma.warehouse.create({
      data: {
        name: data.name,
        location: data.location,
        branchId: data.branchId || null,
        tenantId: req.user.tenantId,
        departments: {
          create: data.departments?.map(deptName => ({ name: deptName, tenantId: req.user.tenantId })) || []
        }
      },
      include: { departments: true }
    });
  }

  @Patch('warehouses/:id')
  updateWarehouse(@Param('id') id: string, @Body() data: any, @Request() req) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') throw new UnauthorizedException('Yetkiniz yok.');
    return this.prisma.warehouse.update({ where: { id }, data: { name: data.name, location: data.location, branchId: data.branchId || null } });
  }

  @Delete('warehouses/:id')
  async deleteWarehouse(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') throw new UnauthorizedException('Yetkiniz yok.');
    const count = await this.prisma.product.count({ where: { warehouseId: id } });
    if (count > 0) throw new UnauthorizedException('Bu depo dolu! Silmeden önce ürünleri taşıyın.');

    await this.prisma.department.deleteMany({ where: { warehouseId: id } });
    return this.prisma.warehouse.delete({ where: { id } });
  }

  @Post('warehouses/transfer')
  async transferProducts(@Body() body: { fromId: string, toId: string }, @Request() req) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') throw new UnauthorizedException('Yetkiniz yok.');
    return this.prisma.product.updateMany({ where: { warehouseId: body.fromId, tenantId: req.user.tenantId }, data: { warehouseId: body.toId } });
  }

  // --- DEPARTMANLAR ---
  @Get('departments')
  getDepartments(@Request() req) {
    return this.prisma.department.findMany({ where: { tenantId: req.user.tenantId }, include: { warehouse: true }, orderBy: { name: 'asc' } });
  }
  @Post('departments')
  createDepartment(@Body() data: { name: string, warehouseId?: string }, @Request() req) {
    return this.prisma.department.create({ data: { name: data.name, tenantId: req.user.tenantId, warehouseId: data.warehouseId || null } });
  }
}