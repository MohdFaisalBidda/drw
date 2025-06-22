"use server"

import { prisma } from "@repo/db";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import authenticate from "@/lib/authenticate";
import { revalidatePath } from "next/cache";

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

export const deleteRoom = async (roomId: string) => {
    const session = await authenticate();
    if (!session?.user) {
        return {
            success: false,
            error: "Unauthorized"
        }
    }

    try {
        // Delete all shapes first
        await prisma.shape.deleteMany({
            where: { roomId }
        });

        // Then delete the room
        await prisma.room.delete({
            where: { id: roomId }
        });

        // Revalidate the home page to reflect changes
        revalidatePath("/");
        revalidatePath(`/draw/${roomId}`);

        return {
            success: true,
            message: "Room deleted successfully"
        };
    } catch (error) {
        console.error("Error deleting room:", error);
        return {
            success: false,
            error: "Failed to delete room"
        };
    }
};

export const refreshRooms = async () => {
    const session = await authenticate();
    if (!session?.user) {
        return {
            success: false,
            error: "Unauthorized"
        }
    }

    try {
        revalidatePath("/");
        return {
            success: true,
            message: "Rooms refreshed successfully"
        };
    } catch (error) {
        console.error("Error refreshing rooms:", error);
        return {
            success: false,
            error: "Failed to refresh rooms"
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

export const checkRoomExists = async (roomId: string) => {
    const session = await authenticate()
    if (!session?.user) {
        return false
    }

    try {
        const rooms = await prisma.room.findUnique({
            where: {
                id: roomId
            }
        })
        if (!rooms) {
            return false
        }
        return true
    } catch (error) {
        console.log(error);
        return false

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
