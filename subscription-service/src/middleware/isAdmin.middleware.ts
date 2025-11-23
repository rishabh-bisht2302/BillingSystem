import { Request, Response, NextFunction } from 'express';

export default function adminOnlyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = (req as any).user;
  if (!user || user.userType !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
}

