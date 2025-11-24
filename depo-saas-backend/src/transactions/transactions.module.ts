import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { NotificationsModule } from '../notifications/notifications.module'; // <--- 1. IMPORT ET

@Module({
  imports: [NotificationsModule], // <--- 2. BURAYA EKLE
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule { }