import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';

@Controller('auth')
export class OAuthController {
  constructor(private auth: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    const tokens = await this.auth.generateTokens(req.user.id, req.user.email);
    res.redirect(`http://localhost:3000/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: any, @Res() res: any) {
    const tokens = await this.auth.generateTokens(req.user.id, req.user.email);
    res.redirect(`http://localhost:3000/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }
}
