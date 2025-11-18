import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/constants';
export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const userPayload = jwt.verify(token, config.JWT_SECRET);
        req.user = userPayload; 
        next();

    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

