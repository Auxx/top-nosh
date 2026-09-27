export interface UserResponseDto {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaginatedUserResponse {
  data: UserResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateUserDto {
  fullName: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  password?: string;
}

export interface UsersFilter {
  page: number;
}

export const defaultUsersFilter = (): UsersFilter => ({
  page: 1
});
