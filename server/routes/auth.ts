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
  try {
    const user = await prisma.user.create({ data: { email: email.trim().toLowerCase(), password: hash } })
    // init hygiene row
    await prisma.hygieneScore.create({ data: { userId: user.id, total: 0, hard: 0, soft: 0, score: 100 } })
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: '720h' })
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
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: '720h' })
  return res.json({ token, id: user.id, email: user.email })
})

export default router
