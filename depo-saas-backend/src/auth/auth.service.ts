import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async getPublicPlans() {
        return this.prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });
    }

    async createEnterpriseRequest(data: any) {
        return this.prisma.enterpriseRequest.create({
            data: {
                companyName: data.companyName,
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                message: data.message
            }
        });
    }

    // --- REGISTER (MERKEZ ŞUBE VE YÖNETİCİ ATAMA) ---
    async register(dto: RegisterDto) {
        const existingTenant = await this.prisma.tenant.findUnique({ where: { subdomain: dto.subdomain } });
        if (existingTenant) throw new BadRequestException('Bu firma kodu zaten alınmış.');

        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingUser) throw new BadRequestException('Bu email zaten kayıtlı.');

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Şirketi Oluştur
            const newTenant = await tx.tenant.create({
                data: {
                    name: dto.companyName,
                    subdomain: dto.subdomain,
                    plan: { connect: { code: dto.planCode } },
                },
            });

            // 2. OTOMATİK: Merkez Şube Oluştur
            const mainBranch = await tx.branch.create({
                data: {
                    name: 'Merkez Şube',
                    location: 'Genel Merkez',
                    tenantId: newTenant.id
                }
            });

            // 3. OTOMATİK: Ana Depo Oluştur ve Şubeye Bağla
            await tx.warehouse.create({
                data: {
                    name: 'Ana Depo',
                    location: 'Merkez',
                    tenantId: newTenant.id,
                    branchId: mainBranch.id,
                    departments: { create: { name: 'Genel Stok', tenantId: newTenant.id } }
                }
            });

            // 4. Admin Kullanıcısını Oluştur ve MERKEZ ŞUBEYE Ata
            const newUser = await tx.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    role: 'ADMIN', // Ana Yönetici
                    tenantId: newTenant.id,
                    fullName: 'Firma Yetkilisi',
                    branchId: mainBranch.id, // <--- YÖNETİCİYİ MERKEZE ATADIK
                    canCreateProduct: true,
                    isPasswordChanged: true // Kendi belirlediği için true
                },
            });

            return { tenant: newTenant, user: newUser };
        });

        return { message: 'Kayıt başarılı', ...result };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { tenant: { include: { plan: true } }, branch: true },
        });

        if (!user) throw new UnauthorizedException('Email veya şifre hatalı');
        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) throw new UnauthorizedException('Email veya şifre hatalı');
        if (!user.tenant.isActive) throw new UnauthorizedException('Hesabınız dondurulmuştur.');

        const payload = {
            sub: user.id,
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            subdomain: user.tenant.subdomain,
            branchId: user.branchId
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                company: user.tenant.name,
                plan: user.tenant.plan?.code,
                branchName: user.branch?.name || 'Atanmamış',
                isPasswordChanged: user.isPasswordChanged
            }
        };
    }

    async changePassword(userId: string, newPassword: string) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        return this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword, isPasswordChanged: true }
        });
    }
}