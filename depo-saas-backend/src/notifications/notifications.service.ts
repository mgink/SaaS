import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) { }

  // Tekil Bildirim
  async create(userId: string, message: string, type: string = 'INFO') {
    return this.prisma.notification.create({
      data: { userId, message, type }
    });
  }

  // Sadece Adminlere Bildirim (Eski yöntem, hala geçerli olabilir)
  async notifyAdmins(tenantId: string, message: string) {
    const admins = await this.prisma.user.findMany({
      where: { tenantId, role: 'ADMIN' }
    });
    const notifications = admins.map(admin =>
      this.create(admin.id, message, 'WARNING')
    );
    await Promise.all(notifications);
  }

  // YENİ: Şube Bazlı Yönetici Bildirimi (Akıllı Yönlendirme)
  async notifyManagers(tenantId: string, branchId: string | null, message: string) {
    // Bildirimi alacak kişiler:
    // 1. Rolü ADMIN olanlar (Patron her şeyi görür)
    // 2. Rolü BRANCH_MANAGER olan VE o şubede olanlar

    const recipients = await this.prisma.user.findMany({
      where: {
        tenantId,
        OR: [
          { role: 'ADMIN' },
          {
            role: 'BRANCH_MANAGER',
            branchId: branchId // Sadece ilgili şube müdürü
          }
        ]
      }
    });

    // Hepsine bildirim oluştur
    const notifications = recipients.map(user =>
      this.create(user.id, message, 'WARNING')
    );

    await Promise.all(notifications);
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }
}