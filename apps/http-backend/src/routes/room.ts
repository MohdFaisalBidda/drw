import { Router } from "express";
import middleware from "../middleware";
import { CreateRoomSchema } from "@repo/common/types";
import { prisma } from "@repo/db/prisma";


export const roomRouter = Router()

roomRouter.post('/', middleware, async (req, res) => {
    const data = CreateRoomSchema.safeParse(req.body)
    if (!data.success) {
        res.json({ message: 'Incorrect data' })
        return;
    }

    try {
        const room = await prisma.room.create({
            data: {
                slug: data.data.slug,
                adminId: data.data.adminId,
            }
        })

        if (!room) {
            res.json({ message: 'Room already exists' })
            return;
        }

        res.json({ room })
    } catch (error) {
        res.json({ message: 'Something went wrong' })
    }
})

