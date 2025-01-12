import express from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@repo/backend-common/config'
import { CreateRoomSchema, CreateUserSchema, SigninSchema } from '@repo/common/types'
import { prisma } from '@repo/db/prisma'
import middleware from './middleware'

const app = express()
const PORT = process.env.PORT || 8000


app.post('/api/auth/signup', async (req, res) => {
    const data = CreateUserSchema.safeParse(req.body)
    if (!data.success) {
        res.json({ message: 'Incorrect data' })
        return;
    }

    const user = await prisma.user.create({
        data: {
            email: data.data.email,
            password: data.data.password,
            username: data.data.username,
            name: data.data.name,
        }
    })

    res.json({ user })
})

app.post('/api/auth/signin', async (req, res) => {
    const data = SigninSchema.safeParse(req.body)

    if (!data.success) {
        res.json({ message: 'Incorrect data' })
        return;
    }
    const user = await prisma.user.findUnique({
        where: {
            username: data.data.username,
            password: data.data.password,
        }
    })

    if (!user) {
        res.json({ message: 'Incorrect data' })
        return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET)
    res.json({ token })
})

app.post('/api/room', middleware, async (req, res) => {
    const data = CreateRoomSchema.safeParse(req.body)
    if (!data.success) {
        res.json({ message: 'Incorrect data' })
        return;
    }

    const room = await prisma.room.create({
        data: {
            slug: data.data.slug,
            adminId: data.data.adminId,
        }
    })
    res.json({ room })
    res.json({ roomId: 199 })
})

app.listen(PORT, () => {
    console.log(`Server running at PORT ${PORT}`);
})