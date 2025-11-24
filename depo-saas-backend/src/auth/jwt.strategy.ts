import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Token'ı "Authorization: Bearer <token>" başlığından al
            ignoreExpiration: false, // Süresi dolmuşsa reddet
            secretOrKey: process.env.JWT_SECRET || 'cok-gizli-anahtar', // .env'deki aynı şifreyi kullanmalısın
        });
    }

    // Token geçerliyse bu fonksiyon çalışır
    async validate(payload: any) {
        // Buradan dönen obje, tüm requestlerde "req.user" olarak erişilebilir olacak
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            tenantId: payload.tenantId,
            subdomain: payload.subdomain
        };
    }
}