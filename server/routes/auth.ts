import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string }
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: { message: 'email and password (min 8) required' } })
  }
  const hash = await bcrypt.hash(password, 10)
  const secret = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-key-32b-min'
  try {
    const user = await prisma.$transaction(async tx => {
      const u = await tx.user.create({ data: { email: email.trim().toLowerCase(), password: hash } })
      await tx.hygieneScore.create({ data: { userId: u.id, total: 0, hard: 0, soft: 0, score: 100 } })
      return u
    })
    const token = jwt.sign({ sub: user.id }, secret, { expiresIn: '720h' })
    return res.status(201).json({ id: user.id, email: user.email, token })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: { message: 'email already registered' } })
    }
    throw e
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string }
  const user = await prisma.user.findUnique({ where: { email: email?.trim().toLowerCase() } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: { message: 'invalid credentials' } })
  }
  const secret = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-key-32b-min'
  const token = jwt.sign({ sub: user.id }, secret, { expiresIn: '720h' })
  return res.json({ token, id: user.id, email: user.email })
})

export default router
