import { Module } from '@nestjs/common';
import { StockFormsService } from './stock-forms.service';
import { StockFormsController } from './stock-forms.controller';
import { NotificationsModule } from '../notifications/notifications.module'; // <--- EKLENDİ

@Module({
  imports: [NotificationsModule], // <--- EKLENDİ
  controllers: [StockFormsController],
  providers: [StockFormsService],
})
export class StockFormsModule { }