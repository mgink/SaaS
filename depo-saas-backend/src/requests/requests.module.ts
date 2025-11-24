import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { PrismaModule } from '../prisma/prisma.module';
// Import the module containing NotificationsService
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule, // <--- Add this line
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule { }