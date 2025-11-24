import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9-]+$/, { message: 'Subdomain sadece küçük harf, rakam ve tire içerebilir' })
    subdomain: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6, { message: 'Şifre en az 6 karakter olmalı' })
    password: string;

    @IsString()
    @IsNotEmpty()
    planCode: string; // <--- YENİ EKLENDİ
}