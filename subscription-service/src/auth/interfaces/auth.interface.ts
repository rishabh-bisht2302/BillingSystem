export interface GenerateTokenDto {
  name: string;
  userId: number;
  email: string;
  mobile: string;
  userType: string;
}

export interface TokenResponse {
  isProfileComplete?: boolean;
  accessToken: string;
  expiresIn: number;
}

