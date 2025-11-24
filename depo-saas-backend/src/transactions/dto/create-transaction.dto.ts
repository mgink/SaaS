import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

// Prisma Enum'larını kullanmak için (schema.prisma'daki isimlerle aynı olmalı)
export enum TransactionType {
    INBOUND = 'INBOUND',   // Giriş (Mal Kabul)
    OUTBOUND = 'OUTBOUND', // Çıkış (Sevkiyat)
}

export class CreateTransactionDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string; // Hangi ürün?

    @IsEnum(TransactionType)
    @IsNotEmpty()
    type: TransactionType; // Giriş mi, Çıkış mı?

    @IsInt()
    @Min(1)
    @IsNotEmpty()
    quantity: number; // Kaç tane?

    @IsString()
    @IsOptional()
    waybillNo?: string; // İrsaliye No (Varsa)

    @IsString()
    @IsOptional()
    notes?: string; // Açıklama
}