import { prisma } from "@repo/db/prisma";
import { Request, Response, Router } from "express";



export const chatRouter = Router()

chatRouter.get('/', async (req: Request, res: Response) => {
    try {
        // const chats = await prisma.chat.findMany({
        //     where: {
        //         userId: req.params.userId,
        //         roomId: req.params.roomId
        //     }
        // })
        res.json({})
    } catch (error) {
        res.json({ message: 'Something went wrong' })
    }
})