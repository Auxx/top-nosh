import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export interface LoginResponse {
  token: string;
  forcePasswordChange: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
