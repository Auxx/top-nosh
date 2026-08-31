import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, ChangePasswordResponse } from './dto/change-password.dto';
import { LoginDto, LoginResponse } from './dto/login.dto';
import { OnboardingRequiredResponse, OnboardUserDto, OnboardUserResponse } from './dto/onboarding.dto';
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
