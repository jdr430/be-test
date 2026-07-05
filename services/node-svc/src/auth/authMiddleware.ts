import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


interface JwtPayload {
    userId: string;
    email: string;
}

// Extend Express's Request type so req.user is recognised
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function createAuthMiddleware(jwtSecret: string) {
    return function authMiddleware(req: Request, res: Response, next: NextFunction): void {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'no token' });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
            req.user = decoded;
            next();
        } catch (err) {
            console.error('JWT verify failed:', err);
            res.status(401).json({ error: 'invalid token' });
        }
    };
}