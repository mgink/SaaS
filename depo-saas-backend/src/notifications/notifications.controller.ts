import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  // 1. Kullanıcının Kendi Bildirimlerini Listele
  @Get()
  findAll(@Request() req) {
    // Service'deki findAll metodu userId istiyor
    // Biz de token'dan gelen (req.user.userId) bilgisini veriyoruz
    // (Auth Guard'da userId olarak kaydettiysek userId, id ise id. Genelde req.user.userId veya req.user.sub olur.
    // JwtStrategy'ye bakarsan: return { userId: payload.sub ... } demiştik.
    return this.notificationsService.findAll(req.user.userId);
  }

  // 2. Bildirimi Okundu Olarak İşaretle
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}