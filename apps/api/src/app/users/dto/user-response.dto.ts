export interface UserResponseDto {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedUserResponse {
  data: UserResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}
