export interface GenerateTokenDto {
  name: string;
  userId: string;
  email: string;
  mobile: string;
  roles?: string[];
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

