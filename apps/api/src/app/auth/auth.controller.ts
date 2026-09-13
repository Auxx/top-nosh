import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, ChangePasswordResponse } from './dto/change-password.dto';
import { LoginDto, LoginResponse } from './dto/login.dto';
import { LogoutDto, LogoutResponse } from './dto/logout.dto';
import { OnboardingRequiredResponse, OnboardUserDto, OnboardUserResponse } from './dto/onboarding.dto';
import { RefreshTokenDto, RefreshTokenResponse } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('onboarding-required')
  async onboardingRequired(): Promise<OnboardingRequiredResponse> {
    return this.authService.onboardingRequired();
  }

  @Post('onboard-user')
  async onboardUser(@Body() onboardUserDto: OnboardUserDto): Promise<OnboardUserResponse> {
    return this.authService.onboardUser(onboardUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: { user: { userId: string; token: string; }; },
    @Body() logoutDto?: LogoutDto
  ): Promise<LogoutResponse> {
    return this.authService.logout(req.user.userId, req.user.token, logoutDto?.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: { user: { userId: string; email: string; }; },
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<ChangePasswordResponse> {
    return this.authService.changePassword(req.user.userId, changePasswordDto.password);
  }
}
