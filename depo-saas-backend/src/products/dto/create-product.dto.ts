import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    sku: string; // Stok Kodu (Benzersiz olmalı)

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    minStock?: number; // Kritik stok seviyesi (Varsayılan: 10)

    // Dikkat: currentStock'u (Mevcut Stok) buradan almıyoruz. 
    // Stok sadece "Giriş İşlemi" (Transaction) ile artmalı.

    @IsString()
    @IsOptional()
    warehouseId?: string;  // Frontend'den gelen Depo ID

    @IsString()
    @IsOptional()
    departmentId?: string; // Frontend'den gelen Departman ID
}