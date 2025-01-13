import z from "zod"

export const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    username: z.string().min(3).max(20),
    name: z.string().optional(),
    photo: z.string().optional(),
})


export const SigninSchema = z.object({
    username: z.string(),
    password: z.string(),
})

export const CreateRoomSchema = z.object({
    slug: z.string(),
    adminId: z.string(),
})