"use server"

import { cookies } from "next/headers";

export interface ICreateRoom {
    adminId: string;
    slug: string;
}

export interface ICreateUser {
    username: string;
    email: string;
    password: string;
}

export const createUser = async ({ username, email, password }: ICreateUser) => {
    try {
        const createdUser = await fetch(`http://localhost:8000/api/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        })

        const createdUserData = await createdUser.json()

        if (!createdUserData.success) {
            return {
                success: false,
                error: createdUserData.error
            }
        }

        const token = await SigninAction({ username: createdUserData.data.username, password: createdUserData.data.password });

        ((await cookies()).set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
        }))
        return {
            success: true,
            data: {
                token
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

export const createRoom = async ({ slug, adminId }: ICreateRoom) => {
    try {
        const room = await fetch(`http://localhost:8000/api/room`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                slug,
                adminId
            })
        })

        const roomData = await room.json()

        if (!roomData.success) {
            return {
                success: false,
                error: roomData.error
            }
        }


        return {
            success: true,
            data: {
                roomId: roomData.roomId
            }
        }
    } catch (error) {
        return {
            success: false,
            error
        }
    }
}


export const getAllRooms = async () => {
    try {
        const rooms = await fetch(`http://localhost:8000/api/room`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })

        const roomsData = await rooms.json()
        console.log(roomsData, "roomsData herer");

        return {
            success: true,
            data: {
                rooms: roomsData.rooms
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