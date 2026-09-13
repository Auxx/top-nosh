import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}
