import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class OnboardUserDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  password!: string;
}

export interface OnboardingRequiredResponse {
  onboardingRequired: boolean;
}

export interface OnboardUserResponse {
  message: string;
}
