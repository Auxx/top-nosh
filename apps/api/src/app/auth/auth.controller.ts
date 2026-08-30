import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, ChangePasswordResponse } from './dto/change-password.dto';
import { LoginDto, LoginResponse } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
