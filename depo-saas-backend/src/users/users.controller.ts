import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  private isAuthorized(role: string) {
    return ['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'].includes(role);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    if (!this.isAuthorized(req.user.role)) throw new UnauthorizedException('Personel ekleme yetkiniz yok.');
    return this.usersService.create(body, req.user);
  }

  @Get()
  findAll(@Request() req) {
    if (!this.isAuthorized(req.user.role)) throw new UnauthorizedException('Listeleme yetkiniz yok.');
    return this.usersService.findAll(req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    if (!this.isAuthorized(req.user.role)) throw new UnauthorizedException('Düzenleme yetkiniz yok.');
    return this.usersService.update(id, body, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    if (!this.isAuthorized(req.user.role)) throw new UnauthorizedException('Silme yetkiniz yok.');
    return this.usersService.remove(id, req.user);
  }
}