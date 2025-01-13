import { prisma } from "@repo/db/prisma";
import { Router } from "express";



export const chatRouter = Router()

chatRouter.get('/', async (req, res) => {
    try {
        const chats = await prisma.chat.findMany({
            where: {
                userId: req.params.userId,
                roomId: req.params.roomId
            }
        })
        res.json({ chats })
    } catch (error) {
        res.json({ message: 'Something went wrong' })
    }
})