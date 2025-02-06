import { Router } from "express";
import middleware from "../middleware";
import { CreateRoomSchema } from "@repo/common/types";
import { prisma } from "@repo/db/prisma";


export const roomRouter = Router()

roomRouter.get('/', async (req, res) => {
    try {
        const rooms = await prisma.room.findMany()
        res.json({ rooms })
    } catch (error) {
        res.json({ message: 'Something went wrong' })
    }
})

roomRouter.post('/', async (req, res) => {
    const data = CreateRoomSchema.safeParse(req.body)
    if (!data.success) {
        res.json({ message: 'Incorrect data' })
        return;
    }

    console.log(data,"data");
    try {
        const room = await prisma.room.create({
            data: {
                slug: data.data.slug,
                adminId: data.data.adminId,
            }
        })

            console.log(room,"room after");
            

        if (!room) {
            res.json({ message: 'Room already exists' })
            return;
        }

        res.json({ room })
    } catch (error) {
        res.json({ message: 'Something went wrong' })
    }
})

roomRouter.get('/:roomId/shapes', async (req, res) => {
    try {
        const shapes = await prisma.shape.findMany({
            where: {
                roomId: req.params.roomId
            }
        })

        if (!shapes) {
            res.json({ message: 'Shapes does not exists' })
            return;
        }

        res.json({ shapes })
    } catch (error) {
        res.json({ message: 'Something went wrong' })
    }
})

