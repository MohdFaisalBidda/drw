import { z } from 'zod'

export const CreateUserSchema = z.object({
    username: z.string(),
    password: z.string().min(8),
    name: z.string(),
    email: z.string().email(),
})


export const SigninSchema = z.object({
    username: z.string(),
    password: z.string(),
})

export const CreateRoomSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
})