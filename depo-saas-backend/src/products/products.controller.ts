import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request, UnauthorizedException,
  UseInterceptors, UploadedFile, Header, Res
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  private isAdminOrSuper(role: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  create(@Body() createProductDto: any, @UploadedFile() file: Express.Multer.File, @Request() req) {
    const allowedRoles = ['STAFF', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new UnauthorizedException('Ürün ekleme yetkiniz yok.');
    }
    return this.productsService.create(createProductDto, req.user, file);
  }

  // YENİ: Ürün Güncelleme (Dosya destekli)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  update(@Param('id') id: string, @Body() updateData: any, @UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!this.isAdminOrSuper(req.user.role)) {
      throw new UnauthorizedException('Düzenleme yetkiniz yok.');
    }
    return this.productsService.update(id, updateData, req.user, file);
  }

  @Get()
  findAll(@Request() req) {
    return this.productsService.findAll(req.user.tenantId);
  }

  @Get('export')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="stok_listesi.xlsx"')
  async exportExcel(@Request() req, @Res({ passthrough: true }) res: Response) {
    return this.productsService.exportToExcel(req.user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    if (!this.isAdminOrSuper(req.user.role)) {
      throw new UnauthorizedException('Sadece yöneticiler ürün silebilir.');
    }
    return this.productsService.remove(id, req.user.tenantId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED', reason?: string },
    @Request() req
  ) {
    if (!this.isAdminOrSuper(req.user.role)) {
      throw new UnauthorizedException('Onaylama yetkiniz yok.');
    }
    return this.productsService.updateStatus(id, body.status, body.reason || null, req.user.tenantId);
  }
}