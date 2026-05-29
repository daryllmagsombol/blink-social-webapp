export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
