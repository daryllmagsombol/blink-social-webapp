import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { EmailDto } from './dto/email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refreshToken(dto.refreshToken);
  }

  @Post('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @Post('resend-verification')
  resendVerification(@Body() dto: EmailDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: EmailDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @SkipThrottle({ short: true })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return user;
  }
}
