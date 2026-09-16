import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OidcCallbackQueryDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsOptional()
  @IsString()
  iss?: string;

  @IsOptional()
  @IsString()
  scope?: string;
}

export interface OidcCallbackParams {
  code: string;
  state: string;
  iss?: string;
  scope?: string;
}

export interface OidcUserProfile {
  openId: string;
  email: string;
  fullName: string;
}

export interface OidcLoginUrlResponse {
  authorizationUrl: string;
}
