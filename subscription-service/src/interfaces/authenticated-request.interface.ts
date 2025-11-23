import { Request } from 'express';

interface AuthenticatedUser {
  id: number;
  name?: string;
  email?: string;
  mobile?: string;
  userType: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

