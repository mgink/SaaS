import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module'; // Sadece Module'ü import ediyoruz
import { ProductsModule } from './products/products.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { RequestsModule } from './requests/requests.module';
import { BranchesModule } from './branches/branches.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { StockFormsModule } from './stock-forms/stock-forms.module';

@Module({
  imports: [
    PrismaModule, // PrismaModule buraya eklenmeli
    AuthModule, ProductsModule, TransactionsModule, DashboardModule, SettingsModule, UsersModule, NotificationsModule, SuperAdminModule, RequestsModule, BranchesModule, SuppliersModule, PurchaseOrdersModule, StockFormsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }