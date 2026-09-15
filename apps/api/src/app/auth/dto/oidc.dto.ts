import { IsNotEmpty, IsString } from 'class-validator';

export class OidcCallbackQueryDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;
}

export interface OidcUserProfile {
  openId: string;
  email: string;
  fullName: string;
}

export interface OidcLoginUrlResponse {
  authorizationUrl: string;
}
