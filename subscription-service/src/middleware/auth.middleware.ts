import * as jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { config } from '../config/constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

export default async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.slice(7).trim();
  try {
    const userPayload = jwt.verify(token, config.JWT_SECRET as string);
    if (!userPayload || typeof userPayload !== 'object') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!('userId' in userPayload)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!userPayload.email && !userPayload.mobile && !userPayload.name) {
        const user = await this.userRepository.findOne({
            where: {
                id: userPayload.userId,
            },
        });
        userPayload.mobile = user?.mobile;
        userPayload.email = user?.email;
        userPayload.name = user?.name;
    };

    req.user = {
      id: userPayload.userId,
      name: userPayload.name,
      email: userPayload.email,
      mobile: userPayload.mobile,
      userType: userPayload.userType,
    };

    return next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

