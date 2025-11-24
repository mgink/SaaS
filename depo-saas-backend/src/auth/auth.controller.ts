import { Controller, Post, Body, Get, UseGuards, Request, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('plans')
    getPlans() { return this.authService.getPublicPlans(); }

    @Post('enterprise-request')
    createEnterpriseRequest(@Body() body: any) { return this.authService.createEnterpriseRequest(body); }

    @Post('register')
    register(@Body() registerDto: RegisterDto) { return this.authService.register(registerDto); }

    @Post('login')
    login(@Body() loginDto: LoginDto) { return this.authService.login(loginDto); }

    // YENİ: Şifre Değiştirme Endpoint'i
    @UseGuards(AuthGuard('jwt'))
    @Patch('change-password')
    changePassword(@Request() req, @Body('password') password: string) {
        return this.authService.changePassword(req.user.userId, password);
    }
}