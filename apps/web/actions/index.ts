"use server"

import { prisma } from "@repo/db/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";

export interface ICreateRoom {
    user: any
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

export const SigninAction = async ({ username, password }: { username: string, password: string }) => {
    try {
        const user = await fetch(`http://localhost:8000/api/auth/signin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password
            })
        })

        const userData = await user.json();
        console.log(userData, "userData");

        (await cookies()).set("token", userData.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
        })
        return userData;
    } catch (error) {
        console.log(error);
        return error
    }
}

export const createRoom = async ({ slug, user }: ICreateRoom) => {
    try {
        console.log(user, "user in createRoom before fetch");

        if (!user || !user.token || !user.id) {
            throw new Error("User authentication missing");
        }

        console.log(user, "user in createRoom before API call");

        const room = await fetch(`http://localhost:8000/api/room`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`
            },
            body: JSON.stringify({
                slug,
                adminId: user.id
            })
        });

        console.log(room, "room after fetch");

        if (!room.ok) {
            throw new Error(`API Error: ${room.status} ${room.statusText}`);
        }

        const roomData = await room.json();
        console.log(roomData, "roomData in createRoom");

        if (!roomData.room) {
            throw new Error(roomData.error || "Room creation failed");
        }

        return {
            success: true,
            data: {
                roomData: roomData.room
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
    const session = await getServerSession()
    if (!session?.user) {
        return {
            success: false,
            error: "Unauthorized"
        }
    }

    try {
        // const rooms = await fetch(`http://localhost:8000/api/room`, {
        //     method: "GET",
        //     headers: {
        //         "Content-Type": "application/json",
        //     },
        // })

        // const roomsData = await rooms.json()
        // console.log(roomsData, "roomsData herer");

        const rooms = await prisma.room.findMany({
            where: {
                adminId: session.user.id
            }
        })
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