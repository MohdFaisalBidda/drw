import { Router } from 'express'
import { prisma } from '@repo/db/prisma'
import { CreateUserSchema, SigninSchema } from '@repo/common/types'
import { JWT_SECRET } from '@repo/backend-common/config'
import jwt from 'jsonwebtoken'

export const authRouter = Router()
authRouter.post('/signup', async (req, res) => {
    const data = CreateUserSchema.safeParse(req.body)
    if (!data.success) {
        res.json({ message: 'Incorrect data' })
        return;
    }
    try {
        const user = await prisma.user.create({
            data: {
                email: data.data.email,
                password: data.data.password,
                username: data.data.username,
                name: data.data.name,
            }
        })

        if (!user) {
            res.json({ message: 'User already exists' })
            return;
        }

        res.json({ user })
    } catch (error) {
        res.json({ message: 'Something went wrong' })
    }
})

authRouter.post('/signin', async (req, res) => {
    const data = SigninSchema.safeParse(req.body)

    if (!data.success) {
        res.json({ message: 'Incorrect data' })
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                username: data.data.username,
                password: data.data.password,
            }
        })

        if (!user) {
            res.json({ message: 'Incorrect Credentials' })
            return;
        }

        const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET)
        res.json({ token })
    } catch (error) {
        res.json({ message: 'Something went wrong' })
    }
})