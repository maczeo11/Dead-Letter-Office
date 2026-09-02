import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
}

export function bearer(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'missing Bearer token' } })
  }
  const token = header.slice(7)
  const secret = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-key-32b-min'
  try {
    const payload = jwt.verify(token, secret) as { sub: string }
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: { message: 'invalid token' } })
  }
}
