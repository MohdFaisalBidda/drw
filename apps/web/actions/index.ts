"use server"

import { prisma } from "@repo/db";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import authenticate from "@/lib/authenticate";

export interface ICreateRoom {
    slug: string;
}

export interface ICreateUser {
    username: string;
    email: string;
    password: string;
}

export const createUser = async ({ username, email, password }: ICreateUser) => {
    try {
        const hashedPass = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPass,
                username,
                name: username,
            }
        })

        if (!user) {
            return {
                success: false,
                error: "User already exists"
            }
        }

        return {
            success: true,
            data: {
                user
            }
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error
        }
    }
}

export const createRoom = async ({ slug }: ICreateRoom) => {
    const session = await authenticate()
    if (!session?.user) {
        return {
            success: false,
            error: "Unauthorized"
        }
    }

    try {
        const room = await prisma.room.create({
            data: {
                slug,
                adminId: session.user.id,
            }
        })

        console.log(room, "room after fetch");

        if (!room) {
            throw new Error(`Error creating room`);
        }

        return {
            success: true,
            data: {
                roomData: room
            }
        };
    } catch (error) {
        console.error(error, "Error in createRoom");
        return {
            success: false,
            error: error
        };
    }
};



export const getAllRooms = async () => {
    const session = await authenticate()
    if (!session?.user) {
        return {
            success: false,
            error: "Unauthorized"
        }
    }

    try {
        const rooms = await prisma.room.findMany()
        return {
            success: true,
            data: {
                rooms
            }
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error
        }

    }
}

export const getAllShapes = async (roomId: string) => {
    try {
        const shapes = prisma.shape.findMany({
            where: {
                roomId
            }
        })
        return shapes
    } catch (error) {
        console.log(error);
        return []
    }
}    